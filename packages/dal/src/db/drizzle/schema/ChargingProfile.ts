// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
import {
  boolean,
  integer,
  pgSchema,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function chargingProfileColumns() {
  return {
    // Auto-increment surrogate PK (@PrimaryKey @AutoIncrement on databaseId).
    databaseId: serial('databaseId').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    id: integer('id'),
    chargingProfileKind: varchar('chargingProfileKind', { length: 255 }),
    chargingProfilePurpose: varchar('chargingProfilePurpose', { length: 255 }),
    recurrencyKind: varchar('recurrencyKind', { length: 255 }),
    stackLevel: integer('stackLevel'),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    validFrom: timestamp('validFrom', { withTimezone: true, mode: 'date' }),
    validTo: timestamp('validTo', { withTimezone: true, mode: 'date' }),
    evseId: integer('evseId'),
    isActive: boolean('isActive').default(false),
    chargingLimitSource: varchar('chargingLimitSource', { length: 255 }).default('CSO'),
    transactionDatabaseId: integer('transactionDatabaseId'),
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
export const chargingProfileTable = pgTable(
  TableName.ChargingProfiles,
  chargingProfileColumns(),
  // Sequelize composite unique 'stationName_tenantId_id'.
  (t) => [
    uniqueIndex('charging_profiles_ocpp_connection_name_id_tenant_id').on(
      t.ocppConnectionName,
      t.id,
      t.tenantId,
    ),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof chargingProfileTable>();

export function tenantChargingProfileTable(tenantId: number): typeof chargingProfileTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.ChargingProfiles,
      chargingProfileColumns(),
    ) as unknown as typeof chargingProfileTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ChargingProfileEntitySchema = createSelectSchema(chargingProfileTable);
export const ChargingProfileEntityInsertSchema = createInsertSchema(chargingProfileTable);

export type ChargingProfileEntity = z.infer<typeof ChargingProfileEntitySchema>;
export type ChargingProfileEntityInsert = z.infer<typeof ChargingProfileEntityInsertSchema>;
