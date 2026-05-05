// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { evses } from '@entities/evse.entity';
import { tenants } from '@entities/tenant.entity';

export const components = pgTable(TableName.Components, {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  instance: varchar('instance', { length: 255 }),
  /**
   * Optional FK to `Evses`. Mirrors legacy
   * `Component.evseDatabaseId`: when the wire `ComponentType.evse` is
   * set, the find-or-create pivots on `(name, instance, evseDatabaseId)`
   * so two physically distinct components on different EVSEs don't
   * collapse into a single row.
   */
  evseDatabaseId: integer('evseDatabaseId').references(() => evses.id),
  tenantId: integer('tenantId')
    .notNull()
    .references(() => tenants.id),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type Component = typeof components.$inferSelect;
export type NewComponent = typeof components.$inferInsert;
