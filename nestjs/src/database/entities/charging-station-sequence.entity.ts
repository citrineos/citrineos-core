// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  bigint,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Per-(station, sequence-type) monotonic counter. Used by the request-id
 * generator for OCPP CALLs that need a fresh integer ID
 * (`getBaseReports`, `getDisplayMessages`, `getChargingProfiles`, …).
 *
 * Mirrors legacy `ChargingStationSequence` Sequelize model.
 */
export const chargingStationSequences = pgTable(
  TableName.ChargingStationSequences,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 36 }).notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    value: bigint('value', { mode: 'number' }).notNull().default(0),
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
    uniqueIndex('charging_station_sequences_station_type_tenant_unique').on(
      t.stationId,
      t.type,
      t.tenantId,
    ),
  ],
);

export type ChargingStationSequence = typeof chargingStationSequences.$inferSelect;
export type NewChargingStationSequence = typeof chargingStationSequences.$inferInsert;
