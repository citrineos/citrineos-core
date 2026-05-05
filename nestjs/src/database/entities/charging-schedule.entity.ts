// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, jsonb, numeric, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { chargingProfiles } from '@entities/charging-profile.entity';
import { tenants } from '@entities/tenant.entity';

/**
 * One row per ChargingProfile's schedule. Legacy stores the schedule
 * separately from the profile so a profile can carry multiple
 * schedules (renewable, fallback, etc.). Mirrors legacy
 * `core/src/dal/.../ChargingProfile/ChargingSchedule.ts`.
 *
 * `id` here is the OCPP-protocol-level schedule id (the charger's own
 * numbering); `chargingProfileDatabaseId` FKs back to our internal row.
 */
export const chargingSchedules = pgTable(TableName.ChargingSchedules, {
  databaseId: serial('databaseId').primaryKey(),
  id: integer('id').notNull(),
  stationId: varchar('stationId', { length: 255 }).notNull(),
  chargingRateUnit: varchar('chargingRateUnit', { length: 16 }).notNull(),
  chargingSchedulePeriod: jsonb('chargingSchedulePeriod').notNull(),
  duration: integer('duration'),
  minChargingRate: numeric('minChargingRate'),
  startSchedule: varchar('startSchedule', { length: 64 }),
  timeBase: varchar('timeBase', { length: 64 }),
  chargingProfileDatabaseId: integer('chargingProfileDatabaseId').references(
    () => chargingProfiles.id,
  ),
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

export type ChargingSchedule = typeof chargingSchedules.$inferSelect;
export type NewChargingSchedule = typeof chargingSchedules.$inferInsert;
