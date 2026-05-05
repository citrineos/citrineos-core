// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Postgis `geometry(Point)` type. Drizzle doesn't ship a built-in
 * geometry type; we register one via `customType`. Reads as the WKT
 * string we get from postgis (e.g. `POINT(lng lat)`); writes accept the
 * same. Column-level conversion to/from typed `{ lng, lat }` happens at
 * the repository layer when needed.
 */
const geometryPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'public.geometry(Point)';
  },
});

/**
 * Mirrors `core/src/dal/layers/sequelize/model/Location/ChargingStation.ts`.
 *
 * `locationId` is a soft FK to `Locations.id` — kept as a plain integer
 * (no `.references(() => locations.id)`) to avoid a circular import at
 * Drizzle entity-load time. Application code joins explicitly when it
 * needs the Location row.
 *
 * `pkId` is the integer PK introduced by the
 * `add-charging-station-pk-id` legacy migration: child tables (`Evses`,
 * `Connectors`, `Transactions`, etc.) FK to it via `stationPkId` rather
 * than the wire-level `id` (varchar). The sequence default is set by
 * the legacy migration; we just declare the column.
 */
export const chargingStations = pgTable(TableName.ChargingStations, {
  id: varchar('id', { length: 36 }).primaryKey(),
  isOnline: boolean('isOnline'),
  protocol: varchar('protocol', { length: 255 }),
  chargePointVendor: varchar('chargePointVendor', { length: 20 }),
  chargePointModel: varchar('chargePointModel', { length: 20 }),
  chargePointSerialNumber: varchar('chargePointSerialNumber', { length: 25 }),
  chargeBoxSerialNumber: varchar('chargeBoxSerialNumber', { length: 25 }),
  firmwareVersion: varchar('firmwareVersion', { length: 50 }),
  iccid: varchar('iccid', { length: 20 }),
  imsi: varchar('imsi', { length: 20 }),
  meterType: varchar('meterType', { length: 25 }),
  meterSerialNumber: varchar('meterSerialNumber', { length: 25 }),
  locationId: integer('locationId'),
  coordinates: geometryPoint('coordinates'),
  floorLevel: varchar('floorLevel', { length: 255 }),
  parkingRestrictions: jsonb('parkingRestrictions'),
  capabilities: jsonb('capabilities'),
  use16StatusNotification0: boolean('use16StatusNotification0').notNull().default(true),
  latestOcppMessageTimestamp: timestamp('latestOcppMessageTimestamp', { withTimezone: true }),
  // Sequence default lives in the legacy migration; drizzle treats this
  // as default-provided so inserts can omit it.
  pkId: integer('pkId')
    .notNull()
    .default(sql`nextval('public."ChargingStations_pkId_seq"'::regclass)`),
  tenantId: integer('tenantId')
    .notNull()
    .default(sql`1`)
    .references(() => tenants.id),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type ChargingStation = typeof chargingStations.$inferSelect;
export type NewChargingStation = typeof chargingStations.$inferInsert;
