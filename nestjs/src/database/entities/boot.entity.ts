// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, integer, json, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Mirrors the legacy `Boots` table. Important shape note: the primary key
 * IS the stationId (legacy uses `id` as a varchar that names the station)
 * — there is no separate stationId column.
 *
 * `status` carries `RegistrationStatusEnumType` (2.0.1 / 2.1) or
 * `BootNotificationStatusEnum16` values — both protocols share the same
 * string set with one extra (Pending in 2.x).
 *
 * `variablesRejectedOnLastBoot` and `statusInfo` are `json` (not jsonb)
 * to match legacy column types.
 */
export const boots = pgTable(TableName.Boots, {
  id: varchar('id', { length: 255 }).primaryKey(),
  lastBootTime: timestamp('lastBootTime', { withTimezone: true }),
  heartbeatInterval: integer('heartbeatInterval'),
  bootRetryInterval: integer('bootRetryInterval'),
  status: varchar('status', { length: 255 }),
  statusInfo: json('statusInfo'),
  getBaseReportOnPending: boolean('getBaseReportOnPending'),
  variablesRejectedOnLastBoot: json('variablesRejectedOnLastBoot'),
  bootWithRejectedVariables: boolean('bootWithRejectedVariables'),
  changeConfigurationsOnPending: boolean('changeConfigurationsOnPending'),
  getConfigurationsOnPending: boolean('getConfigurationsOnPending'),
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

export type Boot = typeof boots.$inferSelect;
export type NewBoot = typeof boots.$inferInsert;
