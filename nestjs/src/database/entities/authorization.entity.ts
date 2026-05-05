// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  boolean,
  customType,
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
 * Postgres `citext` type — case-insensitive text. Legacy uses this for
 * `idToken` so EMV-style tokens compare case-insensitively. Drizzle
 * doesn't ship a built-in citext column type, so we register one via
 * `customType`. The `dataType()` returns the SQL type name; reads/writes
 * are plain string.
 */
const citext = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'public.citext';
  },
});

/**
 * Mirrors the legacy `Authorizations` table after the
 * 20250621-flatten-authorization migration plus the realtime-auth +
 * tariff + prepaid additions. `status` carries
 * `AuthorizationStatusEnumType` values; group authorizations are
 * tracked via the `groupAuthorizationId` self-FK rather than a flat
 * `groupIdToken/groupIdTokenType` pair.
 */
export const authorizations = pgTable(
  TableName.Authorizations,
  {
    id: serial('id').primaryKey(),
    /** EMV-style token; `citext` for case-insensitive lookups. */
    idToken: citext('idToken').notNull(),
    idTokenType: varchar('idTokenType', { length: 255 }),
    additionalInfo: jsonb('additionalInfo'),
    status: varchar('status', { length: 255 }).notNull().default('Accepted'),
    cacheExpiryDateTime: timestamp('cacheExpiryDateTime', { withTimezone: true }),
    chargingPriority: integer('chargingPriority'),
    language1: varchar('language1', { length: 255 }),
    language2: varchar('language2', { length: 255 }),
    personalMessage: jsonb('personalMessage'),
    customData: jsonb('customData'),
    /**
     * Self-FK — when this row authorizes a token that's a member of a
     * group, this points at the row representing the group's "parent"
     * idToken. Mirrors legacy `Authorization.groupAuthorizationId`.
     */
    groupAuthorizationId: integer('groupAuthorizationId'),
    tenantPartnerId: integer('tenantPartnerId'),
    concurrentTransaction: boolean('concurrentTransaction').default(false),
    realTimeAuth: varchar('realTimeAuth', { length: 255 }).notNull().default('Never'),
    realTimeAuthUrl: varchar('realTimeAuthUrl', { length: 255 }),
    realTimeAuthLastAttempt: jsonb('realTimeAuthLastAttempt'),
    realTimeAuthTimeout: integer('realTimeAuthTimeout'),
    /** Per-token authorization restriction lists (legacy stores as varchar[]). */
    allowedConnectorTypes: varchar('allowedConnectorTypes', { length: 255 })
      .array()
      .$type<string[] | null>(),
    disallowedEvseIdPrefixes: varchar('disallowedEvseIdPrefixes', { length: 255 })
      .array()
      .$type<string[] | null>(),
    tariffId: integer('tariffId'),
    isPrepaid: boolean('isPrepaid').notNull().default(false),
    prepaidBalance: numeric('prepaidBalance'),
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
    index('authorizations_id_token_idx').on(t.idToken),
    uniqueIndex('authorizations_idtoken_type_tenant').on(t.idToken, t.idTokenType, t.tenantId),
  ],
);

export type Authorization = typeof authorizations.$inferSelect;
export type NewAuthorization = typeof authorizations.$inferInsert;
