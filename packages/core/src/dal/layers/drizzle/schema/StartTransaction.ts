// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  integer,
  primaryKey,
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
function startTransactionColumns() {
  return {
    id: serial('id'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }).notNull(),
    meterStart: integer('meterStart').notNull(), // in Wh
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).notNull(),
    reservationId: integer('reservationId'),
    transactionDatabaseId: integer('transactionDatabaseId').notNull(),
    // Partition key: mirrors the owning transaction's "createdAt", or now() when unlinked.
    // Part of the primary key, so it must be supplied on insert.
    transactionCreatedAt: timestamp('transactionCreatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    connectorDatabaseId: integer('connectorDatabaseId').notNull(),
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
export const startTransactionTable = pgTable(
  TableName.StartTransactions,
  startTransactionColumns(),
  (t) => [
    primaryKey({ columns: [t.id, t.transactionCreatedAt] }),
    uniqueIndex('start_transactions_transaction_database_id').on(
      t.transactionDatabaseId,
      t.transactionCreatedAt,
    ),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof startTransactionTable>();

export function tenantStartTransactionTable(tenantId: number): typeof startTransactionTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.StartTransactions,
      startTransactionColumns(),
    ) as unknown as typeof startTransactionTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const StartTransactionEntitySchema = createSelectSchema(startTransactionTable);
export const StartTransactionEntityInsertSchema = createInsertSchema(startTransactionTable);

export type StartTransactionEntity = z.infer<typeof StartTransactionEntitySchema>;
export type StartTransactionEntityInsert = z.infer<typeof StartTransactionEntityInsertSchema>;
