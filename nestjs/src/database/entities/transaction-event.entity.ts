// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  boolean,
  index,
  integer,
  json,
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Mirrors legacy `TransactionEvents`. Each row is the audit-trail
 * record for a single TransactionEvent CALL — joined back to the live
 * `Transactions` row via `transactionDatabaseId`. The full wire payload
 * lives on `transactionInfo` (json); the flat columns mirror the
 * top-level fields the legacy ORM exposes for ad-hoc queries.
 *
 * `stationId` is denormalized for query convenience even though it's
 * also reachable through the `transactionDatabaseId` FK.
 */
export const transactionEvents = pgTable(
  TableName.TransactionEvents,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }),
    eventType: varchar('eventType', { length: 255 }),
    timestamp: timestamp('timestamp', { withTimezone: true }),
    triggerReason: varchar('triggerReason', { length: 255 }),
    seqNo: integer('seqNo'),
    offline: boolean('offline').default(false),
    numberOfPhasesUsed: integer('numberOfPhasesUsed'),
    cableMaxCurrent: numeric('cableMaxCurrent'),
    reservationId: integer('reservationId'),
    transactionInfo: json('transactionInfo'),
    /** Soft FK to `Transactions.id`. */
    transactionDatabaseId: integer('transactionDatabaseId'),
    evseId: integer('evseId'),
    idTokenValue: varchar('idTokenValue', { length: 255 }),
    idTokenType: varchar('idTokenType', { length: 255 }),
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
  (t) => [index('tx_events_transaction_database_id_idx').on(t.transactionDatabaseId)],
);

export type TransactionEventRow = typeof transactionEvents.$inferSelect;
export type NewTransactionEventRow = typeof transactionEvents.$inferInsert;
