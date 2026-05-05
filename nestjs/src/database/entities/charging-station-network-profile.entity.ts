// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { setNetworkProfiles } from '@entities/set-network-profile.entity';
import { serverNetworkProfiles } from '@entities/server-network-profile.entity';
import { tenants } from '@entities/tenant.entity';

/**
 * Per-(station, configurationSlot) join row carrying which
 * `SetNetworkProfile` is currently in effect and which
 * `ServerNetworkProfile` (CSMS listener) it points at.
 *
 * Mirrors legacy `ChargingStationNetworkProfile` — no synthetic `id`
 * PK; the natural key is `(stationId, configurationSlot, tenantId)`.
 */
export const chargingStationNetworkProfiles = pgTable(
  TableName.ChargingStationNetworkProfiles,
  {
    stationId: varchar('stationId', { length: 36 }).notNull(),
    configurationSlot: integer('configurationSlot'),
    setNetworkProfileId: integer('setNetworkProfileId')
      .notNull()
      .references(() => setNetworkProfiles.id),
    websocketServerConfigId: varchar('websocketServerConfigId', { length: 255 }).references(
      () => serverNetworkProfiles.id,
    ),
    /** Soft FK to `ChargingStations.pkId` per the legacy migration. */
    stationPkId: integer('stationPkId'),
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
  },
  (t) => [
    uniqueIndex('csn_profiles_station_slot_tenant_unique').on(
      t.stationId,
      t.configurationSlot,
      t.tenantId,
    ),
  ],
);

export type ChargingStationNetworkProfile = typeof chargingStationNetworkProfiles.$inferSelect;
export type NewChargingStationNetworkProfile = typeof chargingStationNetworkProfiles.$inferInsert;
