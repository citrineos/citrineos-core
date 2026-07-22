// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import { boolean, integer, jsonb, pgSchema, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function bootColumns() {
  return {
    // StationId — a string primary key, not a serial.
    id: varchar('id', { length: 255 }).primaryKey(),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    lastBootTime: timestamp('lastBootTime', { withTimezone: true, mode: 'date' }),
    heartbeatInterval: integer('heartbeatInterval'),
    bootRetryInterval: integer('bootRetryInterval'),
    status: varchar('status', { length: 255 }),
    statusInfo: jsonb('statusInfo').$type<object>(),
    getBaseReportOnPending: boolean('getBaseReportOnPending'),
    variablesRejectedOnLastBoot: jsonb('variablesRejectedOnLastBoot').$type<object[]>(),
    bootWithRejectedVariables: boolean('bootWithRejectedVariables'),
    changeConfigurationsOnPending: boolean('changeConfigurationsOnPending'),
    getConfigurationsOnPending: boolean('getConfigurationsOnPending'),
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
export const bootTable = pgTable(TableName.Boots, bootColumns());

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof bootTable>();

export function tenantBootTable(tenantId: number): typeof bootTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Boots,
      bootColumns(),
    ) as unknown as typeof bootTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const BootEntitySchema = createSelectSchema(bootTable);
export const BootEntityInsertSchema = createInsertSchema(bootTable);

export type BootEntity = z.infer<typeof BootEntitySchema>;
export type BootEntityInsert = z.infer<typeof BootEntityInsertSchema>;
