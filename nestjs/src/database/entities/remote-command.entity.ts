// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { index, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Persistent record of every CSMS-initiated CALL (Reset, TriggerMessage,
 * RequestStartTransaction, ReserveNow, …) keyed by the OCPP correlation
 * id. Captures the request payload sent and the response status returned
 * by the charger.
 *
 * Distinct from the `OcppMessages` audit trail: this table dedups by
 * correlationId (one row per round-trip, not one row per frame) and
 * carries a human-readable `result` so ops dashboards can show "this
 * Reset on station X was Accepted at 13:42" without reconstructing it
 * from two audit rows.
 *
 * Populated lazily by RemoteCallsService once the response handler chain
 * receives the charger's CALL_RESULT.
 */
export const remoteCommands = pgTable(
  TableName.RemoteCommands,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }).notNull(),
    correlationId: varchar('correlationId', { length: 255 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    /** Outgoing CALL payload — what the CSMS sent. */
    requestPayload: jsonb('requestPayload'),
    /** Charger's CALL_RESULT — populated once the response handler fires. */
    responsePayload: jsonb('responsePayload'),
    /**
     * Coarse outcome: `pending` (sent, awaiting response), `accepted`,
     * `rejected`, `failed` (transport error), `timeout`.
     */
    result: varchar('result', { length: 32 }).notNull().default('pending'),
    /** Optional free-form failure detail when result != accepted. */
    reason: varchar('reason', { length: 500 }),
    requestedAt: timestamp('requestedAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    completedAt: timestamp('completedAt', { withTimezone: true }),
    tenantId: integer('tenantId')
      .notNull()
      .references(() => tenants.id),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index('remote_commands_station_id_idx').on(t.stationId),
    index('remote_commands_correlation_id_idx').on(t.correlationId),
  ],
);

export type RemoteCommand = typeof remoteCommands.$inferSelect;
export type NewRemoteCommand = typeof remoteCommands.$inferInsert;
