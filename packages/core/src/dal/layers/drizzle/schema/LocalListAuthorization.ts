// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import { integer, jsonb, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function localListAuthorizationColumns() {
  return {
    // Implicit auto-increment PK (sequelize model has no @PrimaryKey).
    id: serial('id').primaryKey(),
    // Sequelize ARRAY(STRING) → varchar(255)[]
    allowedConnectorTypes: varchar('allowedConnectorTypes', { length: 255 }).array(),
    disallowedEvseIdPrefixes: varchar('disallowedEvseIdPrefixes', { length: 255 }).array(),
    idToken: varchar('idToken', { length: 255 }),
    idTokenType: varchar('idTokenType', { length: 255 }),
    additionalInfo: jsonb('additionalInfo'),
    status: varchar('status', { length: 255 }),
    // DataType.DATE → timestamptz; mapped to ISO string in the repository layer
    cacheExpiryDateTime: timestamp('cacheExpiryDateTime', { withTimezone: true, mode: 'date' }),
    chargingPriority: integer('chargingPriority'),
    language1: varchar('language1', { length: 255 }),
    language2: varchar('language2', { length: 255 }),
    personalMessage: jsonb('personalMessage'),
    groupAuthorizationId: integer('groupAuthorizationId'),
    // FK to the "actual" Authorization (DataType.INTEGER in the sequelize model).
    authorizationId: integer('authorizationId'),
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
export const localListAuthorizationTable = pgTable(
  TableName.LocalListAuthorizations,
  localListAuthorizationColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof localListAuthorizationTable>();

export function tenantLocalListAuthorizationTable(
  tenantId: number,
): typeof localListAuthorizationTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.LocalListAuthorizations,
      localListAuthorizationColumns(),
    ) as unknown as typeof localListAuthorizationTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const LocalListAuthorizationEntitySchema = createSelectSchema(localListAuthorizationTable);
export const LocalListAuthorizationEntityInsertSchema = createInsertSchema(
  localListAuthorizationTable,
);

export type LocalListAuthorizationEntity = z.infer<typeof LocalListAuthorizationEntitySchema>;
export type LocalListAuthorizationEntityInsert = z.infer<
  typeof LocalListAuthorizationEntityInsertSchema
>;
