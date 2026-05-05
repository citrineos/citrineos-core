// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, json, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * A single entry in a charger's local authorization list. Mirrors the
 * shape of `Authorizations` but lives separately because the local
 * list is versioned per station and snapshotted with each
 * `SendLocalList` round-trip.
 *
 * `authorizationId` and `groupAuthorizationId` are soft FKs to
 * `Authorizations.id` (legacy doesn't enforce them at the DB level).
 */
export const localListAuthorizations = pgTable(TableName.LocalListAuthorizations, {
  id: serial('id').primaryKey(),
  allowedConnectorTypes: varchar('allowedConnectorTypes', { length: 255 })
    .array()
    .$type<string[] | null>(),
  disallowedEvseIdPrefixes: varchar('disallowedEvseIdPrefixes', { length: 255 })
    .array()
    .$type<string[] | null>(),
  authorizationId: integer('authorizationId'),
  groupAuthorizationId: integer('groupAuthorizationId'),
  idToken: varchar('idToken', { length: 255 }).notNull(),
  idTokenType: varchar('idTokenType', { length: 255 }),
  additionalInfo: jsonb('additionalInfo'),
  status: varchar('status', { length: 255 }).notNull().default('Accepted'),
  cacheExpiryDateTime: timestamp('cacheExpiryDateTime', { withTimezone: true }),
  chargingPriority: integer('chargingPriority'),
  language1: varchar('language1', { length: 255 }),
  language2: varchar('language2', { length: 255 }),
  personalMessage: json('personalMessage'),
  customData: jsonb('customData'),
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

export type LocalListAuthorization = typeof localListAuthorizations.$inferSelect;
export type NewLocalListAuthorization = typeof localListAuthorizations.$inferInsert;
