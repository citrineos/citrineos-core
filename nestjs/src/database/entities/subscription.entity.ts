// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Mirrors legacy `Subscriptions`. Operator-configured webhook recipient
 * keyed on `stationId`; the per-event flags decide which OCPP frame
 * categories trigger a POST to `url`. `messageRegexFilter` lets the
 * operator filter further on payload content.
 *
 * Note: the runtime webhook fan-out service (`WebhookService`) reads
 * an in-config `WebhookEndpoint[]` shape rather than this table —
 * Subscriptions is the persisted alternative for runtime CRUD via
 * Hasura. The two paths have parallel intent; convergence is owed.
 */
export const subscriptions = pgTable(TableName.Subscriptions, {
  id: serial('id').primaryKey(),
  stationId: varchar('stationId', { length: 255 }),
  onConnect: boolean('onConnect').default(false),
  onClose: boolean('onClose').default(false),
  onMessage: boolean('onMessage').default(false),
  sentMessage: boolean('sentMessage').default(false),
  messageRegexFilter: varchar('messageRegexFilter', { length: 255 }),
  url: varchar('url', { length: 255 }),
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

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
