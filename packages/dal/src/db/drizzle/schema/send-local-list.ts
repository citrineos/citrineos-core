// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import { integer, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function sendLocalListColumns() {
  return {
    // Implicit auto-increment PK (sequelize model has no @PrimaryKey).
    id: serial('id').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    correlationId: varchar('correlationId', { length: 255 }),
    versionNumber: integer('versionNumber'),
    updateType: varchar('updateType', { length: 255 }),
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
export const sendLocalListTable = pgTable(TableName.SendLocalLists, sendLocalListColumns());

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof sendLocalListTable>();

export function tenantSendLocalListTable(tenantId: number): typeof sendLocalListTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.SendLocalLists,
      sendLocalListColumns(),
    ) as unknown as typeof sendLocalListTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const SendLocalListEntitySchema = createSelectSchema(sendLocalListTable);
export const SendLocalListEntityInsertSchema = createInsertSchema(sendLocalListTable);

export type SendLocalListEntity = z.infer<typeof SendLocalListEntitySchema>;
export type SendLocalListEntityInsert = z.infer<typeof SendLocalListEntityInsertSchema>;
