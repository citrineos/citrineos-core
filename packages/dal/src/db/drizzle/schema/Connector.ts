// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
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
function connectorColumns() {
  return {
    // Implicit auto-increment PK (the sequelize model declares no @PrimaryKey).
    id: serial('id').primaryKey(),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }).notNull(),
    evseId: integer('evseId').notNull(),
    // Serial int starting at 1 used in OCPP 1.6 to refer to the connector, unique per station.
    connectorId: integer('connectorId').notNull(),
    // Serial int starting at 1 used in OCPP 2.0.1 to refer to the connector, unique per EVSE.
    evseTypeConnectorId: integer('evseTypeConnectorId').notNull(),
    status: varchar('status', { length: 255 }).default('Unknown'),
    type: varchar('type', { length: 255 }),
    format: varchar('format', { length: 255 }),
    errorCode: varchar('errorCode', { length: 255 }).default('NoError'),
    powerType: varchar('powerType', { length: 255 }),
    maximumAmperage: integer('maximumAmperage'),
    maximumVoltage: integer('maximumVoltage'),
    maximumPowerWatts: integer('maximumPowerWatts'),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }),
    info: varchar('info', { length: 255 }),
    vendorId: varchar('vendorId', { length: 255 }),
    vendorErrorCode: varchar('vendorErrorCode', { length: 255 }),
    termsAndConditionsUrl: varchar('termsAndConditionsUrl', { length: 255 }),
    tariffId: integer('tariffId'),
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
export const connectorTable = pgTable(TableName.Connectors, connectorColumns(), (t) => [
  uniqueIndex('connectors_station_id_connector_id').on(t.stationId, t.connectorId),
  uniqueIndex('connectors_evse_id_evse_type_connector_id').on(t.evseId, t.evseTypeConnectorId),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof connectorTable>();

export function tenantConnectorTable(tenantId: number): typeof connectorTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Connectors,
      connectorColumns(),
    ) as unknown as typeof connectorTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ConnectorEntitySchema = createSelectSchema(connectorTable);
export const ConnectorEntityInsertSchema = createInsertSchema(connectorTable);

export type ConnectorEntity = z.infer<typeof ConnectorEntitySchema>;
export type ConnectorEntityInsert = z.infer<typeof ConnectorEntityInsertSchema>;
