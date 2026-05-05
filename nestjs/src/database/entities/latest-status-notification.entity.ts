// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * One row per (stationId) carrying a soft FK to the most recent
 * `StatusNotifications` row for that station — used by REST consumers
 * and dashboards that don't want to scan the full history.
 *
 * Mirrors legacy `core/src/dal/layers/sequelize/model/Location/LatestStatusNotification.ts`.
 * The actual status payload (connectorStatus, timestamp, etc.) lives on
 * the joined `StatusNotifications` row referenced by `statusNotificationId`.
 */
export const latestStatusNotifications = pgTable(TableName.LatestStatusNotifications, {
  id: serial('id').primaryKey(),
  stationId: varchar('stationId', { length: 36 }),
  /** Soft FK to `StatusNotifications.id`. */
  statusNotificationId: integer('statusNotificationId'),
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
});

export type LatestStatusNotification = typeof latestStatusNotifications.$inferSelect;
export type NewLatestStatusNotification = typeof latestStatusNotifications.$inferInsert;
