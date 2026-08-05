// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import { integer, pgSchema, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
// Pure many-to-many join table: only composite FK columns, no serial id.
function localListVersionAuthorizationColumns() {
  return {
    localListVersionId: integer('localListVersionId'),
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
export const localListVersionAuthorizationTable = pgTable(
  TableName.LocalListVersionAuthorizations,
  localListVersionAuthorizationColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof localListVersionAuthorizationTable>();

export function tenantLocalListVersionAuthorizationTable(
  tenantId: number,
): typeof localListVersionAuthorizationTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.LocalListVersionAuthorizations,
      localListVersionAuthorizationColumns(),
    ) as unknown as typeof localListVersionAuthorizationTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const LocalListVersionAuthorizationEntitySchema = createSelectSchema(
  localListVersionAuthorizationTable,
);
export const LocalListVersionAuthorizationEntityInsertSchema = createInsertSchema(
  localListVersionAuthorizationTable,
);

export type LocalListVersionAuthorizationEntity = z.infer<
  typeof LocalListVersionAuthorizationEntitySchema
>;
export type LocalListVersionAuthorizationEntityInsert = z.infer<
  typeof LocalListVersionAuthorizationEntityInsertSchema
>;
