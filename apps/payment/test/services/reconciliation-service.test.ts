// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it } from 'vitest';
import type { TransactionView } from '../../src/core/core-data.js';
import type { CheckoutDto } from '../../src/types/index.js';
import { CheckoutFlow, CheckoutStatus, RemoteStartStatus } from '../../src/types/index.js';
import { ACCOUNT, aTransaction, anEvse, TENANT } from '../support/fakes.js';
import { aWorld, STALE_AFTER_MS } from '../support/world.js';
import { ReconcileOutcome } from '../../src/services/reconciliation-service.js';
import { PaymentEventType } from '../../src/stripe/payment-provider.js';

type World = Awaited<ReturnType<typeof aWorld>>;

describe('ReconciliationService', () => {
  let world: World;

  beforeEach(async () => {
    world = await aWorld();
    world.coreData.addEvse(anEvse());
  });

  /** Moves the sweep's clock on, past the time a checkout counts as stuck. */
  function later(ms = STALE_AFTER_MS + 1) {
    world.clock.now = new Date(world.checkouts.now.getTime() + ms);
  }

  async function aPaidCheckout(): Promise<CheckoutDto> {
    const { publicId } = await world.checkoutService.createCheckout(7);
    await world.startService.handlePaymentEvent({
      type: PaymentEventType.CheckoutCompleted,
      stripeAccountId: ACCOUNT,
      checkoutPublicId: publicId,
      paymentIntentId: 'pi_1',
      amountAuthorized: 5000,
    });
    return world.checkouts.only();
  }

  async function aTransactionOf(
    checkout: CheckoutDto,
    overrides: Partial<TransactionView> = {},
  ): Promise<TransactionView> {
    const authorizationId = await world.coreData.ensureAuthorization(
      TENANT,
      world.idTokens.forCheckout(checkout.id),
    );
    const transaction = {
      ...aTransaction({ authorizationId, ...overrides }),
      tenantId: TENANT,
      ocppConnectionName: 'CS-1',
    };
    world.coreData.transactions.push(transaction);
    return transaction;
  }

  const SETTLED = { isActive: false, totalKwh: 10, timeSpentCharging: 1800 };

  it('leaves checkouts alone until they have been stuck for a while', async () => {
    await aPaidCheckout();
    later(STALE_AFTER_MS - 1);

    expect(await world.reconciliationService.sweep()).toBe(0);
    expect(world.checkouts.only().status).toBe(CheckoutStatus.StartRequested);
  });

  describe('a paid checkout whose session was never linked', () => {
    it('is linked to the transaction the station did start', async () => {
      const checkout = await aPaidCheckout();
      await aTransactionOf(checkout);
      later();

      expect(await world.reconciliationService.sweep()).toBe(1);

      expect(world.checkouts.only()).toMatchObject({
        status: CheckoutStatus.Charging,
        transactionDatabaseId: 500,
        remoteStartStatus: RemoteStartStatus.Accepted,
      });
    });

    it('is settled at once when that transaction is already over', async () => {
      const checkout = await aPaidCheckout();
      await aTransactionOf(checkout, SETTLED);

      expect(await world.reconciliationService.reconcile(checkout)).toBe(ReconcileOutcome.Settled);

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Captured);
      expect(world.payments.captures).toEqual([
        expect.objectContaining({ paymentIntentId: 'pi_1', amount: 855 }),
      ]);
    });

    it('takes no transaction its idToken started before the checkout existed', async () => {
      const checkout = await aPaidCheckout();
      // E.g. an earlier session started with the same idToken.
      await aTransactionOf(checkout, { ...SETTLED, startTime: '2026-09-01T10:00:00.000Z' });

      expect(await world.reconciliationService.reconcile(checkout)).toBe(
        ReconcileOutcome.Cancelled,
      );
      expect(world.payments.captures).toHaveLength(0);
    });

    it('releases the hold when the station never started one', async () => {
      const checkout = await aPaidCheckout();

      expect(await world.reconciliationService.reconcile(checkout)).toBe(
        ReconcileOutcome.Cancelled,
      );

      expect(world.checkouts.only()).toMatchObject({
        status: CheckoutStatus.Cancelled,
        remoteStartStatus: RemoteStartStatus.Rejected,
      });
      expect(world.payments.cancels).toEqual([
        expect.objectContaining({ paymentIntentId: 'pi_1' }),
      ]);
    });
  });

  describe('a charging checkout', () => {
    let checkout: CheckoutDto;
    let transaction: TransactionView;

    beforeEach(async () => {
      checkout = await aPaidCheckout();
      transaction = await aTransactionOf(checkout);
      await world.settlementService.onTransactionStarted({
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
        idToken: world.idTokens.forCheckout(checkout.id),
      });
      checkout = world.checkouts.only();
    });

    it('is captured once Core has the ended transaction’s figures', async () => {
      Object.assign(transaction, SETTLED);

      expect(await world.reconciliationService.reconcile(checkout)).toBe(ReconcileOutcome.Settled);
      expect(world.checkouts.only()).toMatchObject({
        status: CheckoutStatus.Captured,
        capturedAmount: 855,
      });
    });

    it('waits while the session runs, or the figures are missing', async () => {
      expect(await world.reconciliationService.reconcile(checkout)).toBe(ReconcileOutcome.Waiting);

      Object.assign(transaction, { isActive: false });
      expect(await world.reconciliationService.reconcile(checkout)).toBe(ReconcileOutcome.Waiting);

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Charging);
      expect(world.payments.captures).toHaveLength(0);
    });

    it('has an interrupted capture retried with the same idempotency key', async () => {
      Object.assign(transaction, SETTLED);
      world.checkouts.only().status = CheckoutStatus.Capturing;

      await world.reconciliationService.reconcile(world.checkouts.only());

      expect(world.checkouts.only().status).toBe(CheckoutStatus.Captured);
      expect(world.payments.captures[0].key).toBe(`${TENANT}:${checkout.publicId}:capture`);
    });

    it('has a failed capture retried only when an operator asks', async () => {
      Object.assign(transaction, SETTLED);
      world.checkouts.only().status = CheckoutStatus.Failed;

      expect(await world.reconciliationService.reconcile(world.checkouts.only())).toBe(
        ReconcileOutcome.Unchanged,
      );
      expect(await world.reconciliationService.reconcile(world.checkouts.only(), true)).toBe(
        ReconcileOutcome.Settled,
      );
      expect(world.checkouts.only().status).toBe(CheckoutStatus.Captured);
    });
  });

  describe('an unpaid checkout', () => {
    it('is cancelled once Stripe can no longer take its payment', async () => {
      const { publicId } = await world.checkoutService.createCheckout(7);
      const checkout = world.checkouts.only();

      later(24 * 60 * 60 * 1000);
      expect(await world.reconciliationService.reconcile(checkout)).toBe(ReconcileOutcome.Waiting);

      later(25 * 60 * 60 * 1000 + 1);
      expect(await world.reconciliationService.reconcile(checkout)).toBe(ReconcileOutcome.Expired);
      expect((await world.checkouts.findByPublicId(publicId))?.status).toBe(
        CheckoutStatus.Cancelled,
      );
    });

    it('is cancelled when the EV it was plugged in for has left', async () => {
      world.accounts.accounts[0].scanAndChargeEnabled = true;
      const transaction = { ...aTransaction(), tenantId: TENANT, ocppConnectionName: 'CS-1' };
      world.coreData.transactions.push(transaction);
      await world.scanAndChargeService.onTransactionPluggedIn({
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
        transactionId: 'tx-1',
      });
      const checkout = world.checkouts.only();
      expect(checkout.flow).toBe(CheckoutFlow.ScanAndCharge);

      expect(await world.reconciliationService.reconcile(checkout)).toBe(ReconcileOutcome.Waiting);
      Object.assign(transaction, { isActive: false });
      expect(await world.reconciliationService.reconcile(checkout)).toBe(
        ReconcileOutcome.Cancelled,
      );
    });
  });

  it('carries on past a checkout it cannot reconcile', async () => {
    await aPaidCheckout();
    world.coreData.readAuthorizationId = async () => {
      throw new Error('database down');
    };
    later();

    expect(await world.reconciliationService.sweep()).toBe(1);
    expect(world.checkouts.only().status).toBe(CheckoutStatus.StartRequested);
  });

  it('runs one sweep at a time', async () => {
    await aPaidCheckout();
    later();

    const [first, second] = await Promise.all([
      world.reconciliationService.sweep(),
      world.reconciliationService.sweep(),
    ]);

    expect([first, second].sort()).toEqual([0, 1]);
  });
});
