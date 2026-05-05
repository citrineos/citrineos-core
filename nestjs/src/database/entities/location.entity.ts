// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Internal Location row — mirrors `core/src/dal/layers/sequelize/model/Location/Location.ts`.
 *
 * Currently a CitrineOS-internal abstraction; future OCPI work will map
 * this 1:1 to an OCPI Location object. Geometry is stored as JSONB
 * `[longitude, latitude]` rather than PostGIS POINT — keeps the schema
 * portable until we wire in OCPI's full coordinates type. PostGIS is
 * available in the test image but not assumed in production.
 */
export const locations = pgTable(TableName.Locations, {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  address: varchar('address', { length: 500 }),
  city: varchar('city', { length: 255 }),
  postalCode: varchar('postalCode', { length: 32 }),
  state: varchar('state', { length: 64 }),
  country: varchar('country', { length: 8 }),
  timeZone: varchar('timeZone', { length: 64 }).default('UTC'),
  publishUpstream: boolean('publishUpstream').default(true),
  parkingType: varchar('parkingType', { length: 64 }),
  facilities: jsonb('facilities'),
  openingHours: jsonb('openingHours'),
  /** `[longitude, latitude]` — OCPI Location coordinates without PostGIS dependency. */
  coordinates: jsonb('coordinates'),
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

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
