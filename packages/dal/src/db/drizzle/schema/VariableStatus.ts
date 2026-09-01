// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { StatusInfo } from '@citrineos/types';
import { TableName } from '@dal/models/TableName.js';
import { integer, jsonb, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function variableStatusColumns() {
  return {
    // Implicit PK — the sequelize model declares no @PrimaryKey, so Sequelize adds a serial id.
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 4000 }),
    status: varchar('status', { length: 255 }),
    statusInfo: jsonb('statusInfo').$type<StatusInfo>(),
    variableAttributeId: integer('variableAttributeId'),
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
export const variableStatusTable = pgTable(TableName.VariableStatuses, variableStatusColumns());

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof variableStatusTable>();

export function tenantVariableStatusTable(tenantId: number): typeof variableStatusTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.VariableStatuses,
      variableStatusColumns(),
    ) as unknown as typeof variableStatusTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const VariableStatusEntitySchema = createSelectSchema(variableStatusTable);
export const VariableStatusEntityInsertSchema = createInsertSchema(variableStatusTable);

export type VariableStatusEntity = z.infer<typeof VariableStatusEntitySchema>;
export type VariableStatusEntityInsert = z.infer<typeof VariableStatusEntityInsertSchema>;
