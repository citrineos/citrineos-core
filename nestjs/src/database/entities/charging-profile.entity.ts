// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Mirrors legacy `ChargingProfiles`. `databaseId` is the local PK
 * (serial); `id` is the wire-level chargingProfileId. Schedule data
 * lives on the separate `ChargingSchedules` table; this row only
 * carries the profile's metadata.
 */
export const chargingProfiles = pgTable(
  TableName.ChargingProfiles,
  {
    databaseId: serial('databaseId').primaryKey(),
    stationId: varchar('stationId', { length: 255 }),
    id: integer('id'),
    chargingProfileKind: varchar('chargingProfileKind', { length: 255 }),
    chargingProfilePurpose: varchar('chargingProfilePurpose', { length: 255 }),
    recurrencyKind: varchar('recurrencyKind', { length: 255 }),
    stackLevel: integer('stackLevel'),
    validFrom: timestamp('validFrom', { withTimezone: true }),
    validTo: timestamp('validTo', { withTimezone: true }),
    evseId: integer('evseId'),
    isActive: boolean('isActive').default(false),
    /**
     * Source of the charging-limit decision (`EMS` / `Other` / `SO` /
     * `CSO`). Wire field of `ReportChargingProfilesRequest`.
     */
    chargingLimitSource: varchar('chargingLimitSource', { length: 255 }).default('CSO'),
    /** Soft FK to `Transactions.id`. */
    transactionDatabaseId: integer('transactionDatabaseId'),
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
  (t) => [index('charging_profiles_station_id_idx').on(t.stationId)],
);

export type ChargingProfile = typeof chargingProfiles.$inferSelect;
export type NewChargingProfile = typeof chargingProfiles.$inferInsert;
