// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ACChargingParametersType, DCChargingParametersType } from '@citrineos/types';
import { TableName } from '@dal/models/table-name.js';
import {
  integer,
  jsonb,
  primaryKey,
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
function chargingNeedsColumns() {
  return {
    // Implicit auto-increment PK (model declares no @PrimaryKey).
    id: serial('id'),
    acChargingParameters: jsonb('acChargingParameters').$type<ACChargingParametersType>(),
    dcChargingParameters: jsonb('dcChargingParameters').$type<DCChargingParametersType>(),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    departureTime: timestamp('departureTime', { withTimezone: true, mode: 'date' }),
    requestedEnergyTransfer: varchar('requestedEnergyTransfer', { length: 255 }),
    maxScheduleTuples: integer('maxScheduleTuples'),
    evseId: integer('evseId'),
    transactionDatabaseId: integer('transactionDatabaseId'),
    transactionCreatedAt: timestamp('transactionCreatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
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
export const chargingNeedsTable = pgTable(TableName.ChargingNeeds, chargingNeedsColumns(), (t) => [
  primaryKey({ columns: [t.id, t.transactionCreatedAt] }),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof chargingNeedsTable>();

export function tenantChargingNeedsTable(tenantId: number): typeof chargingNeedsTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.ChargingNeeds,
      chargingNeedsColumns(),
    ) as unknown as typeof chargingNeedsTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ChargingNeedsEntitySchema = createSelectSchema(chargingNeedsTable);
export const ChargingNeedsEntityInsertSchema = createInsertSchema(chargingNeedsTable);

export type ChargingNeedsEntity = z.infer<typeof ChargingNeedsEntitySchema>;
export type ChargingNeedsEntityInsert = z.infer<typeof ChargingNeedsEntityInsertSchema>;
