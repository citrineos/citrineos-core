// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  boolean,
  index,
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
 * Internal EVSE row — mirrors `core/src/dal/layers/sequelize/model/Location/Evse.ts`.
 *
 * One row per (stationId, evseId). Bridge between ChargingStation and
 * the per-connector rows in `Connectors`. OCPP 1.6 chargers don't have
 * an EVSE concept; their connectors are stored with `evseId='0'` directly
 * on `Connectors` and don't need a row here.
 *
 * `evseId` is a varchar (per legacy) — the wire id is integer but legacy
 * stores it as text for portability with 1.6 connector ids; consumers
 * pass `String(number)` to write.
 */
export const evses = pgTable(
  TableName.Evses,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 36 }),
    evseTypeId: integer('evseTypeId'),
    evseId: varchar('evseId', { length: 255 }),
    physicalReference: varchar('physicalReference', { length: 255 }),
    removed: boolean('removed'),
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
    index('evses_station_id_idx').on(t.stationId),
    uniqueIndex('evses_station_evse_unique').on(t.stationId, t.evseId),
  ],
);

export type Evse = typeof evses.$inferSelect;
export type NewEvse = typeof evses.$inferInsert;
