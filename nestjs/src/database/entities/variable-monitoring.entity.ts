// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { components } from '@entities/component.entity';
import { tenants } from '@entities/tenant.entity';
import { variables } from '@entities/variable.entity';

/**
 * Mirrors legacy `VariableMonitorings`. PK is `databaseId` (serial); `id`
 * is the wire-level monitoring id. FKs are direct to Components and
 * Variables rather than going through `VariableAttributes`.
 */
export const variableMonitorings = pgTable(
  TableName.VariableMonitorings,
  {
    databaseId: serial('databaseId').primaryKey(),
    stationId: varchar('stationId', { length: 255 }),
    id: integer('id'),
    transaction: boolean('transaction'),
    value: integer('value'),
    type: varchar('type', { length: 255 }),
    severity: integer('severity'),
    variableId: integer('variableId').references(() => variables.id),
    componentId: integer('componentId').references(() => components.id),
    eventNotificationType: varchar('eventNotificationType', { length: 255 }),
    /** Soft FK to `ChargingStations.pkId` per the legacy migration. */
    stationPkId: integer('stationPkId'),
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
  (t) => [index('variable_monitorings_station_id_idx').on(t.stationId)],
);

export type VariableMonitoring = typeof variableMonitorings.$inferSelect;
export type NewVariableMonitoring = typeof variableMonitorings.$inferInsert;
