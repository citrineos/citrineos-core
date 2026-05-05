// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, json, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Mirrors legacy `MeterValues`. One row per
 * MeterValueType envelope. `sampledValue` (json) holds the array of
 * `SampledValueType` for the envelope; the connector / transaction
 * scoping uses the various FK columns.
 */
export const meterValues = pgTable(TableName.MeterValues, {
  id: serial('id').primaryKey(),
  /** Soft FK to `TransactionEvents.id`. */
  transactionEventId: integer('transactionEventId'),
  /** Soft FK to `Transactions.id`. */
  transactionDatabaseId: integer('transactionDatabaseId'),
  /** Soft FK to `StopTransactions.id` (1.6 only). */
  stopTransactionDatabaseId: integer('stopTransactionDatabaseId'),
  sampledValue: json('sampledValue'),
  timestamp: timestamp('timestamp', { withTimezone: true }),
  connectorId: integer('connectorId'),
  customData: jsonb('customData'),
  /** Soft FK to `Tariffs.id` for OCPP 2.1 cost computation. */
  tariffId: integer('tariffId'),
  /** Wire transactionId (string) — preserved alongside the FK for OCPP 1.6 lookups. */
  transactionId: varchar('transactionId', { length: 255 }),
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

export type MeterValueRow = typeof meterValues.$inferSelect;
export type NewMeterValueRow = typeof meterValues.$inferInsert;
