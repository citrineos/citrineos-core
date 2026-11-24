// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffData } from '@citrineos/dal';
import {
  boolean,
  char,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { CheckoutFlow, CheckoutStatus, RemoteStartStatus } from '../types/checkout-enums.js';

/**
 * This app's tables, in Core's database. Constraint and index names are spelled out to match the
 * ones Postgres gave the tables when a Sequelize migration created them, so a database created
 * either way has the same schema.
 */

/**
 * Core's tables the foreign keys point at, by the one column they reference. Core's migrations
 * create them; these stand-ins are not exported, so drizzle-kit leaves them out of this app's
 * migrations, and the schema does not have to load the DAL.
 */
const tenantTable = pgTable('Tenants', { id: integer('id').primaryKey() });
const connectorTable = pgTable('Connectors', { id: integer('id').primaryKey() });
const tariffTable = pgTable('Tariffs', { id: integer('id').primaryKey() });

function timestamps() {
  return {
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  };
}

export const paymentAccountTable = pgTable(
  'PaymentAccounts',
  {
    id: serial('id').primaryKey(),
    tenantId: integer('tenantId').notNull().unique('PaymentAccounts_tenantId_key'),
    stripeAccountId: varchar('stripeAccountId', { length: 255 })
      .notNull()
      .unique('PaymentAccounts_stripeAccountId_key'),
    scanAndChargeEnabled: boolean('scanAndChargeEnabled').notNull().default(false),
    termsUrl: varchar('termsUrl', { length: 2048 }),
    ...timestamps(),
  },
  (table) => [
    foreignKey({
      name: 'PaymentAccounts_tenantId_fkey',
      columns: [table.tenantId],
      foreignColumns: [tenantTable.id],
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ],
);

export const checkoutTable = pgTable(
  'Checkouts',
  {
    id: serial('id').primaryKey(),
    publicId: uuid('publicId').notNull().defaultRandom().unique('Checkouts_publicId_key'),
    tenantId: integer('tenantId').notNull(),
    stripeAccountId: varchar('stripeAccountId', { length: 255 }).notNull(),
    flow: varchar('flow', { length: 255 }).$type<CheckoutFlow>().notNull(),
    status: varchar('status', { length: 255 }).$type<CheckoutStatus>().notNull(),
    connectorId: integer('connectorId'),
    tariffId: integer('tariffId'),
    tariffSnapshot: jsonb('tariffSnapshot').$type<TariffData>().notNull(),
    // No foreign key: "Transactions" is range-partitioned and its retention job detaches old
    // partitions, which Postgres refuses while another table references their rows. A checkout is
    // a payment record and has to outlive that window.
    transactionDatabaseId: integer('transactionDatabaseId'),
    currency: char('currency', { length: 3 }).notNull(),
    authorizedAmount: integer('authorizedAmount'),
    capturedAmount: integer('capturedAmount'),
    paymentIntentId: varchar('paymentIntentId', { length: 255 }).unique(
      'Checkouts_paymentIntentId_key',
    ),
    remoteStartStatus: varchar('remoteStartStatus', { length: 255 }).$type<RemoteStartStatus>(),
    qrDisplayMessageId: integer('qrDisplayMessageId'),
    ...timestamps(),
  },
  (table) => [
    foreignKey({
      name: 'Checkouts_tenantId_fkey',
      columns: [table.tenantId],
      foreignColumns: [tenantTable.id],
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      name: 'Checkouts_connectorId_fkey',
      columns: [table.connectorId],
      foreignColumns: [connectorTable.id],
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      name: 'Checkouts_tariffId_fkey',
      columns: [table.tariffId],
      foreignColumns: [tariffTable.id],
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    index('checkouts_tenant_transaction').on(table.tenantId, table.transactionDatabaseId),
    // The reconciliation sweep looks checkouts up by status and how long ago they changed.
    index('checkouts_status_updated').on(table.status, table.updatedAt),
  ],
);

export type CheckoutRow = typeof checkoutTable.$inferSelect;
export type PaymentAccountRow = typeof paymentAccountTable.$inferSelect;
