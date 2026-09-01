// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
import {
  index,
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
function setNetworkProfileColumns() {
  return {
    // Implicit auto-increment PK (the sequelize model declares no @PrimaryKey).
    id: serial('id').primaryKey(),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    correlationId: varchar('correlationId', { length: 255 }),
    websocketServerConfigId: varchar('websocketServerConfigId', { length: 255 }),
    configurationSlot: integer('configurationSlot'),
    ocppVersion: varchar('ocppVersion', { length: 255 }),
    ocppTransport: varchar('ocppTransport', { length: 255 }),
    ocppCsmsUrl: varchar('ocppCsmsUrl', { length: 255 }),
    messageTimeout: integer('messageTimeout'),
    securityProfile: integer('securityProfile'),
    ocppInterface: varchar('ocppInterface', { length: 255 }),
    // Stringified JSON of OCPP2_0_1.APNType for display purposes only
    apn: varchar('apn', { length: 255 }),
    // Stringified JSON of OCPP2_0_1.VPNType for display purposes only
    vpn: varchar('vpn', { length: 255 }),
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
export const setNetworkProfileTable = pgTable(
  TableName.SetNetworkProfiles,
  setNetworkProfileColumns(),
  (t) => [
    index('set_network_profiles_correlation_id').on(t.correlationId),
    uniqueIndex('set_network_profiles_station_id_correlation_id').on(t.stationId, t.correlationId),
  ],
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof setNetworkProfileTable>();

export function tenantSetNetworkProfileTable(tenantId: number): typeof setNetworkProfileTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.SetNetworkProfiles,
      setNetworkProfileColumns(),
    ) as unknown as typeof setNetworkProfileTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const SetNetworkProfileEntitySchema = createSelectSchema(setNetworkProfileTable);
export const SetNetworkProfileEntityInsertSchema = createInsertSchema(setNetworkProfileTable);

export type SetNetworkProfileEntity = z.infer<typeof SetNetworkProfileEntitySchema>;
export type SetNetworkProfileEntityInsert = z.infer<typeof SetNetworkProfileEntityInsertSchema>;
