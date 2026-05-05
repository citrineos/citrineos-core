// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { index, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Mirrors `core/src/dal/layers/sequelize/model/OCPPMessage.ts`.
 *
 * One row per CALL / CALL_RESULT / CALL_ERROR observed by the router.
 * `origin` records who emitted the frame (cs / csms); `state` distinguishes
 * Request / Response / Error per the legacy `MessageState` enum.
 *
 * `message` carries the wire payload as jsonb. For CALL_ERROR rows
 * legacy stores `{ errorCode, errorDescription, errorDetails }` inside
 * `message` rather than on dedicated columns.
 *
 * `requestMessageId` soft-references the originating CALL row's `id`
 * for response/error frames so the audit trail can reassemble round-trips.
 */
export const ocppMessages = pgTable(
  TableName.OcppMessages,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }),
    correlationId: varchar('correlationId', { length: 255 }),
    origin: varchar('origin', { length: 255 }),
    protocol: varchar('protocol', { length: 255 }),
    action: varchar('action', { length: 255 }),
    message: jsonb('message'),
    state: varchar('state', { length: 255 }),
    timestamp: timestamp('timestamp', { withTimezone: true }),
    /** Soft FK to the originating CALL row's id (for responses / errors). */
    requestMessageId: integer('requestMessageId'),
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
    index('ocpp_messages_correlation_id_idx').on(t.correlationId),
    index('ocpp_messages_station_id_idx').on(t.stationId),
  ],
);

export type OcppMessageRow = typeof ocppMessages.$inferSelect;
export type NewOcppMessageRow = typeof ocppMessages.$inferInsert;
