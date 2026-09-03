// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SampledValue } from '@citrineos/types';
import { TableName } from '@dal/models/table-name.js';
import { integer, jsonb, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function meterValueColumns() {
  return {
    id: serial('id').primaryKey(),
    transactionEventId: integer('transactionEventId'),
    transactionDatabaseId: integer('transactionDatabaseId'),
    stopTransactionDatabaseId: integer('stopTransactionDatabaseId'),
    sampledValue: jsonb('sampledValue').$type<[SampledValue, ...SampledValue[]]>().notNull(),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).notNull(),
    connectorId: integer('connectorId'),
    tariffId: integer('tariffId'),
    transactionId: varchar('transactionId', { length: 255 }),
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
export const meterValueTable = pgTable(TableName.MeterValues, meterValueColumns());

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof meterValueTable>();

export function tenantMeterValueTable(tenantId: number): typeof meterValueTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.MeterValues,
      meterValueColumns(),
    ) as unknown as typeof meterValueTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const MeterValueEntitySchema = createSelectSchema(meterValueTable);
export const MeterValueEntityInsertSchema = createInsertSchema(meterValueTable);

export type MeterValueEntity = z.infer<typeof MeterValueEntitySchema>;
export type MeterValueEntityInsert = z.infer<typeof MeterValueEntityInsertSchema>;
