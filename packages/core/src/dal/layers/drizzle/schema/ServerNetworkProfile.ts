// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  boolean,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function serverNetworkProfileColumns() {
  return {
    // String primary key (the websocket server id), not a serial.
    id: varchar('id', { length: 255 }).primaryKey(),
    host: varchar('host', { length: 255 }).notNull(),
    port: integer('port').notNull(),
    pingInterval: integer('pingInterval').notNull(),
    // Sequelize ARRAY(STRING) → varchar(255)[]
    protocols: varchar('protocols', { length: 255 }).array().notNull(),
    messageTimeout: integer('messageTimeout').notNull(),
    securityProfile: integer('securityProfile').notNull(),
    allowUnknownChargingStations: boolean('allowUnknownChargingStations').notNull(),
    dynamicTenantResolution: boolean('dynamicTenantResolution').notNull().default(false),
    tenantPathMapping: jsonb('tenantPathMapping').$type<Record<string, number>>(),
    tlsKeyFilePath: varchar('tlsKeyFilePath', { length: 255 }),
    tlsCertificateChainFilePath: varchar('tlsCertificateChainFilePath', { length: 255 }),
    mtlsCertificateAuthorityKeyFilePath: varchar('mtlsCertificateAuthorityKeyFilePath', {
      length: 255,
    }),
    rootCACertificateFilePath: varchar('rootCACertificateFilePath', { length: 255 }),
    tenantId: integer('tenantId'),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  };
}

// Row-level tenancy (current approach): single public schema
export const serverNetworkProfileTable = pgTable(
  TableName.ServerNetworkProfiles,
  serverNetworkProfileColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant
const tenantTableCache = new Map<number, typeof serverNetworkProfileTable>();

export function tenantServerNetworkProfileTable(
  tenantId: number,
): typeof serverNetworkProfileTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.ServerNetworkProfiles,
      serverNetworkProfileColumns(),
    ) as unknown as typeof serverNetworkProfileTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ServerNetworkProfileEntitySchema = createSelectSchema(serverNetworkProfileTable);
export const ServerNetworkProfileEntityInsertSchema =
  createInsertSchema(serverNetworkProfileTable);

export type ServerNetworkProfileEntity = z.infer<typeof ServerNetworkProfileEntitySchema>;
export type ServerNetworkProfileEntityInsert = z.infer<
  typeof ServerNetworkProfileEntityInsertSchema
>;
