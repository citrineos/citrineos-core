// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
import { integer, pgSchema, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
// Pure many-to-many join table (Component <-> Variable): composite FK columns, no serial id.
function componentVariableColumns() {
  return {
    componentId: integer('componentId').notNull(),
    variableId: integer('variableId').notNull(),
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
export const componentVariableTable = pgTable(
  TableName.ComponentVariables,
  componentVariableColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof componentVariableTable>();

export function tenantComponentVariableTable(tenantId: number): typeof componentVariableTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.ComponentVariables,
      componentVariableColumns(),
    ) as unknown as typeof componentVariableTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ComponentVariableEntitySchema = createSelectSchema(componentVariableTable);
export const ComponentVariableEntityInsertSchema = createInsertSchema(componentVariableTable);

export type ComponentVariableEntity = z.infer<typeof ComponentVariableEntitySchema>;
export type ComponentVariableEntityInsert = z.infer<typeof ComponentVariableEntityInsertSchema>;
