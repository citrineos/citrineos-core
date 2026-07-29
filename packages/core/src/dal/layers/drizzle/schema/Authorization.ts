// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AdditionalInfo, RealTimeAuthLastAttempt } from '@citrineos/base';
import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  boolean,
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
function authorizationColumns() {
  return {
    // Implicit auto-increment PK (sequelize model has no @PrimaryKey).
    id: serial('id').primaryKey(),
    // Sequelize ARRAY(STRING) → varchar(255)[]
    allowedConnectorTypes: varchar('allowedConnectorTypes', { length: 255 }).array(),
    disallowedEvseIdPrefixes: varchar('disallowedEvseIdPrefixes', { length: 255 }).array(),
    // Sequelize CITEXT (case-insensitive text) stored as varchar here.
    idToken: varchar('idToken', { length: 255 }),
    idTokenType: varchar('idTokenType', { length: 255 }),
    additionalInfo: jsonb('additionalInfo').$type<[AdditionalInfo, ...AdditionalInfo[]]>(),
    status: varchar('status', { length: 255 }),
    // DataType.DATE → timestamptz; mapped to ISO string in the repository layer
    cacheExpiryDateTime: timestamp('cacheExpiryDateTime', { withTimezone: true, mode: 'date' }),
    chargingPriority: integer('chargingPriority'),
    language1: varchar('language1', { length: 255 }),
    language2: varchar('language2', { length: 255 }),
    personalMessage: jsonb('personalMessage'),
    realTimeAuth: varchar('realTimeAuth', { length: 255 }),
    realTimeAuthLastAttempt: jsonb('realTimeAuthLastAttempt').$type<RealTimeAuthLastAttempt>(),
    realTimeAuthTimeout: integer('realTimeAuthTimeout'),
    realTimeAuthUrl: varchar('realTimeAuthUrl', { length: 255 }),
    // Self-referential FK for group authorization.
    groupAuthorizationId: integer('groupAuthorizationId'),
    tariffId: integer('tariffId'),
    concurrentTransaction: boolean('concurrentTransaction').default(false),
    isPrepaid: boolean('isPrepaid').default(false),
    // Sequelize DECIMAL → numeric (returned as string, converted in the repository layer)
    prepaidBalance: numeric('prepaidBalance'),
    tenantPartnerId: integer('tenantPartnerId'),
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
export const authorizationTable = pgTable(TableName.Authorizations, authorizationColumns(), (t) => [
  // Sequelize unique: 'idToken_type' spans idToken, idTokenType and tenantId.
  uniqueIndex('authorizations_id_token_type').on(t.idToken, t.idTokenType, t.tenantId),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof authorizationTable>();

export function tenantAuthorizationTable(tenantId: number): typeof authorizationTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Authorizations,
      authorizationColumns(),
    ) as unknown as typeof authorizationTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const AuthorizationEntitySchema = createSelectSchema(authorizationTable);
export const AuthorizationEntityInsertSchema = createInsertSchema(authorizationTable);

export type AuthorizationEntity = z.infer<typeof AuthorizationEntitySchema>;
export type AuthorizationEntityInsert = z.infer<typeof AuthorizationEntityInsertSchema>;
