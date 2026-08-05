// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import { integer, jsonb, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function compositeScheduleColumns() {
  return {
    // Implicit auto-increment PK (model declares no @PrimaryKey).
    id: serial('id').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    evseId: integer('evseId'),
    duration: integer('duration'),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    scheduleStart: timestamp('scheduleStart', { withTimezone: true, mode: 'date' }),
    chargingRateUnit: varchar('chargingRateUnit', { length: 255 }),
    chargingSchedulePeriod: jsonb('chargingSchedulePeriod').$type<[object, ...object[]]>(),
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
export const compositeScheduleTable = pgTable(
  TableName.CompositeSchedules,
  compositeScheduleColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof compositeScheduleTable>();

export function tenantCompositeScheduleTable(tenantId: number): typeof compositeScheduleTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.CompositeSchedules,
      compositeScheduleColumns(),
    ) as unknown as typeof compositeScheduleTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const CompositeScheduleEntitySchema = createSelectSchema(compositeScheduleTable);
export const CompositeScheduleEntityInsertSchema = createInsertSchema(compositeScheduleTable);

export type CompositeScheduleEntity = z.infer<typeof CompositeScheduleEntitySchema>;
export type CompositeScheduleEntityInsert = z.infer<typeof CompositeScheduleEntityInsertSchema>;
