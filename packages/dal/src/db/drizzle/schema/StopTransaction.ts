// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
import {
  integer,
  pgSchema,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function stopTransactionColumns() {
  return {
    id: serial('id').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }).notNull(),
    transactionDatabaseId: integer('transactionDatabaseId').notNull(),
    meterStop: integer('meterStop').notNull(),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).notNull(),
    reason: varchar('reason', { length: 255 }),
    idTokenValue: varchar('idTokenValue', { length: 255 }),
    idTokenType: varchar('idTokenType', { length: 255 }),
    tenantId: integer('tenantId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  };
}

// Row-level tenancy (current approach): single public schema, tenantId column filter on every query
export const stopTransactionTable = pgTable(
  TableName.StopTransactions,
  stopTransactionColumns(),
  (t) => [uniqueIndex('stop_transactions_transaction_database_id').on(t.transactionDatabaseId)],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof stopTransactionTable>();

export function tenantStopTransactionTable(tenantId: number): typeof stopTransactionTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.StopTransactions,
      stopTransactionColumns(),
    ) as unknown as typeof stopTransactionTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const StopTransactionEntitySchema = createSelectSchema(stopTransactionTable);
export const StopTransactionEntityInsertSchema = createInsertSchema(stopTransactionTable);

export type StopTransactionEntity = z.infer<typeof StopTransactionEntitySchema>;
export type StopTransactionEntityInsert = z.infer<typeof StopTransactionEntityInsertSchema>;
