// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
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
 * Mirrors the legacy `Transactions` table.
 *
 * `stationId` and `transactionId` are nullable on legacy (rows are
 * pre-allocated when the auth flow starts; the wire transactionId
 * lands later). `totalKwh` / `totalCost` / `meterStart` are `numeric`
 * (drizzle returns them as `string` to preserve precision).
 *
 * `stationPkId` FKs to `ChargingStations.pkId` (the integer PK
 * introduced by `add-charging-station-pk-id`); `stationId` (varchar)
 * remains for legacy joins.
 */
export const transactions = pgTable(
  TableName.Transactions,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }),
    transactionId: varchar('transactionId', { length: 255 }),
    isActive: boolean('isActive'),
    chargingState: varchar('chargingState', { length: 255 }),
    timeSpentCharging: bigint('timeSpentCharging', { mode: 'number' }),
    totalKwh: numeric('totalKwh'),
    stoppedReason: varchar('stoppedReason', { length: 255 }),
    remoteStartId: integer('remoteStartId'),
    totalCost: numeric('totalCost'),
    locationId: integer('locationId'),
    /**
     * EVSE the transaction is bound to. Optional because OCPP 1.6 has
     * no EVSE concept (defaults to 0). Used to scope "deactivate other
     * active transactions" on a Started event.
     */
    evseId: integer('evseId'),
    connectorId: integer('connectorId'),
    authorizationId: integer('authorizationId'),
    tariffId: integer('tariffId'),
    startTime: timestamp('startTime', { withTimezone: true }),
    endTime: timestamp('endTime', { withTimezone: true }),
    customData: jsonb('customData'),
    meterStart: numeric('meterStart'),
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
    index('transactions_station_id_idx').on(t.stationId),
    index('transactions_transaction_id_idx').on(t.transactionId),
    uniqueIndex('transactions_station_transaction_unique').on(t.stationId, t.transactionId),
  ],
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
