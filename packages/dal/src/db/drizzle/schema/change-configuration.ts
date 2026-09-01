// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import {
  boolean,
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
function changeConfigurationColumns() {
  return {
    id: serial('id').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }).notNull(),
    key: varchar('key', { length: 50 }).notNull(),
    value: varchar('value', { length: 500 }),
    readonly: boolean('readonly'),
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
export const changeConfigurationTable = pgTable(
  TableName.ChangeConfigurations,
  changeConfigurationColumns(),
  (t) => [
    uniqueIndex('change_configurations_station_name_tenant_id_key').on(
      t.ocppConnectionName,
      t.key,
      t.tenantId,
    ),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof changeConfigurationTable>();

export function tenantChangeConfigurationTable(tenantId: number): typeof changeConfigurationTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.ChangeConfigurations,
      changeConfigurationColumns(),
    ) as unknown as typeof changeConfigurationTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ChangeConfigurationEntitySchema = createSelectSchema(changeConfigurationTable);
export const ChangeConfigurationEntityInsertSchema = createInsertSchema(changeConfigurationTable);

export type ChangeConfigurationEntity = z.infer<typeof ChangeConfigurationEntitySchema>;
export type ChangeConfigurationEntityInsert = z.infer<typeof ChangeConfigurationEntityInsertSchema>;
