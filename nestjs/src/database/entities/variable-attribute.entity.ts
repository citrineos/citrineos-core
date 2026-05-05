// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { components } from '@entities/component.entity';
import { tenants } from '@entities/tenant.entity';
import { variables } from '@entities/variable.entity';

export const variableAttributes = pgTable(
  TableName.VariableAttributes,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }).default('Actual'),
    dataType: varchar('dataType', { length: 255 }).default('string'),
    value: varchar('value', { length: 4000 }),
    mutability: varchar('mutability', { length: 64 }).default('ReadWrite'),
    persistent: boolean('persistent').default(false),
    constant: boolean('constant').default(false),
    generatedAt: timestamp('generatedAt', { withTimezone: true }),
    variableId: integer('variableId').references(() => variables.id),
    componentId: integer('componentId').references(() => components.id),
    /** Soft FK to `Evses.id` (the legacy column name). */
    evseDatabaseId: integer('evseDatabaseId'),
    bootConfigId: varchar('bootConfigId', { length: 255 }),
    /** Soft FK to `ChargingStations.pkId` per the legacy migration. */
    stationPkId: integer('stationPkId'),
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
  (t) => [index('variable_attributes_station_id_idx').on(t.stationId)],
);

export type VariableAttribute = typeof variableAttributes.$inferSelect;
export type NewVariableAttribute = typeof variableAttributes.$inferInsert;
