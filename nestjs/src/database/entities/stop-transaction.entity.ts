// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';
import { transactions } from '@entities/transaction.entity';

/**
 * OCPP 1.6 StopTransaction history record. Mirrors legacy
 * `core/src/dal/.../TransactionEvent/StopTransaction.ts`.
 *
 * `meterValues` are stored separately in the `MeterValues` table — same
 * `transactionDatabaseId` FK lets you join the trailing samples back
 * to the stop event.
 */
export const stopTransactions = pgTable(TableName.StopTransactions, {
  id: serial('id').primaryKey(),
  stationId: varchar('stationId', { length: 255 }).notNull(),
  transactionDatabaseId: integer('transactionDatabaseId').references(() => transactions.id),
  meterStop: integer('meterStop').notNull(),
  timestamp: varchar('timestamp', { length: 64 }).notNull(),
  reason: varchar('reason', { length: 64 }),
  idTokenValue: varchar('idTokenValue', { length: 64 }),
  idTokenType: varchar('idTokenType', { length: 32 }),
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

export type StopTransaction = typeof stopTransactions.$inferSelect;
export type NewStopTransaction = typeof stopTransactions.$inferInsert;
