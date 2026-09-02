// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TransactionLimit } from '@citrineos/types';
import { TableName } from '@dal/models/table-name.js';
import {
  bigint,
  boolean,
  integer,
  jsonb,
  numeric,
  primaryKey,
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
function transactionColumns() {
  return {
    id: serial('id'),
    locationId: integer('locationId'),
    stationId: integer('stationId').notNull(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }).notNull(),
    evseId: integer('evseId'),
    connectorId: integer('connectorId'),
    authorizationId: integer('authorizationId'),
    tariffId: integer('tariffId'),
    transactionId: varchar('transactionId', { length: 255 }).notNull(),
    isActive: boolean('isActive').notNull(),
    chargingState: varchar('chargingState', { length: 255 }),
    timeSpentCharging: bigint('timeSpentCharging', { mode: 'number' }),
    transactionLimit: jsonb('transactionLimit').$type<TransactionLimit>(),
    // DECIMAL columns are read back as strings by node-postgres — converted in the repository layer
    meterStart: numeric('meterStart'),
    totalKwh: numeric('totalKwh'),
    stoppedReason: varchar('stoppedReason', { length: 255 }),
    remoteStartId: integer('remoteStartId'),
    totalCost: numeric('totalCost'),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    startTime: timestamp('startTime', { withTimezone: true, mode: 'date' }),
    endTime: timestamp('endTime', { withTimezone: true, mode: 'date' }),
    customData: jsonb('customData'),
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
export const transactionTable = pgTable(TableName.Transactions, transactionColumns(), (t) => [
  // Range partitioned on "createdAt", so the key must contain it and the old
  // (stationId, transactionId) unique index cannot exist. The unpartitioned
  // "TransactionKeys" registry enforces that pair globally instead.
  primaryKey({ columns: [t.id, t.createdAt] }),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof transactionTable>();

export function tenantTransactionTable(tenantId: number): typeof transactionTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Transactions,
      transactionColumns(),
    ) as unknown as typeof transactionTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const TransactionEntitySchema = createSelectSchema(transactionTable);
export const TransactionEntityInsertSchema = createInsertSchema(transactionTable);

export type TransactionEntity = z.infer<typeof TransactionEntitySchema>;
export type TransactionEntityInsert = z.infer<typeof TransactionEntityInsertSchema>;
