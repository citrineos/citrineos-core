// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Per-station security material — currently the FileStorage id of the
 * configured public key used to verify signed meter values.
 *
 * Mirrors `core/src/dal/layers/sequelize/model/ChargingStationSecurityInfo.ts`.
 * The signed-meter-value validator looks the row up keyed on
 * `(tenantId, stationId)` and asks `FileStorage` for the PEM blob.
 *
 * One row per (tenantId, stationId) — enforced by the unique index.
 */
export const chargingStationSecurityInfos = pgTable(
  TableName.ChargingStationSecurityInfos,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }),
    /** FileStorage id of the PEM-encoded public key used for signature verification. */
    publicKeyFileId: varchar('publicKeyFileId', { length: 255 }),
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
  (t) => [uniqueIndex('cs_security_info_station_tenant').on(t.stationId, t.tenantId)],
);

export type ChargingStationSecurityInfo = typeof chargingStationSecurityInfos.$inferSelect;
export type NewChargingStationSecurityInfo = typeof chargingStationSecurityInfos.$inferInsert;
