// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { getTableConfig } from 'drizzle-orm/pg-core';
import type { PgTable } from 'drizzle-orm/pg-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MIGRATIONS_TABLE, migratePaymentTables } from '../src/db/migrate.js';
import { checkoutTable, paymentAccountTable } from '../src/db/schema.js';
import { startTestDatabase, type TestDatabase } from './support/database.js';

let db: TestDatabase;

beforeAll(async () => {
  db = await startTestDatabase();
}, 90_000);

afterAll(async () => {
  await db?.stop();
});

/** Drizzle's spelling of a column type, as Postgres's format_type() spells it. */
function postgresType(drizzleType: string): string {
  return drizzleType
    .replace(/^serial$/, 'integer')
    .replace(/^varchar\((\d+)\)$/, 'character varying($1)')
    .replace(/^char\((\d+)\)$/, 'character($1)');
}

async function columnsOf(table: string): Promise<Record<string, [string, boolean]>> {
  const { rows } = await db.pool.query<{ name: string; type: string; notNull: boolean }>(
    `SELECT attname AS name, format_type(atttypid, atttypmod) AS type, attnotnull AS "notNull"
       FROM pg_attribute WHERE attrelid = $1::regclass AND attnum > 0 AND NOT attisdropped`,
    [`"${table}"`],
  );
  return Object.fromEntries(rows.map((row) => [row.name, [row.type, row.notNull]]));
}

async function constraintsOf(table: string): Promise<string[]> {
  const { rows } = await db.pool.query<{ name: string }>(
    `SELECT conname AS name FROM pg_constraint WHERE conrelid = $1::regclass
     UNION SELECT indexname FROM pg_indexes WHERE tablename = $2 ORDER BY 1`,
    [`"${table}"`, table],
  );
  return rows.map((row) => row.name);
}

// Nothing else checks this app's schema against its migrations: Core's require-migration workflow
// only watches the DAL.
describe('payment migrations', () => {
  it.each<[string, PgTable]>([
    ['PaymentAccounts', paymentAccountTable],
    ['Checkouts', checkoutTable],
  ])(
    'create every column of %s the schema declares, with its type and nullability',
    async (name, table) => {
      const expected = Object.fromEntries(
        getTableConfig(table).columns.map((column) => [
          column.name,
          [postgresType(column.getSQLType()), column.notNull],
        ]),
      );

      expect(await columnsOf(name)).toEqual(expected);
    },
  );

  it('name constraints and indexes as the Sequelize migration did', async () => {
    expect(await constraintsOf('PaymentAccounts')).toEqual([
      'PaymentAccounts_pkey',
      'PaymentAccounts_stripeAccountId_key',
      'PaymentAccounts_tenantId_fkey',
      'PaymentAccounts_tenantId_key',
    ]);
    expect(await constraintsOf('Checkouts')).toEqual([
      'Checkouts_connectorId_fkey',
      'Checkouts_paymentIntentId_key',
      'Checkouts_pkey',
      'Checkouts_publicId_key',
      'Checkouts_tariffId_fkey',
      'Checkouts_tenantId_fkey',
      'checkouts_status_updated',
      'checkouts_tenant_transaction',
    ]);
  });

  it('apply once, and leave tables an earlier setup created as they are', async () => {
    const history = `"${MIGRATIONS_TABLE.schema}"."${MIGRATIONS_TABLE.table}"`;
    const applied = async () =>
      Number(
        (await db.pool.query<{ count: string }>(`SELECT count(*) FROM ${history}`)).rows[0].count,
      );
    expect(await applied()).toBe(1);

    await migratePaymentTables(db.db);
    expect(await applied()).toBe(1);

    // A database the Sequelize migration set up has the tables but no Drizzle history.
    await db.pool.query(`DELETE FROM ${history}`);
    await migratePaymentTables(db.db);
    expect(await applied()).toBe(1);
    expect(await constraintsOf('Checkouts')).toHaveLength(8);
    expect(await constraintsOf('PaymentAccounts')).toHaveLength(4);
  });
});
