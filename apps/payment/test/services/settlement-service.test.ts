// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it } from 'vitest';
import type { TransactionView } from '../../src/core/core-data.js';
import { CheckoutStatus } from '../../src/types/index.js';
import { ACCOUNT, aTransaction, anEvse, OTHER_TENANT, TENANT } from '../support/fakes.js';
import { aWorld } from '../support/world.js';
import { PaymentEventType } from '../../src/stripe/payment-provider.js';

type World = Awaited<ReturnType<typeof aWorld>>;

describe('SettlementService', () => {
  let world: World;
  let idToken: string;
  let transaction: TransactionView & { tenantId: number; ocppConnectionName: string };

  const ended = () => ({ tenantId: TENANT, ocppConnectionName: 'CS-1', transactionId: 'tx-1' });

  beforeEach(async () => {
    world = await aWorld();
    world.coreData.addEvse(anEvse());
    const { publicId } = await world.checkoutService.createCheckout(7);
    await world.startService.handlePaymentEvent({
      type: PaymentEventType.CheckoutCompleted,
      stripeAccountId: ACCOUNT,
      checkoutPublicId: publicId,
      paymentIntentId: 'pi_1',
      amountAuthorized: 5000,
    });
    idToken = world.idTokens.forCheckout(world.checkouts.only().id);
    transaction = {
      ...aTransaction({
        authorizationId: await world.coreData.ensureAuthorization(TENANT, idToken),
      }),
      tenantId: TENANT,
      ocppConnectionName: 'CS-1',
    };
    world.coreData.transactions.push(transaction);
  });

  async function start() {
    await world.settlementService.onTransactionStarted({
      tenantId: TENANT,
      ocppConnectionName: 'CS-1',
      idToken,
    });
  }

  function finish(totalKwh: number | null, timeSpentCharging: number | null) {
    Object.assign(transaction, { isActive: false, totalKwh, timeSpentCharging });
  }

  describe('onTransactionStarted', () => {
    it('links the checkout to the transaction its idToken started', async () => {
      await start();

      expect(world.checkouts.only()).toMatchObject({
        status: CheckoutStatus.Charging,
        transactionDatabaseId: 500,
      });
    });

    it('waits for Core to write the transaction', async () => {
      world.coreData.transactionDelay = 2;

      await start();

      expect(world.checkouts.only().transactionDatabaseId).toBe(500);
    });

    it('gives up when Core never writes it', async () => {
      world.coreData.transactionDelay = 5;

      await start();

      expect(world.checkouts.only().status).toBe(CheckoutStatus.StartRequested);
    });

    it.each([
      ['an idToken this app did not issue', 'RFID-1234'],
      ['another prefix', 'XPAY_1'],
    ])('ignores %s', async (_name, foreign) => {
      await world.settlementService.onTransactionStarted({
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
        idToken: foreign,
      });

      expect(world.checkouts.only().status).toBe(CheckoutStatus.StartRequested);
    });

    it('does not link a checkout of another tenant', async () => {
      await world.settlementService.onTransactionStarted({
        tenantId: OTHER_TENANT,
        ocppConnectionName: 'CS-1',
        idToken,
      });

      expect(world.checkouts.only().transactionDatabaseId).toBeNull();
    });
  });

  describe('onTransactionEnded', () => {
    beforeEach(start);

    it('captures what the session cost', async () => {
      finish(12.345, 300);

      await world.settlementService.onTransactionEnded(ended());

      // 12.345 kWh x 0.42 = 5.18, 5 min x 0.05 = 0.25, session 1.50; each +19% VAT, rounded down.
      const expected = 617 + 29 + 178;
      expect(world.payments.captures).toEqual([
        {
          account: ACCOUNT,
          paymentIntentId: 'pi_1',
          amount: expected,
          key: `${TENANT}:${world.checkouts.only().publicId}:capture`,
        },
      ]);
      expect(world.checkouts.only()).toMatchObject({
        status: CheckoutStatus.Captured,
        capturedAmount: expected,
      });
    });

    it('captures no more than the hold', async () => {
      finish(500, 3600);

      await world.settlementService.onTransactionEnded(ended());

      expect(world.payments.captures[0].amount).toBe(5000);
      expect(world.checkouts.only().capturedAmount).toBe(5000);
    });

    it('releases the hold when the session cost nothing', async () => {
      world.checkouts.only().tariffSnapshot = {
        ...world.checkouts.only().tariffSnapshot,
        pricePerSession: null,
      };
      finish(0, 0);

      await world.settlementService.onTransactionEnded(ended());

      expect(world.payments.captures).toEqual([]);
      expect(world.payments.cancels).toHaveLength(1);
      expect(world.checkouts.only()).toMatchObject({
        status: CheckoutStatus.Cancelled,
        capturedAmount: 0,
      });
    });

    it('captures once, however often the end is delivered', async () => {
      finish(10, 600);

      await world.settlementService.onTransactionEnded(ended());
      await world.settlementService.onTransactionEnded(ended());

      expect(world.payments.captures).toHaveLength(1);
    });

    it('waits for Core to finish the transaction', async () => {
      transaction.isActive = false;
      world.coreData.transactionDelay = 1;
      setTimeout(() => finish(10, 600), 0);

      await world.settlementService.onTransactionEnded(ended());

      expect(world.payments.captures).toHaveLength(1);
    });

    it('leaves the checkout uncaptured when the final figures never arrive', async () => {
      finish(null, 600);

      await world.settlementService.onTransactionEnded(ended());

      expect(world.payments.captures).toEqual([]);
      expect(world.checkouts.only().status).toBe(CheckoutStatus.Charging);
    });

    it('marks the checkout failed when Stripe refuses the capture', async () => {
      world.payments.failCaptures = true;
      finish(10, 600);

      await world.settlementService.onTransactionEnded(ended());

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Failed);
    });

    it('ignores a transaction no checkout paid for', async () => {
      world.coreData.transactions.push({
        ...aTransaction({
          id: 501,
          transactionId: 'tx-other',
          isActive: false,
          totalKwh: 5,
          timeSpentCharging: 60,
        }),
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
      });

      await world.settlementService.onTransactionEnded({ ...ended(), transactionId: 'tx-other' });

      expect(world.payments.captures).toEqual([]);
    });
  });
});
