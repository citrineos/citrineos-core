// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SequelizePaymentAccountRepository } from '../../src/repositories/index.js';
import {
  resetDatabase,
  startTestDatabase,
  TENANT_A,
  TENANT_B,
  type TestDatabase,
} from '../support/database.js';

let db: TestDatabase;
const repository = new SequelizePaymentAccountRepository();

beforeAll(async () => {
  db = await startTestDatabase();
}, 90_000);

afterAll(async () => {
  await db?.stop();
});

beforeEach(async () => {
  await resetDatabase(db);
});

describe('SequelizePaymentAccountRepository', () => {
  it('creates an account with scan-and-charge off and no terms unless asked', async () => {
    const account = await repository.create(TENANT_A, { stripeAccountId: 'acct_a' });

    expect(account.tenantId).toBe(TENANT_A);
    expect(account.stripeAccountId).toBe('acct_a');
    expect(account.scanAndChargeEnabled).toBe(false);
    expect(account.termsUrl).toBeNull();
  });

  it('keeps the terms a tenant asks drivers to accept', async () => {
    await repository.create(TENANT_A, {
      stripeAccountId: 'acct_a',
      termsUrl: 'https://operator.example.com/terms',
    });

    expect((await repository.findByTenantId(TENANT_A))?.termsUrl).toBe(
      'https://operator.example.com/terms',
    );
  });

  it('finds the account of a tenant', async () => {
    await repository.create(TENANT_A, { stripeAccountId: 'acct_a' });
    await repository.create(TENANT_B, { stripeAccountId: 'acct_b', scanAndChargeEnabled: true });

    const account = await repository.findByTenantId(TENANT_B);

    expect(account?.stripeAccountId).toBe('acct_b');
    expect(account?.scanAndChargeEnabled).toBe(true);
  });

  it('returns undefined for a tenant without an account', async () => {
    expect(await repository.findByTenantId(TENANT_A)).toBeUndefined();
  });

  it('resolves a connected account to its tenant', async () => {
    await repository.create(TENANT_B, { stripeAccountId: 'acct_b' });

    expect((await repository.findByStripeAccountId('acct_b'))?.tenantId).toBe(TENANT_B);
    expect(await repository.findByStripeAccountId('acct_unknown')).toBeUndefined();
  });

  it('allows one account per tenant', async () => {
    await repository.create(TENANT_A, { stripeAccountId: 'acct_a' });

    await expect(repository.create(TENANT_A, { stripeAccountId: 'acct_a2' })).rejects.toThrow();
  });

  it('does not let two tenants share a connected account', async () => {
    await repository.create(TENANT_A, { stripeAccountId: 'acct_shared' });

    await expect(repository.create(TENANT_B, { stripeAccountId: 'acct_shared' })).rejects.toThrow(
      expect.objectContaining({ name: 'SequelizeUniqueConstraintError' }),
    );
  });

  it('refuses an account for a tenant that does not exist', async () => {
    await expect(repository.create(999, { stripeAccountId: 'acct_orphan' })).rejects.toThrow(
      expect.objectContaining({ name: 'SequelizeForeignKeyConstraintError' }),
    );
  });

  it('lists every tenant’s account, or one tenant’s', async () => {
    await repository.create(TENANT_B, { stripeAccountId: 'acct_b' });
    await repository.create(TENANT_A, { stripeAccountId: 'acct_a' });

    expect((await repository.list()).map((account) => account.tenantId)).toEqual([
      TENANT_A,
      TENANT_B,
    ]);
    expect((await repository.list(TENANT_B)).map((account) => account.stripeAccountId)).toEqual([
      'acct_b',
    ]);
  });

  it('changes and deletes an account within its tenant', async () => {
    await repository.create(TENANT_A, { stripeAccountId: 'acct_a' });

    expect(
      await repository.update(TENANT_A, { scanAndChargeEnabled: true, termsUrl: 'https://t' }),
    ).toMatchObject({
      stripeAccountId: 'acct_a',
      scanAndChargeEnabled: true,
      termsUrl: 'https://t',
    });
    expect(await repository.update(TENANT_B, { scanAndChargeEnabled: true })).toBeUndefined();

    expect(await repository.delete(TENANT_B)).toBe(false);
    expect(await repository.delete(TENANT_A)).toBe(true);
    expect(await repository.findByTenantId(TENANT_A)).toBeUndefined();
  });
});
