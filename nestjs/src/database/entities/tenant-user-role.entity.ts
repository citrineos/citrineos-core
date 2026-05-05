// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Per-user role assignment within a tenant. Mirrors legacy
 * `core/src/dal/layers/sequelize/model/TenantUserRole.ts`.
 *
 * `userExternalId` is the OIDC subject (`sub` claim) that the JWT
 * carries; we don't store users locally. `role` is a free-form string
 * resolved by the RBAC ruleset (`util.authProvider.rbacRulesFileName`).
 *
 * Unique on `(tenantId, userExternalId, role)` so a user can hold many
 * roles in a tenant but not duplicate one.
 */
export const tenantUserRoles = pgTable(
  TableName.TenantUserRoles,
  {
    id: serial('id').primaryKey(),
    userExternalId: varchar('userExternalId', { length: 255 }).notNull(),
    role: varchar('role', { length: 64 }).notNull(),
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
    index('tenant_user_roles_user_idx').on(t.userExternalId),
    uniqueIndex('tenant_user_roles_unique').on(t.tenantId, t.userExternalId, t.role),
  ],
);

export type TenantUserRole = typeof tenantUserRoles.$inferSelect;
export type NewTenantUserRole = typeof tenantUserRoles.$inferInsert;
