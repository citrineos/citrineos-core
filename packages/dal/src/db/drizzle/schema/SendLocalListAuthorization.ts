// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
import { integer, pgSchema, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
// Pure many-to-many join table: only composite FK columns, no serial id.
function sendLocalListAuthorizationColumns() {
  return {
    sendLocalListId: integer('sendLocalListId'),
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
export const sendLocalListAuthorizationTable = pgTable(
  TableName.SendLocalListAuthorizations,
  sendLocalListAuthorizationColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof sendLocalListAuthorizationTable>();

export function tenantSendLocalListAuthorizationTable(
  tenantId: number,
): typeof sendLocalListAuthorizationTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.SendLocalListAuthorizations,
      sendLocalListAuthorizationColumns(),
    ) as unknown as typeof sendLocalListAuthorizationTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const SendLocalListAuthorizationEntitySchema = createSelectSchema(
  sendLocalListAuthorizationTable,
);
export const SendLocalListAuthorizationEntityInsertSchema = createInsertSchema(
  sendLocalListAuthorizationTable,
);

export type SendLocalListAuthorizationEntity = z.infer<
  typeof SendLocalListAuthorizationEntitySchema
>;
export type SendLocalListAuthorizationEntityInsert = z.infer<
  typeof SendLocalListAuthorizationEntityInsertSchema
>;
