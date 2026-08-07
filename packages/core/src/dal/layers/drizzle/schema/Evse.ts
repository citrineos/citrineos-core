// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
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
function evseColumns() {
  return {
    // Implicit auto-increment PK (the sequelize model declares no @PrimaryKey).
    id: serial('id').primaryKey(),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    // Serial int used in OCPP 2.0.1 to refer to the EVSE.
    evseTypeId: integer('evseTypeId'),
    // eMI3 compliant EVSE ID
    evseId: varchar('evseId', { length: 255 }),
    physicalReference: varchar('physicalReference', { length: 255 }),
    removed: boolean('removed'),
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
export const evseTable = pgTable(TableName.Evses, evseColumns(), (t) => [
  uniqueIndex('evses_station_id_evse_type_id').on(t.stationId, t.evseTypeId),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof evseTable>();

export function tenantEvseTable(tenantId: number): typeof evseTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Evses,
      evseColumns(),
    ) as unknown as typeof evseTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const EvseEntitySchema = createSelectSchema(evseTable);
export const EvseEntityInsertSchema = createInsertSchema(evseTable);

export type EvseEntity = z.infer<typeof EvseEntitySchema>;
export type EvseEntityInsert = z.infer<typeof EvseEntityInsertSchema>;
