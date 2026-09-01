// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
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
function chargingStationSecurityInfoColumns() {
  return {
    id: serial('id').primaryKey(),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    publicKeyFileId: varchar('publicKeyFileId', { length: 255 }),
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
export const chargingStationSecurityInfoTable = pgTable(
  TableName.ChargingStationSecurityInfos,
  chargingStationSecurityInfoColumns(),
  (t) => [
    uniqueIndex('charging_station_security_infos_station_name_tenant_id').on(
      t.ocppConnectionName,
      t.tenantId,
    ),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof chargingStationSecurityInfoTable>();

export function tenantChargingStationSecurityInfoTable(
  tenantId: number,
): typeof chargingStationSecurityInfoTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.ChargingStationSecurityInfos,
      chargingStationSecurityInfoColumns(),
    ) as unknown as typeof chargingStationSecurityInfoTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ChargingStationSecurityInfoEntitySchema = createSelectSchema(
  chargingStationSecurityInfoTable,
);
export const ChargingStationSecurityInfoEntityInsertSchema = createInsertSchema(
  chargingStationSecurityInfoTable,
);

export type ChargingStationSecurityInfoEntity = z.infer<
  typeof ChargingStationSecurityInfoEntitySchema
>;
export type ChargingStationSecurityInfoEntityInsert = z.infer<
  typeof ChargingStationSecurityInfoEntityInsertSchema
>;
