// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';

export const tenants = pgTable(TableName.Tenants, {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  partyId: varchar('partyId', { length: 255 }),
  countryCode: varchar('countryCode', { length: 255 }),
  url: varchar('url', { length: 255 }),
  serverProfileOCPI: jsonb('serverProfileOCPI'),
  isUserTenant: boolean('isUserTenant').notNull().default(false),
  maxChargingStations: integer('maxChargingStations'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
