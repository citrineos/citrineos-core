// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

export const securityEvents = pgTable(
  TableName.SecurityEvents,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    techInfo: varchar('techInfo', { length: 255 }),
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
  (t) => [index('security_events_station_id_idx').on(t.stationId)],
);

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;
