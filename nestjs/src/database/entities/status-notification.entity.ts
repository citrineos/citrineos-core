// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

export const statusNotifications = pgTable(
  TableName.StatusNotifications,
  {
    id: serial('id').primaryKey(),
    timestamp: timestamp('timestamp', { withTimezone: true }),
    connectorStatus: varchar('connectorStatus', { length: 255 }),
    evseId: integer('evseId'),
    connectorId: integer('connectorId'),
    /** OCPP 1.6 carries these on StatusNotification; 2.0.1 has them in
     *  StatusInfo. Legacy stores them as flat columns either way. */
    errorCode: varchar('errorCode', { length: 255 }),
    info: varchar('info', { length: 255 }),
    vendorId: varchar('vendorId', { length: 255 }),
    vendorErrorCode: varchar('vendorErrorCode', { length: 255 }),
    stationId: varchar('stationId', { length: 36 }),
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
  (t) => [index('status_notifications_station_id_idx').on(t.stationId)],
);

export type StatusNotificationRow = typeof statusNotifications.$inferSelect;
export type NewStatusNotificationRow = typeof statusNotifications.$inferInsert;
