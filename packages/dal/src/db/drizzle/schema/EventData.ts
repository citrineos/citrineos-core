// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
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
function eventDataColumns() {
  return {
    // No @PrimaryKey in the model → Sequelize adds an auto-increment integer id.
    id: serial('id').primaryKey(),
    // FK to ChargingStation; not part of the EventDataDto contract.
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    eventId: integer('eventId'),
    trigger: varchar('trigger', { length: 255 }),
    cause: integer('cause'),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }),
    actualValue: varchar('actualValue', { length: 255 }),
    techCode: varchar('techCode', { length: 255 }),
    techInfo: varchar('techInfo', { length: 255 }),
    cleared: boolean('cleared'),
    transactionId: varchar('transactionId', { length: 255 }),
    variableMonitoringId: integer('variableMonitoringId'),
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
export const eventDataTable = pgTable(TableName.EventData, eventDataColumns(), (t) => [
  index('event_data_ocpp_connection_name').on(t.ocppConnectionName),
  // Composite unique 'stationName_tenantId_eventId' (ocppConnectionName, tenantId).
  uniqueIndex('event_data_station_name_tenant_id_event_id').on(t.ocppConnectionName, t.tenantId),
  // Single-column unique 'stationName_eventId' (eventId) as declared on the model.
  uniqueIndex('event_data_station_name_event_id').on(t.eventId),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof eventDataTable>();

export function tenantEventDataTable(tenantId: number): typeof eventDataTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.EventData,
      eventDataColumns(),
    ) as unknown as typeof eventDataTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const EventDataEntitySchema = createSelectSchema(eventDataTable);
export const EventDataEntityInsertSchema = createInsertSchema(eventDataTable);

export type EventDataEntity = z.infer<typeof EventDataEntitySchema>;
export type EventDataEntityInsert = z.infer<typeof EventDataEntityInsertSchema>;
