// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
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
function variableMonitoringColumns() {
  return {
    // @AutoIncrement @PrimaryKey integer — surrogate key.
    databaseId: serial('databaseId').primaryKey(),
    // FK to ChargingStation; not part of the VariableMonitoringDto contract.
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    // OCPP monitoring id (distinct from the databaseId surrogate key).
    id: integer('id'),
    transaction: boolean('transaction'),
    value: integer('value'),
    type: varchar('type', { length: 255 }),
    severity: integer('severity'),
    // OCPP 2.1 field
    eventNotificationType: varchar('eventNotificationType', { length: 255 }),
    variableId: integer('variableId'),
    componentId: integer('componentId'),
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
export const variableMonitoringTable = pgTable(
  TableName.VariableMonitorings,
  variableMonitoringColumns(),
  (t) => [
    index('variable_monitorings_ocpp_connection_name').on(t.ocppConnectionName),
    // Composite unique 'stationName_tenantId_Id' (ocppConnectionName, id, tenantId).
    uniqueIndex('variable_monitorings_station_name_tenant_id_id').on(
      t.ocppConnectionName,
      t.id,
      t.tenantId,
    ),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof variableMonitoringTable>();

export function tenantVariableMonitoringTable(tenantId: number): typeof variableMonitoringTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.VariableMonitorings,
      variableMonitoringColumns(),
    ) as unknown as typeof variableMonitoringTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const VariableMonitoringEntitySchema = createSelectSchema(variableMonitoringTable);
export const VariableMonitoringEntityInsertSchema = createInsertSchema(variableMonitoringTable);

export type VariableMonitoringEntity = z.infer<typeof VariableMonitoringEntitySchema>;
export type VariableMonitoringEntityInsert = z.infer<typeof VariableMonitoringEntityInsertSchema>;
