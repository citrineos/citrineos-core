// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

export const localAuthListVersions = pgTable(
  TableName.LocalAuthListVersions,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }),
    versionNumber: integer('versionNumber'),
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
  (t) => [uniqueIndex('local_auth_list_versions_station_tenant').on(t.stationId, t.tenantId)],
);

export type LocalAuthListVersion = typeof localAuthListVersions.$inferSelect;
export type NewLocalAuthListVersion = typeof localAuthListVersions.$inferInsert;
