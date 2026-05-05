// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Mirrors legacy `ChargingNeeds`. Persisted on each
 * NotifyEVChargingNeeds; ties back to a Transactions row via
 * `transactionDatabaseId`. `departureTime` and `maxScheduleTuples` are
 * EV-side hints to the schedule generator (legacy
 * `_smartChargingService.calculateChargingProfile`).
 */
export const chargingNeeds = pgTable(TableName.ChargingNeeds, {
  id: serial('id').primaryKey(),
  acChargingParameters: jsonb('acChargingParameters'),
  dcChargingParameters: jsonb('dcChargingParameters'),
  departureTime: timestamp('departureTime', { withTimezone: true }),
  requestedEnergyTransfer: varchar('requestedEnergyTransfer', { length: 255 }),
  maxScheduleTuples: integer('maxScheduleTuples'),
  evseId: integer('evseId'),
  /** Soft FK to `Transactions.id` (the legacy column name). */
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
});

export type ChargingNeeds = typeof chargingNeeds.$inferSelect;
export type NewChargingNeeds = typeof chargingNeeds.$inferInsert;
