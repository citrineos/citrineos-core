// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CallbackSigner } from '../../src/services/callback-signer.js';
import { CheckoutService } from '../../src/services/checkout-service.js';
import { AdminService } from '../../src/admin/admin-service.js';
import { IdTokens } from '../../src/services/id-tokens.js';
import { ReconciliationService } from '../../src/services/reconciliation-service.js';
import { ScanAndChargeService } from '../../src/services/scan-and-charge-service.js';
import { SettlementService } from '../../src/services/settlement-service.js';
import { StartService } from '../../src/services/start-service.js';
import {
  ACCOUNT,
  FakeCoreApi,
  FakeCoreData,
  InMemoryCheckouts,
  InMemoryPaymentAccounts,
  RecordingPayments,
  TENANT,
} from './fakes.js';

export const PUBLIC_URL = 'https://pay.example.com';
export const INTERNAL_URL = 'http://payment:9010';
export const STALE_AFTER_MS = 600_000;

/** The services wired to in-memory stand-ins for the database, Core and Stripe. */
export async function aWorld() {
  const coreData = new FakeCoreData();
  const coreApi = new FakeCoreApi();
  const payments = new RecordingPayments();
  const checkouts = new InMemoryCheckouts();
  const accounts = new InMemoryPaymentAccounts();
  const idTokens = new IdTokens('PAY_');
  const signer = new CallbackSigner('a-callback-secret-that-is-long-enough!');
  await accounts.create(TENANT, { stripeAccountId: ACCOUNT });

  const dependencies = {
    coreData,
    payments,
    checkoutRepository: checkouts,
    paymentAccountRepository: accounts,
  };
  const settlementService = new SettlementService({
    ...dependencies,
    idTokens,
    poll: { attempts: 3, intervalMs: 1 },
  });
  const clock = { now: new Date('2026-10-23T10:00:00.000Z') };
  const reconciliationService = new ReconciliationService({
    ...dependencies,
    settlementService,
    idTokens,
    staleAfterMs: STALE_AFTER_MS,
    now: () => clock.now,
  });
  return {
    clock,
    coreData,
    coreApi,
    payments,
    checkouts,
    accounts,
    idTokens,
    signer,
    checkoutService: new CheckoutService({ ...dependencies, publicUrl: `${PUBLIC_URL}/` }),
    startService: new StartService({
      ...dependencies,
      coreApi,
      callbackSigner: signer,
      idTokens,
      internalUrl: INTERNAL_URL,
    }),
    settlementService,
    reconciliationService,
    adminService: new AdminService({ ...dependencies, reconciliationService }),
    scanAndChargeService: new ScanAndChargeService({
      ...dependencies,
      coreApi,
      idTokens,
      publicUrl: `${PUBLIC_URL}/`,
      poll: { attempts: 3, intervalMs: 1 },
    }),
  };
}
