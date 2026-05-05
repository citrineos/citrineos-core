// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { components } from '@entities/component.entity';
import { tenants } from '@entities/tenant.entity';
import { variables } from '@entities/variable.entity';

/**
 * Junction table for the (Component, Variable) many-to-many.
 *
 * The same Variable name can apply to multiple Components (e.g. a
 * `Status` variable on every Connector). This table records which
 * Variables belong to which Components per the OCPP 2.0.1 device
 * model.
 *
 * Mirrors legacy `ComponentVariable` — composite PK on
 * `(componentId, variableId)`, no synthetic `id`.
 */
export const componentVariables = pgTable(
  TableName.ComponentVariables,
  {
    componentId: integer('componentId')
      .notNull()
      .references(() => components.id),
    variableId: integer('variableId')
      .notNull()
      .references(() => variables.id),
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
  (t) => [primaryKey({ columns: [t.componentId, t.variableId] })],
);

export type ComponentVariable = typeof componentVariables.$inferSelect;
export type NewComponentVariable = typeof componentVariables.$inferInsert;
