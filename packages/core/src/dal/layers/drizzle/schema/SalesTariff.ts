// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SalesTariffEntry } from '@citrineos/base';
import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  integer,
  jsonb,
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
function salesTariffColumns() {
  return {
    // Auto-increment surrogate PK (@PrimaryKey @AutoIncrement on databaseId).
    databaseId: serial('databaseId').primaryKey(),
    id: integer('id'),
    numEPriceLevels: integer('numEPriceLevels'),
    salesTariffDescription: varchar('salesTariffDescription', { length: 255 }),
    salesTariffEntry: jsonb('salesTariffEntry').$type<[SalesTariffEntry, ...SalesTariffEntry[]]>(),
    chargingScheduleDatabaseId: integer('chargingScheduleDatabaseId'),
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
export const salesTariffTable = pgTable(
  TableName.SalesTariffs,
  salesTariffColumns(),
  // Sequelize composite unique 'id_chargingScheduleDatabaseId'.
  (t) => [
    uniqueIndex('sales_tariffs_id_charging_schedule_database_id').on(
      t.id,
      t.chargingScheduleDatabaseId,
    ),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof salesTariffTable>();

export function tenantSalesTariffTable(tenantId: number): typeof salesTariffTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.SalesTariffs,
      salesTariffColumns(),
    ) as unknown as typeof salesTariffTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const SalesTariffEntitySchema = createSelectSchema(salesTariffTable);
export const SalesTariffEntityInsertSchema = createInsertSchema(salesTariffTable);

export type SalesTariffEntity = z.infer<typeof SalesTariffEntitySchema>;
export type SalesTariffEntityInsert = z.infer<typeof SalesTariffEntityInsertSchema>;
