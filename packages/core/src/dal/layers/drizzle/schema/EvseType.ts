// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import { sql } from 'drizzle-orm';
import {
  integer,
  pgSchema,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function evseTypeColumns() {
  return {
    // @AutoIncrement @PrimaryKey integer surrogate key (named databaseId in the model).
    databaseId: serial('databaseId').primaryKey(),
    // The OCPP EVSE id (not the primary key).
    id: integer('id'),
    connectorId: integer('connectorId'),
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
export const evseTypeTable = pgTable(TableName.EvseTypes, evseTypeColumns(), (t) => [
  // Partial unique index from the @Table decorator (unique on tenantId+id where connectorId is null)
  uniqueIndex('evse_types_tenantId_id')
    .on(t.tenantId, t.id)
    .where(sql`${t.connectorId} is null`),
  // Composite unique constraint from the column-level `unique: 'tenantId_id_connectorId'` option
  uniqueIndex('evse_types_tenantId_id_connectorId').on(t.tenantId, t.id, t.connectorId),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof evseTypeTable>();

export function tenantEvseTypeTable(tenantId: number): typeof evseTypeTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.EvseTypes,
      evseTypeColumns(),
    ) as unknown as typeof evseTypeTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const EvseTypeEntitySchema = createSelectSchema(evseTypeTable);
export const EvseTypeEntityInsertSchema = createInsertSchema(evseTypeTable);

export type EvseTypeEntity = z.infer<typeof EvseTypeEntitySchema>;
export type EvseTypeEntityInsert = z.infer<typeof EvseTypeEntityInsertSchema>;
