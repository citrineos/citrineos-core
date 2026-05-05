// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { components } from '@entities/component.entity';
import { tenants } from '@entities/tenant.entity';
import { variables } from '@entities/variable.entity';

export const eventData = pgTable(
  TableName.EventData,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }),
    eventId: integer('eventId'),
    trigger: varchar('trigger', { length: 255 }),
    cause: integer('cause'),
    timestamp: timestamp('timestamp', { withTimezone: true }),
    actualValue: varchar('actualValue', { length: 255 }),
    techCode: varchar('techCode', { length: 255 }),
    techInfo: varchar('techInfo', { length: 255 }),
    cleared: boolean('cleared'),
    transactionId: varchar('transactionId', { length: 255 }),
    variableMonitoringId: integer('variableMonitoringId'),
    eventNotificationType: varchar('eventNotificationType', { length: 255 }),
    variableId: integer('variableId').references(() => variables.id),
    componentId: integer('componentId').references(() => components.id),
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
  (t) => [index('event_data_station_id_idx').on(t.stationId)],
);

export type EventData = typeof eventData.$inferSelect;
export type NewEventData = typeof eventData.$inferInsert;
