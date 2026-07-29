// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  boolean,
  integer,
  numeric,
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
function variableCharacteristicsColumns() {
  return {
    // Implicit PK — the sequelize model declares no @PrimaryKey, so Sequelize adds a serial id.
    id: serial('id').primaryKey(),
    unit: varchar('unit', { length: 255 }),
    dataType: varchar('dataType', { length: 255 }),
    // DECIMAL columns — drizzle numeric returns string; converted to number in the repository layer.
    minLimit: numeric('minLimit'),
    maxLimit: numeric('maxLimit'),
    valuesList: varchar('valuesList', { length: 4000 }),
    supportsMonitoring: boolean('supportsMonitoring'),
    variableId: integer('variableId'),
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
export const variableCharacteristicsTable = pgTable(
  TableName.VariableCharacteristics,
  variableCharacteristicsColumns(),
  (t) => [
    // Column-level `unique: true` on variableId
    uniqueIndex('variable_characteristics_variableId').on(t.variableId),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof variableCharacteristicsTable>();

export function tenantVariableCharacteristicsTable(
  tenantId: number,
): typeof variableCharacteristicsTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.VariableCharacteristics,
      variableCharacteristicsColumns(),
    ) as unknown as typeof variableCharacteristicsTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const VariableCharacteristicsEntitySchema = createSelectSchema(variableCharacteristicsTable);
export const VariableCharacteristicsEntityInsertSchema = createInsertSchema(
  variableCharacteristicsTable,
);

export type VariableCharacteristicsEntity = z.infer<typeof VariableCharacteristicsEntitySchema>;
export type VariableCharacteristicsEntityInsert = z.infer<
  typeof VariableCharacteristicsEntityInsertSchema
>;
