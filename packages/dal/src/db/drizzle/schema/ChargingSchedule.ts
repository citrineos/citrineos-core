// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
import {
  integer,
  jsonb,
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
function chargingScheduleColumns() {
  return {
    // Auto-increment surrogate PK (@PrimaryKey @AutoIncrement on databaseId).
    databaseId: serial('databaseId').primaryKey(),
    id: integer('id'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    chargingRateUnit: varchar('chargingRateUnit', { length: 255 }),
    chargingSchedulePeriod: jsonb('chargingSchedulePeriod').$type<[any, ...any[]]>(),
    duration: integer('duration'),
    // DataType.DECIMAL → numeric (drizzle returns it as a string; converted in the repository layer)
    minChargingRate: numeric('minChargingRate'),
    startSchedule: varchar('startSchedule', { length: 255 }),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timeBase: timestamp('timeBase', { withTimezone: true, mode: 'date' }),
    chargingProfileDatabaseId: integer('chargingProfileDatabaseId'),
    // FK id column (no DTO field; present in the underlying table).
    salesTariffId: integer('salesTariffId'),
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
export const chargingScheduleTable = pgTable(
  TableName.ChargingSchedules,
  chargingScheduleColumns(),
  // Sequelize composite unique 'stationName_tenantId_id'.
  (t) => [
    uniqueIndex('charging_schedules_id_ocpp_connection_name_tenant_id').on(
      t.id,
      t.ocppConnectionName,
      t.tenantId,
    ),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof chargingScheduleTable>();

export function tenantChargingScheduleTable(tenantId: number): typeof chargingScheduleTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.ChargingSchedules,
      chargingScheduleColumns(),
    ) as unknown as typeof chargingScheduleTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ChargingScheduleEntitySchema = createSelectSchema(chargingScheduleTable);
export const ChargingScheduleEntityInsertSchema = createInsertSchema(chargingScheduleTable);

export type ChargingScheduleEntity = z.infer<typeof ChargingScheduleEntitySchema>;
export type ChargingScheduleEntityInsert = z.infer<typeof ChargingScheduleEntityInsertSchema>;
