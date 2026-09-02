// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import {
  boolean,
  index,
  integer,
  pgSchema,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function subscriptionColumns() {
  return {
    id: serial('id').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }).notNull(),
    onConnect: boolean('onConnect').notNull().default(false),
    onClose: boolean('onClose').notNull().default(false),
    onMessage: boolean('onMessage').notNull().default(false),
    sentMessage: boolean('sentMessage').notNull().default(false),
    messageRegexFilter: varchar('messageRegexFilter', { length: 255 }),
    url: varchar('url', { length: 255 }).notNull(),
    tenantId: integer('tenantId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  };
}

// Row-level tenancy (current approach): single public schema, tenantId column filter on every query
export const subscriptionTable = pgTable(TableName.Subscriptions, subscriptionColumns(), (t) => [
  index('subscriptions_ocpp_connection_name').on(t.ocppConnectionName),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof subscriptionTable>();

// Returns a schema-qualified table reference for schema-per-tenant queries.
// Cast to typeof subscriptionTable so Drizzle's query builder can infer correct
// return types — the column structure is identical, only the schema name differs at runtime.
export function tenantSubscriptionTable(tenantId: number): typeof subscriptionTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Subscriptions,
      subscriptionColumns(),
    ) as unknown as typeof subscriptionTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

// Entity schema: represents a fully-hydrated row read from the database.
export const SubscriptionEntitySchema = createSelectSchema(subscriptionTable);

// Insert schema: represents the subset of fields required/accepted on write.
// drizzle-zod automatically makes columns with $defaultFn optional here.
export const SubscriptionEntityInsertSchema = createInsertSchema(subscriptionTable);

export type SubscriptionEntity = z.infer<typeof SubscriptionEntitySchema>;
export type SubscriptionEntityInsert = z.infer<typeof SubscriptionEntityInsertSchema>;
