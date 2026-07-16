// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ServerProfile } from '@citrineos/base';
import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import { boolean, integer, jsonb, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Tenant is the tenancy root: unlike every other table it has NO tenantId column
// (its own `id` IS the tenant id), so it does not use the DrizzleRepository base.
function tenantColumns() {
  return {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    url: varchar('url', { length: 255 }),
    partyId: varchar('partyId', { length: 255 }),
    countryCode: varchar('countryCode', { length: 255 }),
    serverProfileOCPI: jsonb('serverProfileOCPI').$type<ServerProfile>(),
    isUserTenant: boolean('isUserTenant').notNull().default(false),
    maxChargingStations: integer('maxChargingStations'),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  };
}

export const tenantTable = pgTable(TableName.Tenants, tenantColumns());

// Schema-per-tenant reference (kept for symmetry with the other schemas).
const tenantTableCache = new Map<number, typeof tenantTable>();

export function tenantTenantTable(tenantId: number): typeof tenantTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Tenants,
      tenantColumns(),
    ) as unknown as typeof tenantTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const TenantEntitySchema = createSelectSchema(tenantTable);
export const TenantEntityInsertSchema = createInsertSchema(tenantTable);

export type TenantEntity = z.infer<typeof TenantEntitySchema>;
export type TenantEntityInsert = z.infer<typeof TenantEntityInsertSchema>;
