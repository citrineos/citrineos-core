// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  boolean,
  index,
  integer,
  jsonb,
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
 * Mirrors the legacy `Reservations` table.
 *
 * Two id columns: `databaseId` is the local PK (serial); `id` is the
 * wire-level reservationId from OCPP — nullable because legacy
 * pre-allocates a row before the wire id is known. `idToken` /
 * `groupIdToken` carry the full OCPP `IdTokenType` object as jsonb
 * (legacy denormalizes them on the row rather than FK-ing to
 * `Authorizations`).
 */
export const reservations = pgTable(
  TableName.Reservations,
  {
    databaseId: serial('databaseId').primaryKey(),
    id: integer('id'),
    stationId: varchar('stationId', { length: 255 }),
    expiryDateTime: timestamp('expiryDateTime', { withTimezone: true }),
    connectorType: varchar('connectorType', { length: 255 }),
    reserveStatus: varchar('reserveStatus', { length: 255 }),
    isActive: boolean('isActive').default(false),
    /**
     * Forensic FK — set when a 1.6 StartTransaction with a matching
     * `reservationId` consumes the reservation. Mirrors legacy
     * `Reservation.terminatedByTransaction`.
     */
    terminatedByTransaction: varchar('terminatedByTransaction', { length: 255 }),
    /** Full wire `IdTokenType` object as jsonb. */
    idToken: jsonb('idToken'),
    /** Full wire `IdTokenType` object as jsonb (parent / group token). */
    groupIdToken: jsonb('groupIdToken'),
    evseId: integer('evseId'),
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
    index('reservations_station_id_idx').on(t.stationId),
    uniqueIndex('reservations_id_station_unique').on(t.id, t.stationId),
  ],
);

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
