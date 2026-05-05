// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * History of firmware update operations. One row per `UpdateFirmware`
 * round-trip, capturing the requested firmware location + the
 * subsequent FirmwareStatusNotification chain (`Downloading`, `Downloaded`,
 * `Installing`, `Installed` / `InstallationFailed`).
 *
 * Mirrors legacy `core/src/dal/layers/sequelize/model/OcppFirmwareUpdate.ts`.
 *
 * `lastStatus` is overwritten as the charger reports progress; the
 * full progression is reconstructable from `OcppMessages` for forensics.
 */
export const ocppFirmwareUpdate = pgTable(
  TableName.OcppFirmwareUpdate,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }).notNull(),
    /** OCPP `requestId` set by the originating UpdateFirmware CALL. */
    requestId: integer('requestId').notNull(),
    /** Firmware download URL (where the charger pulls the bundle from). */
    location: varchar('location', { length: 1000 }),
    /** Current charger-reported status — most recent FirmwareStatusNotification. */
    lastStatus: varchar('lastStatus', { length: 64 }),
    /** Wall-clock time of the last status update. */
    lastStatusAt: timestamp('lastStatusAt', { withTimezone: true }),
    requestedAt: timestamp('requestedAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    tenantId: integer('tenantId')
      .notNull()
      .references(() => tenants.id),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index('ocpp_firmware_update_station_id_idx').on(t.stationId),
    index('ocpp_firmware_update_request_id_idx').on(t.requestId),
  ],
);

export type OcppFirmwareUpdate = typeof ocppFirmwareUpdate.$inferSelect;
export type NewOcppFirmwareUpdate = typeof ocppFirmwareUpdate.$inferInsert;
