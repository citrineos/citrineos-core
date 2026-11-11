// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { sequelize as dal } from '@citrineos/dal';
import type { TariffData } from '@citrineos/dal';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SequelizeCheckoutRepository } from '../../src/repositories/index.js';
import { CheckoutFlow, CheckoutStatus, RemoteStartStatus } from '../../src/types/index.js';
import type { CheckoutCreate } from '../../src/types/index.js';
import {
  aTariff,
  resetDatabase,
  startTestDatabase,
  TENANT_A,
  TENANT_B,
  type TestDatabase,
} from '../support/database.js';

let db: TestDatabase;
let tariff: TariffData;
const repository = new SequelizeCheckoutRepository();

beforeAll(async () => {
  db = await startTestDatabase();
}, 90_000);

afterAll(async () => {
  await db?.stop();
});

beforeEach(async () => {
  await resetDatabase(db);
  tariff = await aTariff(TENANT_A);
});

function aCheckout(overrides: Partial<CheckoutCreate> = {}): CheckoutCreate {
  return {
    stripeAccountId: 'acct_tenant_a',
    flow: CheckoutFlow.WebPortal,
    connectorId: null,
    tariffSnapshot: tariff,
    ...overrides,
  };
}

describe('SequelizeCheckoutRepository', () => {
  it('creates a checkout priced from the tariff snapshot', async () => {
    const checkout = await repository.create(TENANT_A, aCheckout());

    expect(checkout.tenantId).toBe(TENANT_A);
    expect(checkout.status).toBe(CheckoutStatus.Created);
    expect(checkout.publicId).toMatch(/^[0-9a-f-]{36}$/);
    expect(checkout.tariffId).toBe(tariff.id);
    expect(checkout.currency).toBe('USD');
    expect(checkout.tariffSnapshot).toEqual(tariff);
    expect(checkout.transactionDatabaseId).toBeNull();
  });

  it('gives every checkout its own public id', async () => {
    const first = await repository.create(TENANT_A, aCheckout());
    const second = await repository.create(TENANT_A, aCheckout());

    expect(second.publicId).not.toBe(first.publicId);
  });

  it('finds a checkout by id only within its tenant', async () => {
    const checkout = await repository.create(TENANT_A, aCheckout());

    expect((await repository.findById(TENANT_A, checkout.id))?.publicId).toBe(checkout.publicId);
    expect(await repository.findById(TENANT_B, checkout.id)).toBeUndefined();
  });

  it('resolves a public id to its checkout and tenant', async () => {
    const checkout = await repository.create(TENANT_B, aCheckout({ tariffSnapshot: tariff }));

    const found = await repository.findByPublicId(checkout.publicId);

    expect(found?.id).toBe(checkout.id);
    expect(found?.tenantId).toBe(TENANT_B);
    expect(await repository.findByPublicId('00000000-0000-4000-8000-000000000000')).toBeUndefined();
  });

  it('finds a checkout by transaction only within its tenant', async () => {
    const checkout = await repository.create(TENANT_A, aCheckout({ transactionDatabaseId: 77 }));

    expect((await repository.findByTransactionDatabaseId(TENANT_A, 77))?.id).toBe(checkout.id);
    expect(await repository.findByTransactionDatabaseId(TENANT_B, 77)).toBeUndefined();
  });

  it('updates a checkout within its tenant and returns the new state', async () => {
    const checkout = await repository.create(TENANT_A, aCheckout());

    const updated = await repository.update(TENANT_A, checkout.id, {
      status: CheckoutStatus.Authorized,
      paymentIntentId: 'pi_123',
      authorizedAmount: 5000,
      remoteStartStatus: RemoteStartStatus.Accepted,
    });

    expect(updated?.status).toBe(CheckoutStatus.Authorized);
    expect(updated?.paymentIntentId).toBe('pi_123');
    expect(updated?.authorizedAmount).toBe(5000);
    expect(updated?.remoteStartStatus).toBe(RemoteStartStatus.Accepted);
  });

  it('does not update a checkout from another tenant', async () => {
    const checkout = await repository.create(TENANT_A, aCheckout());

    expect(
      await repository.update(TENANT_B, checkout.id, { status: CheckoutStatus.Cancelled }),
    ).toBeUndefined();
    expect((await repository.findById(TENANT_A, checkout.id))?.status).toBe(CheckoutStatus.Created);
  });

  it('refuses a payment intent that another checkout already holds', async () => {
    const first = await repository.create(TENANT_A, aCheckout());
    const second = await repository.create(TENANT_A, aCheckout());
    await repository.update(TENANT_A, first.id, { paymentIntentId: 'pi_shared' });

    await expect(
      repository.update(TENANT_A, second.id, { paymentIntentId: 'pi_shared' }),
    ).rejects.toThrow();
  });

  it('moves a checkout on only from the statuses it is allowed to leave', async () => {
    const checkout = await repository.create(TENANT_A, aCheckout());

    const authorized = await repository.transition(
      TENANT_A,
      checkout.id,
      [CheckoutStatus.Created],
      {
        status: CheckoutStatus.Authorized,
        paymentIntentId: 'pi_1',
      },
    );
    const again = await repository.transition(TENANT_A, checkout.id, [CheckoutStatus.Created], {
      status: CheckoutStatus.Authorized,
      paymentIntentId: 'pi_2',
    });

    expect(authorized).toMatchObject({
      status: CheckoutStatus.Authorized,
      paymentIntentId: 'pi_1',
    });
    expect(again).toBeUndefined();
    expect((await repository.findById(TENANT_A, checkout.id))?.paymentIntentId).toBe('pi_1');
  });

  it('does not move a checkout of another tenant', async () => {
    const checkout = await repository.create(TENANT_A, aCheckout());

    expect(
      await repository.transition(TENANT_B, checkout.id, [CheckoutStatus.Created], {
        status: CheckoutStatus.Cancelled,
      }),
    ).toBeUndefined();
  });

  it('keeps the checkout and its tariff snapshot when the tariff is deleted', async () => {
    const checkout = await repository.create(TENANT_A, aCheckout());

    await dal.Tariff.destroy({ where: { id: tariff.id } });

    const found = await repository.findById(TENANT_A, checkout.id);
    expect(found?.tariffId).toBeNull();
    expect(found?.tariffSnapshot).toEqual(tariff);
  });

  it('lists checkouts newest first, by tenant, status and page', async () => {
    const a1 = await repository.create(TENANT_A, aCheckout());
    const b1 = await repository.create(TENANT_B, aCheckout({ stripeAccountId: 'acct_b' }));
    const a2 = await repository.create(TENANT_A, aCheckout());
    await repository.transition(TENANT_A, a1.id, [CheckoutStatus.Created], {
      status: CheckoutStatus.Failed,
    });

    const ids = (checkouts: { id: number }[]) => checkouts.map((checkout) => checkout.id);
    expect(ids(await repository.list({ limit: 10 }))).toEqual([a2.id, b1.id, a1.id]);
    expect(ids(await repository.list({ tenantId: TENANT_A, limit: 10 }))).toEqual([a2.id, a1.id]);
    expect(ids(await repository.list({ statuses: [CheckoutStatus.Failed], limit: 10 }))).toEqual([
      a1.id,
    ]);
    expect(ids(await repository.list({ beforeId: a2.id, limit: 1 }))).toEqual([b1.id]);
  });

  it('finds the checkouts of every tenant that have not changed for a while', async () => {
    const old = await repository.create(TENANT_A, aCheckout());
    const recent = await repository.create(TENANT_B, aCheckout({ stripeAccountId: 'acct_b' }));
    const charging = await repository.create(TENANT_A, aCheckout());
    await repository.transition(TENANT_A, charging.id, [CheckoutStatus.Created], {
      status: CheckoutStatus.Charging,
    });
    await db.sequelize.query(
      `UPDATE "Checkouts" SET "updatedAt" = now() - interval '1 hour' WHERE id IN (:ids)`,
      { replacements: { ids: [old.id, charging.id] } },
    );

    const stale = await repository.findStale(
      [CheckoutStatus.Created, CheckoutStatus.Charging],
      new Date(Date.now() - 10 * 60_000),
      10,
    );
    expect(stale.map((checkout) => checkout.id).sort()).toEqual([old.id, charging.id].sort());
    expect(stale.map((checkout) => checkout.id)).not.toContain(recent.id);
    expect(await repository.findStale([CheckoutStatus.Capturing], new Date(), 10)).toEqual([]);
  });

  it('counts a tenant’s checkouts in some statuses', async () => {
    await repository.create(TENANT_A, aCheckout());
    await repository.create(TENANT_A, aCheckout());
    await repository.create(TENANT_B, aCheckout({ stripeAccountId: 'acct_b' }));

    expect(await repository.countByStatus(TENANT_A, [CheckoutStatus.Created])).toBe(2);
    expect(await repository.countByStatus(TENANT_A, [CheckoutStatus.Charging])).toBe(0);
  });
});
