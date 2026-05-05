// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { localAuthListVersions } from '@entities/local-auth-list-version.entity';
import { localListAuthorizations } from '@entities/local-list-authorization.entity';
import { tenants } from '@entities/tenant.entity';

/**
 * Junction table: which `LocalListAuthorization` entries are LIVE on
 * the charger right now (per the latest accepted `LocalAuthListVersion`).
 * Mirrors legacy `LocalListVersionAuthorization` — composite PK on
 * `(localListVersionId, authorizationId)`, no synthetic `id`.
 */
export const localListVersionAuthorizations = pgTable(
  TableName.LocalListVersionAuthorizations,
  {
    localListVersionId: integer('localListVersionId')
      .notNull()
      .references(() => localAuthListVersions.id),
    authorizationId: integer('authorizationId')
      .notNull()
      .references(() => localListAuthorizations.id),
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
  (t) => [primaryKey({ columns: [t.localListVersionId, t.authorizationId] })],
);

export type LocalListVersionAuthorization = typeof localListVersionAuthorizations.$inferSelect;
export type NewLocalListVersionAuthorization = typeof localListVersionAuthorizations.$inferInsert;
