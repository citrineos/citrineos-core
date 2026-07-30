// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ChargingStationCapabilityEnumType,
  ChargingStationParkingRestrictionEnumType,
} from '@citrineos/base';
import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  boolean,
  geometry,
  index,
  integer,
  jsonb,
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
function chargingStationColumns() {
  return {
    id: serial('id').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 36 }),
    isOnline: boolean('isOnline'),
    protocol: varchar('protocol', { length: 255 }),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    latestOcppMessageTimestamp: timestamp('latestOcppMessageTimestamp', {
      withTimezone: true,
      mode: 'date',
    }),
    chargePointVendor: varchar('chargePointVendor', { length: 20 }),
    chargePointModel: varchar('chargePointModel', { length: 20 }),
    chargePointSerialNumber: varchar('chargePointSerialNumber', { length: 25 }),
    chargeBoxSerialNumber: varchar('chargeBoxSerialNumber', { length: 25 }),
    firmwareVersion: varchar('firmwareVersion', { length: 50 }),
    iccid: varchar('iccid', { length: 20 }),
    imsi: varchar('imsi', { length: 20 }),
    meterType: varchar('meterType', { length: 25 }),
    meterSerialNumber: varchar('meterSerialNumber', { length: 25 }),
    // Sequelize GEOMETRY('POINT') → PostGIS point; [longitude, latitude]
    coordinates: geometry('coordinates', { type: 'point' }),
    floorLevel: varchar('floorLevel', { length: 255 }),
    parkingRestrictions:
      jsonb('parkingRestrictions').$type<ChargingStationParkingRestrictionEnumType[]>(),
    capabilities: jsonb('capabilities').$type<ChargingStationCapabilityEnumType[]>(),
    use16StatusNotification0: boolean('use16StatusNotification0').default(true),
    locationId: integer('locationId'),
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
export const chargingStationTable = pgTable(
  TableName.ChargingStations,
  chargingStationColumns(),
  (t) => [
    index('charging_stations_ocpp_connection_name').on(t.ocppConnectionName),
    uniqueIndex('charging_stations_station_name_tenant_id_key').on(
      t.ocppConnectionName,
      t.tenantId,
    ),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof chargingStationTable>();

export function tenantChargingStationTable(tenantId: number): typeof chargingStationTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.ChargingStations,
      chargingStationColumns(),
    ) as unknown as typeof chargingStationTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ChargingStationEntitySchema = createSelectSchema(chargingStationTable);
export const ChargingStationEntityInsertSchema = createInsertSchema(chargingStationTable);

export type ChargingStationEntity = z.infer<typeof ChargingStationEntitySchema>;
export type ChargingStationEntityInsert = z.infer<typeof ChargingStationEntityInsertSchema>;
