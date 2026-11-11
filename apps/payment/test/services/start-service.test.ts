// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPVersion, RequestStartStopStatusEnum } from '@citrineos/types';
import { beforeEach, describe, expect, it } from 'vitest';
import type { CheckoutCompletedEvent } from '../../src/stripe/payment-provider.js';
import { CheckoutStatus, RemoteStartStatus } from '../../src/types/index.js';
import { ACCOUNT, anEvse, OTHER_TENANT, TENANT } from '../support/fakes.js';
import { aWorld, INTERNAL_URL } from '../support/world.js';
import { PaymentErrorCode } from '../../src/services/errors.js';
import { PaymentEventType } from '../../src/stripe/payment-provider.js';

type World = Awaited<ReturnType<typeof aWorld>>;

describe('StartService', () => {
  let world: World;
  let publicId: string;

  function paid(overrides: Partial<CheckoutCompletedEvent> = {}): CheckoutCompletedEvent {
    return {
      type: PaymentEventType.CheckoutCompleted,
      stripeAccountId: ACCOUNT,
      checkoutPublicId: publicId,
      paymentIntentId: 'pi_1',
      amountAuthorized: 5000,
      ...overrides,
    };
  }

  beforeEach(async () => {
    world = await aWorld();
    world.coreData.addEvse(anEvse());
    ({ publicId } = await world.checkoutService.createCheckout(7));
  });

  describe('handlePaymentEvent', () => {
    it('records the hold and asks Core to start the session', async () => {
      await world.startService.handlePaymentEvent(paid());

      const checkout = world.checkouts.only();
      expect(checkout).toMatchObject({
        status: CheckoutStatus.StartRequested,
        paymentIntentId: 'pi_1',
        authorizedAmount: 5000,
      });
      expect(world.coreData.authorizations.get(`${TENANT}:PAY_${checkout.id}`)).toBeDefined();
      const [request] = world.coreApi.requests;
      expect(request).toMatchObject({
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
        protocol: OCPPVersion.OCPP2_0_1,
        idToken: `PAY_${checkout.id}`,
        evseTypeId: 1,
        ocpp16ConnectorId: null,
        remoteStartId: 1,
        maxCost: 50,
      });
      const callback = new URL(request.callbackUrl);
      expect(callback.origin + callback.pathname).toBe(
        `${INTERNAL_URL}/api/callbacks/remote-start/${publicId}`,
      );
      expect(world.signer.verify(publicId, callback.searchParams.get('signature')!)).toBe(true);
    });

    it('starts an OCPP 1.6 session on the station-wide connector number', async () => {
      const evse = anEvse({ id: 8 });
      evse.station.protocol = OCPPVersion.OCPP1_6;
      evse.connectors[0] = { ...evse.connectors[0], id: 80, connectorId: 2 };
      world.coreData.addEvse(evse);
      const { publicId: oneSix } = await world.checkoutService.createCheckout(8);

      await world.startService.handlePaymentEvent(paid({ checkoutPublicId: oneSix }));

      expect(world.coreApi.requests[0]).toMatchObject({
        protocol: OCPPVersion.OCPP1_6,
        evseTypeId: null,
        ocpp16ConnectorId: 2,
        remoteStartId: null,
      });
    });

    it('acts on a payment once, however often Stripe sends it', async () => {
      await world.startService.handlePaymentEvent(paid());
      await world.startService.handlePaymentEvent(paid());

      expect(world.coreApi.requests).toHaveLength(1);
    });

    it.each([
      ['an unknown connected account', { stripeAccountId: 'acct_stranger' }],
      ['an unknown checkout', { checkoutPublicId: '00000000-0000-4000-8000-000000000000' }],
    ])('ignores a payment from %s', async (_name, overrides) => {
      await world.startService.handlePaymentEvent(paid(overrides));

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Created);
      expect(world.coreApi.requests).toEqual([]);
    });

    it('ignores a payment on another tenant’s account', async () => {
      await world.accounts.create(OTHER_TENANT, { stripeAccountId: 'acct_other' });

      await world.startService.handlePaymentEvent(paid({ stripeAccountId: 'acct_other' }));

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Created);
    });

    it('ignores events it does not act on', async () => {
      await world.startService.handlePaymentEvent({
        type: PaymentEventType.Unhandled,
        stripeType: 'charge.refunded',
      });

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Created);
    });

    it.each([
      ['Core does not send it', { sent: false, detail: 'station offline' }],
      ['the request fails', new Error('connection refused')],
    ])('releases the hold when %s', async (_name, result) => {
      world.coreApi.result = result;

      await world.startService.handlePaymentEvent(paid());

      expect(world.checkouts.only()).toMatchObject({
        status: CheckoutStatus.Cancelled,
        remoteStartStatus: RemoteStartStatus.Rejected,
      });
      expect(world.payments.cancels).toEqual([
        { account: ACCOUNT, paymentIntentId: 'pi_1', key: `${TENANT}:${publicId}:cancel` },
      ]);
    });
  });

  describe('handleRemoteStartAnswer', () => {
    beforeEach(async () => {
      await world.startService.handlePaymentEvent(paid());
    });

    it('records that the station accepted', async () => {
      await world.startService.handleRemoteStartAnswer(publicId, world.signer.sign(publicId), {
        status: RequestStartStopStatusEnum.Accepted,
      });

      expect(world.checkouts.only()).toMatchObject({
        status: CheckoutStatus.StartRequested,
        remoteStartStatus: RemoteStartStatus.Accepted,
      });
    });

    it.each([
      [RequestStartStopStatusEnum.Rejected, { status: RequestStartStopStatusEnum.Rejected }],
      ['an error', { code: 'InternalError', description: 'boom' }],
    ])('releases the hold when the station answers %s', async (_name, answer) => {
      await world.startService.handleRemoteStartAnswer(
        publicId,
        world.signer.sign(publicId),
        answer,
      );

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Cancelled);
      expect(world.payments.cancels).toHaveLength(1);
    });

    it('does not cancel a session that is already charging', async () => {
      world.checkouts.only().status = CheckoutStatus.Charging;

      await world.startService.handleRemoteStartAnswer(publicId, world.signer.sign(publicId), {
        status: RequestStartStopStatusEnum.Rejected,
      });

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Charging);
      expect(world.payments.cancels).toEqual([]);
    });

    it('refuses an answer that Core did not sign', async () => {
      await expect(
        world.startService.handleRemoteStartAnswer(publicId, 'forged', {
          status: RequestStartStopStatusEnum.Rejected,
        }),
      ).rejects.toMatchObject({ code: PaymentErrorCode.Forbidden });
      expect(world.checkouts.only().status).toBe(CheckoutStatus.StartRequested);
    });
  });
});
