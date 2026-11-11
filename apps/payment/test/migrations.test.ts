// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Checkout, PaymentAccount } from '../src/models/index.js';
import { startTestDatabase, type TestDatabase } from './support/database.js';
import { PAYMENT_MIGRATIONS } from './support/migrations.js';

let db: TestDatabase;

beforeAll(async () => {
  db = await startTestDatabase();
}, 90_000);

afterAll(async () => {
  await db?.stop();
});

// Nothing else checks this app's models against its migrations: the repository's
// require-migration workflow only watches the DAL.
describe('payment migrations', () => {
  it.each([
    ['PaymentAccounts', () => PaymentAccount.getAttributes()],
    ['Checkouts', () => Checkout.getAttributes()],
  ])(
    'creates every column the %s model declares, with the same nullability',
    async (tableName, attributesOf) => {
      const table = await db.sequelize.getQueryInterface().describeTable(tableName);

      const expected = Object.fromEntries(
        Object.entries(attributesOf()).map(([name, attribute]) => [
          name,
          attribute.primaryKey === true ? false : attribute.allowNull !== false,
        ]),
      );
      const actual = Object.fromEntries(
        Object.entries(table).map(([name, column]) => [name, column.allowNull]),
      );

      expect(actual).toEqual(expected);
    },
  );

  it('rolls back and re-applies cleanly', async () => {
    const queryInterface = db.sequelize.getQueryInterface();

    for (const migration of [...PAYMENT_MIGRATIONS].reverse()) {
      await migration.down(queryInterface);
    }
    const tablesAfterDown = await queryInterface.showAllTables();
    expect(tablesAfterDown).not.toContain('Checkouts');
    expect(tablesAfterDown).not.toContain('PaymentAccounts');

    for (const migration of PAYMENT_MIGRATIONS) {
      await migration.up(queryInterface);
    }
    const tablesAfterUp = await queryInterface.showAllTables();
    expect(tablesAfterUp).toContain('Checkouts');
    expect(tablesAfterUp).toContain('PaymentAccounts');
  });
});
