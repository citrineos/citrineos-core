// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Pending CSMS-initiated `SendLocalList` request envelope. The
 * `LocalAuthorizationList` items live in
 * `SendLocalListAuthorizations` (junction). On accepted response, the
 * version is promoted to the live `LocalAuthListVersions` row for the
 * station. Mirrors legacy `SendLocalList` Sequelize model.
 */
export const sendLocalLists = pgTable(TableName.SendLocalLists, {
  id: serial('id').primaryKey(),
  stationId: varchar('stationId', { length: 255 }).notNull(),
  correlationId: varchar('correlationId', { length: 255 }).notNull(),
  versionNumber: integer('versionNumber').notNull(),
  updateType: varchar('updateType', { length: 16 }).notNull(),
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

export type SendLocalList = typeof sendLocalLists.$inferSelect;
export type NewSendLocalList = typeof sendLocalLists.$inferInsert;
