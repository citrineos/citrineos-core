// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it } from 'vitest';
import { PaymentError, PaymentErrorCode } from '../../src/services/errors.js';
import { CheckoutFlow, CheckoutStatus } from '../../src/types/index.js';
import { ACCOUNT, aTariff, aTransaction, anEvse, OTHER_TENANT, TENANT } from '../support/fakes.js';
import { aWorld, PUBLIC_URL } from '../support/world.js';
import { ConnectorStatusEnum } from '@citrineos/types';

type World = Awaited<ReturnType<typeof aWorld>>;

async function rejection(promise: Promise<unknown>): Promise<PaymentError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  if (!(error instanceof PaymentError)) {
    throw new Error(`Expected a PaymentError, got ${String(error)}`);
  }
  return error;
}

describe('CheckoutService', () => {
  let world: World;

  beforeEach(async () => {
    world = await aWorld();
    world.coreData.addEvse(anEvse());
  });

  describe('findEvse', () => {
    it.each([
      ['its database id', '7'],
      ['its eMI3 id', 'US*CIT*E7'],
      ['its eMI3 id without separators, in any case', ' uscite7 '],
    ])('finds an EVSE by %s', async (_name, query) => {
      expect(await world.checkoutService.findEvse(query)).toEqual({ evseId: 7 });
    });

    it.each([
      ['an unknown eMI3 id', 'US*CIT*E99'],
      ['an unknown database id', '99'],
    ])('does not find %s', async (_name, query) => {
      expect((await rejection(world.checkoutService.findEvse(query))).code).toBe(
        PaymentErrorCode.NotFound,
      );
    });

    it('finds nothing when two EVSEs share an eMI3 id', async () => {
      world.coreData.addEvse(anEvse({ id: 8, tenantId: OTHER_TENANT, evseId: 'US*CIT*E7' }));

      expect((await rejection(world.checkoutService.findEvse('US*CIT*E7'))).code).toBe(
        PaymentErrorCode.NotFound,
      );
    });
  });

  describe('describeEvse', () => {
    it('shows where the EVSE is, who runs it, and whether and on what terms it takes payment', async () => {
      await world.accounts.create(OTHER_TENANT, {
        stripeAccountId: 'acct_other',
        termsUrl: 'https://other.example.com/terms',
      });
      world.coreData.addEvse(anEvse({ id: 8, tenantId: OTHER_TENANT, operatorName: 'Other' }));
      world.coreData.addEvse(anEvse({ id: 9, tenantId: 3, location: null }));

      expect(await world.checkoutService.describeEvse(7)).toMatchObject({
        location: { address: '1 Main Street', city: 'Boston' },
        operatorName: 'CitrineOS',
        payable: true,
        termsUrl: null,
      });
      expect(await world.checkoutService.describeEvse(8)).toMatchObject({
        operatorName: 'Other',
        payable: true,
        termsUrl: 'https://other.example.com/terms',
      });
      expect(await world.checkoutService.describeEvse(9)).toMatchObject({
        location: null,
        payable: false,
      });
    });

    it.each(['javascript:alert(1)', 'not a url'])('hands out no terms at %s', async (termsUrl) => {
      world.accounts.accounts[0].termsUrl = termsUrl;

      expect((await world.checkoutService.describeEvse(7)).termsUrl).toBeNull();
    });

    it('shows each connector with its tariff, the hold in minor units', async () => {
      const offer = await world.checkoutService.describeEvse(7);

      expect(offer).toMatchObject({ id: 7, evseId: 'US*CIT*E7', stationOnline: true });
      expect(offer.connectors[0].tariff).toEqual({
        currency: 'USD',
        pricePerKwh: 0.42,
        pricePerMin: 0.05,
        pricePerSession: 1.5,
        taxRate: 19,
        authorizationAmount: 5000,
      });
    });

    it('shows a connector without a tariff as such', async () => {
      world.coreData.addEvse(anEvse({ id: 8 }), null);

      expect((await world.checkoutService.describeEvse(8)).connectors[0].tariff).toBeNull();
    });

    it.each([
      ['an unknown EVSE', 99],
      ['a removed EVSE', 8],
    ])('does not show %s', async (_name, evseId) => {
      world.coreData.addEvse(anEvse({ id: 8, removed: true }));

      expect((await rejection(world.checkoutService.describeEvse(evseId))).code).toBe(
        PaymentErrorCode.NotFound,
      );
    });
  });

  describe('createCheckout', () => {
    it('creates a checkout on the tenant’s account and a Stripe session for the hold', async () => {
      const started = await world.checkoutService.createCheckout(7);

      const checkout = world.checkouts.only();
      expect(checkout).toMatchObject({
        tenantId: TENANT,
        stripeAccountId: ACCOUNT,
        flow: CheckoutFlow.WebPortal,
        status: CheckoutStatus.Created,
        connectorId: 70,
        tariffSnapshot: aTariff(),
      });
      expect(started).toEqual({
        publicId: checkout.publicId,
        url: `https://checkout.stripe.test/${checkout.publicId}`,
      });
      expect(world.payments.sessions).toEqual([
        {
          stripeAccountId: ACCOUNT,
          checkoutPublicId: checkout.publicId,
          tenantId: TENANT,
          currency: 'USD',
          authorizationAmount: 5000,
          successUrl: `${PUBLIC_URL}/charging/${checkout.publicId}`,
          cancelUrl: `${PUBLIC_URL}/checkout/7`,
        },
      ]);
    });

    it('resolves the tenant from the EVSE', async () => {
      await world.accounts.create(OTHER_TENANT, { stripeAccountId: 'acct_other' });
      world.coreData.addEvse(anEvse({ id: 8, tenantId: OTHER_TENANT }));

      await world.checkoutService.createCheckout(8);

      expect(world.checkouts.only()).toMatchObject({
        tenantId: OTHER_TENANT,
        stripeAccountId: 'acct_other',
      });
    });

    it('needs the connector named when the EVSE has several', async () => {
      const evse = anEvse({ id: 8 });
      evse.connectors.push({ ...evse.connectors[0], id: 71 });
      world.coreData.addEvse(evse);

      expect((await rejection(world.checkoutService.createCheckout(8))).code).toBe(
        PaymentErrorCode.Invalid,
      );
      await world.checkoutService.createCheckout(8, 71);
      expect(world.checkouts.only().connectorId).toBe(71);
    });

    it('refuses a connector of another EVSE', async () => {
      expect((await rejection(world.checkoutService.createCheckout(7, 71))).code).toBe(
        PaymentErrorCode.NotFound,
      );
    });

    it.each([ConnectorStatusEnum.Unavailable, ConnectorStatusEnum.Faulted])(
      'refuses a connector that is %s',
      async (status) => {
        const evse = anEvse({ id: 8 });
        evse.connectors[0].status = status;
        world.coreData.addEvse(evse);

        expect((await rejection(world.checkoutService.createCheckout(8))).code).toBe(
          PaymentErrorCode.Unavailable,
        );
      },
    );

    it('refuses a station that has never connected', async () => {
      const evse = anEvse({ id: 8 });
      evse.station.protocol = null;
      world.coreData.addEvse(evse);

      expect((await rejection(world.checkoutService.createCheckout(8))).code).toBe(
        PaymentErrorCode.Unavailable,
      );
    });

    it.each([
      ['no tariff', null],
      ['no authorization amount', aTariff({ authorizationAmount: null })],
      ['a zero authorization amount', aTariff({ authorizationAmount: 0 })],
      ['a currency Core cannot price in', aTariff({ currency: 'JPY' })],
    ])('refuses a connector with %s', async (_name, tariff) => {
      world.coreData.addEvse(anEvse({ id: 8 }), tariff);

      expect((await rejection(world.checkoutService.createCheckout(8))).code).toBe(
        PaymentErrorCode.NotPayable,
      );
      expect(world.checkouts.checkouts).toEqual([]);
    });

    it('refuses a tenant without a payment account', async () => {
      world.coreData.addEvse(anEvse({ id: 8, tenantId: OTHER_TENANT }));

      expect((await rejection(world.checkoutService.createCheckout(8))).code).toBe(
        PaymentErrorCode.NotPayable,
      );
    });

    it('marks the checkout failed when Stripe refuses the session', async () => {
      world.payments.failSessions = true;

      await expect(world.checkoutService.createCheckout(7)).rejects.toThrow('Stripe is down');
      expect(world.checkouts.only().status).toBe(CheckoutStatus.Failed);
    });
  });

  describe('getState', () => {
    it('prices the session from Core’s transaction', async () => {
      const { publicId } = await world.checkoutService.createCheckout(7);
      const checkout = world.checkouts.only();
      checkout.status = CheckoutStatus.Charging;
      checkout.transactionDatabaseId = 500;
      world.coreData.transactions.push({
        ...aTransaction({ totalKwh: 10, timeSpentCharging: 600 }),
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
      });

      const state = await world.checkoutService.getState(publicId);

      expect(state).toMatchObject({
        status: CheckoutStatus.Charging,
        transaction: { isActive: true },
        pricing: { energyCosts: 420, timeCosts: 50, sessionCosts: 150, totalCostsNet: 620 },
      });
    });

    it('shows the tariff it was priced with and where the session runs', async () => {
      const { publicId } = await world.checkoutService.createCheckout(7);
      world.coreData.tariffs.set(`${TENANT}:70`, aTariff({ pricePerKwh: 0.99 }));

      expect(await world.checkoutService.getState(publicId)).toMatchObject({
        flow: CheckoutFlow.WebPortal,
        tariff: { pricePerKwh: 0.42, taxRate: 19, authorizationAmount: 5000 },
        evse: {
          id: 7,
          evseId: 'US*CIT*E7',
          location: { city: 'Boston' },
          operatorName: 'CitrineOS',
        },
      });
    });

    it('has no pricing before the session starts', async () => {
      const { publicId } = await world.checkoutService.createCheckout(7);

      expect(await world.checkoutService.getState(publicId)).toMatchObject({
        transaction: null,
        pricing: null,
      });
    });

    it('does not know an unknown checkout', async () => {
      expect(
        (await rejection(world.checkoutService.getState('00000000-0000-4000-8000-000000000000')))
          .code,
      ).toBe(PaymentErrorCode.NotFound);
    });
  });
});
