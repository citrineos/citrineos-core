// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TransactionType } from '@citrineos/base';
import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgSchema,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function transactionEventColumns() {
  return {
    id: serial('id').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }).notNull(),
    // Enum stored as a string
    eventType: varchar('eventType', { length: 255 }).notNull(),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).notNull(),
    // Enum stored as a string
    triggerReason: varchar('triggerReason', { length: 255 }).notNull(),
    seqNo: integer('seqNo').notNull(),
    offline: boolean('offline').default(false),
    numberOfPhasesUsed: integer('numberOfPhasesUsed'),
    // DECIMAL column is read back as a string by node-postgres — converted in the repository layer
    cableMaxCurrent: numeric('cableMaxCurrent'),
    reservationId: integer('reservationId'),
    transactionDatabaseId: integer('transactionDatabaseId'),
    transactionInfo: jsonb('transactionInfo').$type<TransactionType>(),
    evseId: integer('evseId'),
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
export const transactionEventTable = pgTable(
  TableName.TransactionEvents,
  transactionEventColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof transactionEventTable>();

export function tenantTransactionEventTable(tenantId: number): typeof transactionEventTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.TransactionEvents,
      transactionEventColumns(),
    ) as unknown as typeof transactionEventTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const TransactionEventEntitySchema = createSelectSchema(transactionEventTable);
export const TransactionEventEntityInsertSchema = createInsertSchema(transactionEventTable);

export type TransactionEventEntity = z.infer<typeof TransactionEventEntitySchema>;
export type TransactionEventEntityInsert = z.infer<typeof TransactionEventEntityInsertSchema>;
