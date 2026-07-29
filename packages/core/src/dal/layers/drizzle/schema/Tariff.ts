// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  integer,
  jsonb,
  numeric,
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
function tariffColumns() {
  return {
    id: serial('id').primaryKey(),
    // CHAR(3) currency code stored as a fixed-length string.
    currency: varchar('currency', { length: 3 }).notNull(),
    // DECIMAL columns — drizzle numeric returns strings; coerced to number in the repository layer.
    pricePerKwh: numeric('pricePerKwh').notNull(),
    pricePerMin: numeric('pricePerMin'),
    pricePerSession: numeric('pricePerSession'),
    authorizationAmount: numeric('authorizationAmount'),
    paymentFee: numeric('paymentFee'),
    taxRate: numeric('taxRate'),
    tariffAltText: jsonb('tariffAltText').$type<object[]>(),
    tariffId: varchar('tariffId', { length: 255 }),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    validFrom: timestamp('validFrom', { withTimezone: true, mode: 'date' }),
    description: jsonb('description'),
    energy: jsonb('energy'),
    chargingTime: jsonb('chargingTime'),
    idleTime: jsonb('idleTime'),
    fixedFee: jsonb('fixedFee'),
    reservationTime: jsonb('reservationTime'),
    reservationFixed: jsonb('reservationFixed'),
    minCost: jsonb('minCost'),
    maxCost: jsonb('maxCost'),
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
export const tariffTable = pgTable(TableName.Tariffs, tariffColumns(), (t) => [
  uniqueIndex('tariffs_tariff_id_tenant_id').on(t.tariffId, t.tenantId),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof tariffTable>();

export function tenantTariffTable(tenantId: number): typeof tariffTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Tariffs,
      tariffColumns(),
    ) as unknown as typeof tariffTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const TariffEntitySchema = createSelectSchema(tariffTable);
export const TariffEntityInsertSchema = createInsertSchema(tariffTable);

export type TariffEntity = z.infer<typeof TariffEntitySchema>;
export type TariffEntityInsert = z.infer<typeof TariffEntityInsertSchema>;
