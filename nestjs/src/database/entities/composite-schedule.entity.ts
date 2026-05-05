// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

export const compositeSchedules = pgTable(TableName.CompositeSchedules, {
  id: serial('id').primaryKey(),
  stationId: varchar('stationId', { length: 255 }).notNull(),
  evseId: integer('evseId'),
  duration: integer('duration'),
  scheduleStart: timestamp('scheduleStart', { withTimezone: true }),
  chargingRateUnit: varchar('chargingRateUnit', { length: 32 }),
  chargingSchedulePeriod: jsonb('chargingSchedulePeriod'),
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

export type CompositeSchedule = typeof compositeSchedules.$inferSelect;
export type NewCompositeSchedule = typeof compositeSchedules.$inferInsert;
