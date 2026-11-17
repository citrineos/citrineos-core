// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPVersion } from '@citrineos/types';
import { beforeEach, describe, expect, it } from 'vitest';
import type { TransactionView } from '../../src/core/core-data.js';
import { PaymentError } from '../../src/services/errors.js';
import { CheckoutFlow, CheckoutStatus } from '../../src/types/index.js';
import { ACCOUNT, aTariff, aTransaction, anEvse, OTHER_TENANT, TENANT } from '../support/fakes.js';
import { aWorld, PUBLIC_URL } from '../support/world.js';
import { PaymentEventType } from '../../src/stripe/payment-provider.js';

type World = Awaited<ReturnType<typeof aWorld>>;

describe('ScanAndChargeService', () => {
  let world: World;
  let transaction: TransactionView & { tenantId: number; ocppConnectionName: string };

  const pluggedIn = () =>
    world.scanAndChargeService.onTransactionPluggedIn({
      tenantId: TENANT,
      ocppConnectionName: 'CS-1',
      transactionId: 'tx-1',
    });

  const paid = (paymentIntentId = 'pi_1') =>
    world.startService.handlePaymentEvent({
      type: PaymentEventType.CheckoutCompleted,
      stripeAccountId: ACCOUNT,
      checkoutPublicId: world.checkouts.only().publicId,
      paymentIntentId,
      amountAuthorized: 5000,
    });

  beforeEach(async () => {
    world = await aWorld();
    world.accounts.accounts[0].scanAndChargeEnabled = true;
    world.coreData.addEvse(anEvse());
    transaction = {
      ...aTransaction({ authorizationId: undefined }),
      tenantId: TENANT,
      ocppConnectionName: 'CS-1',
    };
    world.coreData.transactions.push(transaction);
  });

  describe('onTransactionPluggedIn', () => {
    it('opens a checkout for the transaction and shows its QR code on the station', async () => {
      await pluggedIn();

      const checkout = world.checkouts.only();
      expect(checkout).toMatchObject({
        flow: CheckoutFlow.ScanAndCharge,
        status: CheckoutStatus.Created,
        stripeAccountId: ACCOUNT,
        connectorId: 70,
        transactionDatabaseId: 500,
        qrDisplayMessageId: checkout.id,
      });
      expect(world.coreApi.displayMessages).toEqual([
        {
          tenantId: TENANT,
          ocppConnectionName: 'CS-1',
          protocol: OCPPVersion.OCPP2_0_1,
          id: checkout.id,
          transactionId: 'tx-1',
          uri: `${PUBLIC_URL}/api/checkouts/${checkout.publicId}/qr.png`,
        },
      ]);
    });

    it('waits for Core to write the transaction', async () => {
      world.coreData.transactionDelay = 2;

      await pluggedIn();

      expect(world.checkouts.only().transactionDatabaseId).toBe(500);
    });

    it('opens one checkout however often the message comes', async () => {
      await pluggedIn();
      await pluggedIn();

      expect(world.checkouts.checkouts).toHaveLength(1);
      expect(world.coreApi.displayMessages).toHaveLength(1);
    });

    it('takes the EVSE’s only connector when the station did not name one', async () => {
      Object.assign(transaction, { connectorId: undefined });

      await pluggedIn();

      expect(world.checkouts.only().connectorId).toBe(70);
    });

    it.each([
      [
        'the tenant has not turned scan and charge on',
        (w: World) => (w.accounts.accounts[0].scanAndChargeEnabled = false),
      ],
      ['the tenant has no payment account', (w: World) => (w.accounts.accounts = [])],
      ['Core never writes the transaction', (w: World) => (w.coreData.transactionDelay = 5)],
      ['the transaction is already over', () => Object.assign(transaction, { isActive: false })],
      [
        'the station named no connector and the EVSE is unknown',
        () => Object.assign(transaction, { connectorId: undefined, evseId: undefined }),
      ],
      ['the connector has no tariff', (w: World) => w.coreData.tariffs.clear()],
      [
        'the tariff holds nothing',
        (w: World) =>
          w.coreData.tariffs.set(`${TENANT}:70`, aTariff({ authorizationAmount: null })),
      ],
    ])('does nothing when %s', async (_name, arrange) => {
      arrange(world);

      await pluggedIn();

      expect(world.checkouts.checkouts).toHaveLength(0);
      expect(world.coreApi.displayMessages).toHaveLength(0);
    });

    it('keeps the checkout without a QR code when Core does not show it', async () => {
      world.coreApi.displayResult = { sent: false, detail: 'offline' };

      await pluggedIn();

      expect(world.checkouts.only()).toMatchObject({
        status: CheckoutStatus.Created,
        qrDisplayMessageId: null,
      });
    });
  });

  describe('paying', () => {
    beforeEach(async () => {
      await pluggedIn();
    });

    it('sends the driver to a Stripe Checkout Session for the hold', async () => {
      const { publicId } = world.checkouts.only();

      const url = await world.scanAndChargeService.paymentUrl(publicId);

      expect(url).toBe(`https://checkout.stripe.test/${publicId}`);
      expect(world.payments.sessions).toEqual([
        {
          stripeAccountId: ACCOUNT,
          checkoutPublicId: publicId,
          tenantId: TENANT,
          currency: 'USD',
          authorizationAmount: 5000,
          successUrl: `${PUBLIC_URL}/charging/${publicId}`,
          cancelUrl: `${PUBLIC_URL}/charging/${publicId}`,
        },
      ]);
    });

    it('sends the driver to the session once paid', async () => {
      const { publicId } = world.checkouts.only();
      await paid();

      expect(await world.scanAndChargeService.paymentUrl(publicId)).toBe(
        `${PUBLIC_URL}/charging/${publicId}`,
      );

      expect(world.payments.sessions).toHaveLength(0);
    });

    it('starts the plugged-in transaction with the paid hold, then takes the QR code down', async () => {
      await paid();

      const checkout = world.checkouts.only();
      expect(checkout).toMatchObject({
        status: CheckoutStatus.StartRequested,
        paymentIntentId: 'pi_1',
        authorizedAmount: 5000,
      });
      expect(world.coreApi.requests).toEqual([
        expect.objectContaining({
          ocppConnectionName: 'CS-1',
          protocol: OCPPVersion.OCPP2_0_1,
          idToken: `PAY_${checkout.id}`,
          evseTypeId: 1,
          remoteStartId: 1,
        }),
      ]);
      expect(world.coreApi.clearedMessages).toEqual([
        {
          tenantId: TENANT,
          ocppConnectionName: 'CS-1',
          protocol: OCPPVersion.OCPP2_0_1,
          id: checkout.id,
        },
      ]);
    });

    it('charges the session once the station authorises it and it ends', async () => {
      await paid();
      const idToken = `PAY_${world.checkouts.only().id}`;
      transaction.authorizationId = (await world.coreData.readAuthorizationId(TENANT, idToken))!;

      await world.settlementService.onTransactionStarted({
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
        idToken,
        transactionId: 'tx-1',
      });
      expect(world.checkouts.only()).toMatchObject({
        status: CheckoutStatus.Charging,
        transactionDatabaseId: 500,
      });

      Object.assign(transaction, { isActive: false, totalKwh: 10, timeSpentCharging: 1800 });
      await world.settlementService.onTransactionEnded({
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
        transactionId: 'tx-1',
      });

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Captured);
      expect(world.payments.captures).toEqual([
        expect.objectContaining({ paymentIntentId: 'pi_1' }),
      ]);
    });

    it('releases a hold paid after the EV was unplugged', async () => {
      Object.assign(transaction, { isActive: false });

      await paid();

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Cancelled);
      expect(world.coreApi.requests).toHaveLength(0);
      expect(world.payments.cancels).toEqual([
        expect.objectContaining({ account: ACCOUNT, paymentIntentId: 'pi_1' }),
      ]);
    });

    it('withdraws the checkout when the EV leaves unpaid, and releases a hold paid later', async () => {
      Object.assign(transaction, { isActive: false });
      await world.settlementService.onTransactionEnded({
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
        transactionId: 'tx-1',
      });
      const checkout = world.checkouts.only();
      expect(checkout.status).toBe(CheckoutStatus.Cancelled);
      expect(world.payments.cancels).toHaveLength(0);

      await paid('pi_late');

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Cancelled);
      expect(world.payments.cancels).toEqual([
        {
          account: ACCOUNT,
          paymentIntentId: 'pi_late',
          key: `${TENANT}:${checkout.publicId}:cancel:pi_late`,
        },
      ]);
    });

    it('releases the hold when the EV leaves before the station takes the payment', async () => {
      await paid();
      Object.assign(transaction, { isActive: false });

      await world.settlementService.onTransactionEnded({
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
        transactionId: 'tx-1',
      });

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Cancelled);
      expect(world.payments.cancels).toEqual([
        expect.objectContaining({ paymentIntentId: 'pi_1' }),
      ]);
    });
  });

  describe('onTransactionAuthorized', () => {
    beforeEach(async () => {
      await pluggedIn();
      // Core links the transaction to the card's Authorization.
      transaction.authorizationId = 901;
    });

    const authorized = (idToken: string, tenantId = TENANT) =>
      world.scanAndChargeService.onTransactionAuthorized({
        tenantId,
        ocppConnectionName: 'CS-1',
        idToken,
        transactionId: 'tx-1',
      });

    it('withdraws the checkout and its QR code when another token authorised the transaction', async () => {
      await authorized('RFID-123');

      const checkout = world.checkouts.only();
      expect(checkout.status).toBe(CheckoutStatus.Cancelled);
      expect(world.coreApi.clearedMessages).toEqual([
        expect.objectContaining({ ocppConnectionName: 'CS-1', id: checkout.id }),
      ]);
    });

    it('keeps the checkout open when Core did not know the token', async () => {
      transaction.authorizationId = undefined;

      await authorized('RFID-UNKNOWN');

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Created);
      expect(world.coreApi.clearedMessages).toHaveLength(0);
    });

    it('leaves the checkout alone when its own token authorised the transaction', async () => {
      await authorized(`PAY_${world.checkouts.only().id}`);

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Created);
      expect(world.coreApi.clearedMessages).toHaveLength(0);
    });

    it('leaves another tenant’s checkout alone', async () => {
      await authorized('RFID-123', OTHER_TENANT);

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Created);
    });

    it('leaves a paid checkout alone', async () => {
      await paid();

      await authorized('RFID-123');

      expect(world.checkouts.only().status).toBe(CheckoutStatus.StartRequested);
    });
  });

  describe('qrCode', () => {
    it('draws the QR code as a PNG', async () => {
      await pluggedIn();

      const png = await world.scanAndChargeService.qrCode(world.checkouts.only().publicId);

      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    });

    it('has none for a web-portal checkout', async () => {
      const { publicId } = await world.checkoutService.createCheckout(7);

      await expect(world.scanAndChargeService.qrCode(publicId)).rejects.toThrow(PaymentError);
      await expect(world.scanAndChargeService.paymentUrl(publicId)).rejects.toThrow(PaymentError);
    });
  });
});
