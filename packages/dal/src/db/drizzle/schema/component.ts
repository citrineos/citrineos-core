// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import { sql } from 'drizzle-orm';
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
function componentColumns() {
  return {
    // Implicit PK — the sequelize model declares no @PrimaryKey, so Sequelize adds a serial id.
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }),
    instance: varchar('instance', { length: 255 }),
    evseDatabaseId: integer('evseDatabaseId'),
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
export const componentTable = pgTable(TableName.Components, componentColumns(), (t) => [
  // Partial unique index from the @Table decorator (unique on tenantId+name where instance is null)
  uniqueIndex('components_tenantId_name')
    .on(t.tenantId, t.name)
    .where(sql`${t.instance} is null`),
  // Composite unique constraint from the column-level `unique: 'tenantId_name_instance'` option
  uniqueIndex('components_tenantId_name_instance').on(t.tenantId, t.name, t.instance),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof componentTable>();

export function tenantComponentTable(tenantId: number): typeof componentTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Components,
      componentColumns(),
    ) as unknown as typeof componentTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ComponentEntitySchema = createSelectSchema(componentTable);
export const ComponentEntityInsertSchema = createInsertSchema(componentTable);

export type ComponentEntity = z.infer<typeof ComponentEntitySchema>;
export type ComponentEntityInsert = z.infer<typeof ComponentEntityInsertSchema>;
