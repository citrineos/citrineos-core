// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { index, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { authorizations } from '@entities/authorization.entity';
import { tenants } from '@entities/tenant.entity';

/**
 * Per-token restriction rules beyond the simple CSV columns
 * (`disallowedEvseIdPrefixes`, `allowedConnectorTypes`) we keep on
 * `Authorizations`. Each row is one rule: time-of-day window, max-energy
 * cap, max-cost cap, location allowlist, etc. Authorizers compose them.
 *
 * Mirrors legacy `core/src/dal/layers/sequelize/model/AuthorizationRestriction.ts`.
 *
 * `kind` discriminates the rule shape; the parameters live in `data`
 * (JSONB) so we can grow rule kinds without migrations.
 */
export const authorizationRestrictions = pgTable(
  TableName.AuthorizationRestrictions,
  {
    id: serial('id').primaryKey(),
    authorizationId: integer('authorizationId').references(() => authorizations.id),
    /** Discriminator — `time_window`, `max_energy_kwh`, `max_cost`, `location`, etc. */
    kind: varchar('kind', { length: 64 }).notNull(),
    /** Rule-specific parameters interpreted by the matching authorizer. */
    data: jsonb('data'),
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
  (t) => [index('auth_restrictions_authorization_id_idx').on(t.authorizationId)],
);

export type AuthorizationRestriction = typeof authorizationRestrictions.$inferSelect;
export type NewAuthorizationRestriction = typeof authorizationRestrictions.$inferInsert;
