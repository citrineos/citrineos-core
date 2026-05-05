// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { connectors } from '@entities/connector.entity';
import { tenants } from '@entities/tenant.entity';
import { transactions } from '@entities/transaction.entity';

/**
 * OCPP 1.6 StartTransaction history record. Each StartTransaction
 * request from a charger appends a row; the corresponding
 * Transaction row carries the live state.
 *
 * Mirrors legacy `core/src/dal/.../TransactionEvent/StartTransaction.ts`.
 */
export const startTransactions = pgTable(TableName.StartTransactions, {
  id: serial('id').primaryKey(),
  stationId: varchar('stationId', { length: 255 }),
  /** in Wh — `meterStart` in OCPP 1.6 spec. */
  meterStart: integer('meterStart'),
  /** ISO8601 string per OCPP wire format. */
  timestamp: timestamp('timestamp', { withTimezone: true }),
  reservationId: integer('reservationId'),
  transactionDatabaseId: integer('transactionDatabaseId').references(() => transactions.id),
  /** Soft FK to `Authorizations.id` for the idTag the start used. */
  idTokenDatabaseId: integer('idTokenDatabaseId'),
  connectorDatabaseId: integer('connectorDatabaseId').references(() => connectors.id),
  tenantId: integer('tenantId')
    .notNull()
    .references(() => tenants.id),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type StartTransaction = typeof startTransactions.$inferSelect;
export type NewStartTransaction = typeof startTransactions.$inferInsert;
