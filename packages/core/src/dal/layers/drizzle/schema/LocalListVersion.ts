// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
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
function localListVersionColumns() {
  return {
    // Implicit auto-increment PK (sequelize model has no @PrimaryKey).
    id: serial('id').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    versionNumber: integer('versionNumber'),
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
export const localListVersionTable = pgTable(
  TableName.LocalListVersions,
  localListVersionColumns(),
  (t) => [
    // Sequelize unique: 'stationName_tenantId' spans ocppConnectionName and tenantId.
    uniqueIndex('local_list_versions_station_name_tenant_id').on(t.ocppConnectionName, t.tenantId),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof localListVersionTable>();

export function tenantLocalListVersionTable(tenantId: number): typeof localListVersionTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.LocalListVersions,
      localListVersionColumns(),
    ) as unknown as typeof localListVersionTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const LocalListVersionEntitySchema = createSelectSchema(localListVersionTable);
export const LocalListVersionEntityInsertSchema = createInsertSchema(localListVersionTable);

export type LocalListVersionEntity = z.infer<typeof LocalListVersionEntitySchema>;
export type LocalListVersionEntityInsert = z.infer<typeof LocalListVersionEntityInsertSchema>;
