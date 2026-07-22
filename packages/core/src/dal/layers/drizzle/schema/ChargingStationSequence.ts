// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  bigint,
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
function chargingStationSequenceColumns() {
  return {
    id: serial('id').primaryKey(),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 36 }).notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    value: bigint('value', { mode: 'number' }).notNull().default(0),
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
export const chargingStationSequenceTable = pgTable(
  TableName.ChargingStationSequences,
  chargingStationSequenceColumns(),
  (t) => [
    uniqueIndex('charging_station_sequences_station_id_type').on(t.stationId, t.type),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof chargingStationSequenceTable>();

export function tenantChargingStationSequenceTable(
  tenantId: number,
): typeof chargingStationSequenceTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.ChargingStationSequences,
      chargingStationSequenceColumns(),
    ) as unknown as typeof chargingStationSequenceTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ChargingStationSequenceEntitySchema = createSelectSchema(
  chargingStationSequenceTable,
);
export const ChargingStationSequenceEntityInsertSchema = createInsertSchema(
  chargingStationSequenceTable,
);

export type ChargingStationSequenceEntity = z.infer<
  typeof ChargingStationSequenceEntitySchema
>;
export type ChargingStationSequenceEntityInsert = z.infer<
  typeof ChargingStationSequenceEntityInsertSchema
>;
