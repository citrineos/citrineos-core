// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_0_1 } from '@citrineos/types';
import { TableName } from '@dal/models/TableName.js';
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
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
function variableAttributeColumns() {
  return {
    // Implicit PK — the sequelize model declares no @PrimaryKey, so Sequelize adds a serial id.
    id: serial('id').primaryKey(),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }).notNull(),
    // Enum stored as string.
    type: varchar('type', { length: 255 }).default(OCPP2_0_1.AttributeEnumType.Actual),
    dataType: varchar('dataType', { length: 255 }).default(OCPP2_0_1.DataEnumType.string),
    value: varchar('value', { length: 4000 }),
    mutability: varchar('mutability', { length: 255 }).default(
      OCPP2_0_1.MutabilityEnumType.ReadWrite,
    ),
    persistent: boolean('persistent').default(false),
    constant: boolean('constant').default(false),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    generatedAt: timestamp('generatedAt', { withTimezone: true, mode: 'date' }),
    variableId: integer('variableId'),
    componentId: integer('componentId'),
    evseDatabaseId: integer('evseDatabaseId'),
    bootConfigId: integer('bootConfigId'),
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
export const variableAttributeTable = pgTable(
  TableName.VariableAttributes,
  variableAttributeColumns(),
  (t) => [
    // Non-unique @Index on ocppConnectionName
    index('variable_attributes_ocpp_connection_name').on(t.ocppConnectionName),
    // Partial unique indexes from the @Table decorator
    uniqueIndex('variable_attributes_stationId')
      .on(t.stationId)
      .where(sql`${t.type} is null and ${t.variableId} is null and ${t.componentId} is null`),
    uniqueIndex('variable_attributes_stationId_type')
      .on(t.stationId, t.type)
      .where(sql`${t.variableId} is null and ${t.componentId} is null`),
    uniqueIndex('variable_attributes_stationId_variableId')
      .on(t.stationId, t.variableId)
      .where(sql`${t.type} is null and ${t.componentId} is null`),
    uniqueIndex('variable_attributes_stationId_componentId')
      .on(t.stationId, t.componentId)
      .where(sql`${t.type} is null and ${t.variableId} is null`),
    uniqueIndex('variable_attributes_stationId_type_variableId')
      .on(t.stationId, t.type, t.variableId)
      .where(sql`${t.componentId} is null`),
    uniqueIndex('variable_attributes_stationId_type_componentId')
      .on(t.stationId, t.type, t.componentId)
      .where(sql`${t.variableId} is null`),
    uniqueIndex('variable_attributes_stationId_variableId_componentId')
      .on(t.stationId, t.variableId, t.componentId)
      .where(sql`${t.type} is null`),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof variableAttributeTable>();

export function tenantVariableAttributeTable(tenantId: number): typeof variableAttributeTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.VariableAttributes,
      variableAttributeColumns(),
    ) as unknown as typeof variableAttributeTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const VariableAttributeEntitySchema = createSelectSchema(variableAttributeTable);
export const VariableAttributeEntityInsertSchema = createInsertSchema(variableAttributeTable);

export type VariableAttributeEntity = z.infer<typeof VariableAttributeEntitySchema>;
export type VariableAttributeEntityInsert = z.infer<typeof VariableAttributeEntityInsertSchema>;
