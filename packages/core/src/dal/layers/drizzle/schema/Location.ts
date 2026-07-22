// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { LocationFacilityEnumType, LocationHours } from '@citrineos/base';
import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  boolean,
  geometry,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function locationColumns() {
  return {
    // Implicit auto-increment PK (the sequelize model declares no @PrimaryKey).
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }),
    address: varchar('address', { length: 255 }),
    city: varchar('city', { length: 255 }),
    postalCode: varchar('postalCode', { length: 255 }),
    state: varchar('state', { length: 255 }),
    country: varchar('country', { length: 255 }),
    publishUpstream: boolean('publishUpstream').default(true),
    timeZone: varchar('timeZone', { length: 255 }).default('UTC'),
    parkingType: varchar('parkingType', { length: 255 }),
    facilities: jsonb('facilities').$type<LocationFacilityEnumType[]>(),
    openingHours: jsonb('openingHours').$type<LocationHours>(),
    // Sequelize GEOMETRY('POINT') → PostGIS point; [longitude, latitude]
    coordinates: geometry('coordinates', { type: 'point' }).notNull(),
    tenantId: integer('tenantId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  };
}

// Row-level tenancy (current approach): single public schema, tenantId column filter on every query
export const locationTable = pgTable(TableName.Locations, locationColumns());

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof locationTable>();

export function tenantLocationTable(tenantId: number): typeof locationTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Locations,
      locationColumns(),
    ) as unknown as typeof locationTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const LocationEntitySchema = createSelectSchema(locationTable);
export const LocationEntityInsertSchema = createInsertSchema(locationTable);

export type LocationEntity = z.infer<typeof LocationEntitySchema>;
export type LocationEntityInsert = z.infer<typeof LocationEntityInsertSchema>;
