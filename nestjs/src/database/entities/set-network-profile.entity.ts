// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Pending CSMS-initiated `SetNetworkProfile` request. Created when the
 * CSMS sends the CALL; the response handler resolves it on
 * `Accepted` by upserting `ChargingStationNetworkProfile` to the new
 * slot. Mirrors legacy `SetNetworkProfile` Sequelize model.
 */
export const setNetworkProfiles = pgTable(TableName.SetNetworkProfiles, {
  id: serial('id').primaryKey(),
  stationId: varchar('stationId', { length: 255 }),
  correlationId: varchar('correlationId', { length: 255 }),
  websocketServerConfigId: varchar('websocketServerConfigId', { length: 255 }),
  configurationSlot: integer('configurationSlot'),
  ocppVersion: varchar('ocppVersion', { length: 255 }),
  ocppTransport: varchar('ocppTransport', { length: 255 }),
  ocppCsmsUrl: varchar('ocppCsmsUrl', { length: 255 }),
  messageTimeout: integer('messageTimeout'),
  securityProfile: integer('securityProfile'),
  ocppInterface: varchar('ocppInterface', { length: 255 }),
  apn: varchar('apn', { length: 255 }),
  vpn: varchar('vpn', { length: 255 }),
  /** Soft FK to `ChargingStations.pkId` per the legacy migration. */
  stationPkId: integer('stationPkId'),
  tenantId: integer('tenantId')
    .notNull()
    .references(() => tenants.id),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type SetNetworkProfile = typeof setNetworkProfiles.$inferSelect;
export type NewSetNetworkProfile = typeof setNetworkProfiles.$inferInsert;
