// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
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
function chargingStationNetworkProfileColumns() {
  return {
    // Implicit auto-increment PK (the sequelize model declares no @PrimaryKey).
    id: serial('id').primaryKey(),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    configurationSlot: integer('configurationSlot'),
    setNetworkProfileId: integer('setNetworkProfileId'),
    websocketServerConfigId: varchar('websocketServerConfigId', { length: 255 }),
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
export const chargingStationNetworkProfileTable = pgTable(
  TableName.ChargingStationNetworkProfiles,
  chargingStationNetworkProfileColumns(),
  (t) => [
    uniqueIndex('charging_station_network_profiles_station_id_configuration_slot').on(
      t.stationId,
      t.configurationSlot,
    ),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof chargingStationNetworkProfileTable>();

export function tenantChargingStationNetworkProfileTable(
  tenantId: number,
): typeof chargingStationNetworkProfileTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.ChargingStationNetworkProfiles,
      chargingStationNetworkProfileColumns(),
    ) as unknown as typeof chargingStationNetworkProfileTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ChargingStationNetworkProfileEntitySchema = createSelectSchema(
  chargingStationNetworkProfileTable,
);
export const ChargingStationNetworkProfileEntityInsertSchema = createInsertSchema(
  chargingStationNetworkProfileTable,
);

export type ChargingStationNetworkProfileEntity = z.infer<
  typeof ChargingStationNetworkProfileEntitySchema
>;
export type ChargingStationNetworkProfileEntityInsert = z.infer<
  typeof ChargingStationNetworkProfileEntityInsertSchema
>;
