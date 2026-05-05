// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * CSMS-side WebSocket server profile config. Each row describes a
 * listener (NoSecurity, BasicAuth, MutualTLS) that the CSMS exposes
 * for chargers. Mirrors legacy `ServerNetworkProfile`.
 *
 * `id` is the human-readable profile slug (e.g. `'sp0'`, `'sp1'`,
 * `'sp3'`) — used as the primary key the way legacy does.
 */
export const serverNetworkProfiles = pgTable(TableName.ServerNetworkProfiles, {
  id: varchar('id', { length: 64 }).primaryKey(),
  host: varchar('host', { length: 255 }).notNull(),
  port: integer('port').notNull(),
  pingInterval: integer('pingInterval').notNull().default(0),
  protocols: text('protocols').array().notNull(),
  messageTimeout: integer('messageTimeout').notNull().default(30),
  securityProfile: integer('securityProfile').notNull().default(0),
  allowUnknownChargingStations: boolean('allowUnknownChargingStations').notNull().default(false),
  dynamicTenantResolution: boolean('dynamicTenantResolution').notNull().default(false),
  tenantPathMapping: jsonb('tenantPathMapping'),
  tlsKeyFilePath: varchar('tlsKeyFilePath', { length: 1024 }),
  tlsCertificateChainFilePath: varchar('tlsCertificateChainFilePath', { length: 1024 }),
  mtlsCertificateAuthorityKeyFilePath: varchar('mtlsCertificateAuthorityKeyFilePath', {
    length: 1024,
  }),
  rootCACertificateFilePath: varchar('rootCACertificateFilePath', { length: 1024 }),
  tenantId: integer('tenantId')
    .notNull()
    .references(() => tenants.id),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type ServerNetworkProfile = typeof serverNetworkProfiles.$inferSelect;
export type NewServerNetworkProfile = typeof serverNetworkProfiles.$inferInsert;
