// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { MessageContent } from '@citrineos/types';
import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  boolean,
  index,
  integer,
  jsonb,
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
function messageInfoColumns() {
  return {
    databaseId: serial('databaseId').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    id: integer('id'),
    priority: varchar('priority', { length: 255 }),
    state: varchar('state', { length: 255 }),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    startDateTime: timestamp('startDateTime', { withTimezone: true, mode: 'date' }),
    endDateTime: timestamp('endDateTime', { withTimezone: true, mode: 'date' }),
    transactionId: varchar('transactionId', { length: 255 }),
    message: jsonb('message').$type<MessageContent>(),
    active: boolean('active'),
    displayComponentId: integer('displayComponentId'),
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
export const messageInfoTable = pgTable(TableName.MessageInfos, messageInfoColumns(), (t) => [
  index('message_infos_ocpp_connection_name').on(t.ocppConnectionName),
  uniqueIndex('message_infos_station_name_tenant_id_id').on(t.ocppConnectionName, t.id, t.tenantId),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof messageInfoTable>();

export function tenantMessageInfoTable(tenantId: number): typeof messageInfoTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.MessageInfos,
      messageInfoColumns(),
    ) as unknown as typeof messageInfoTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const MessageInfoEntitySchema = createSelectSchema(messageInfoTable);
export const MessageInfoEntityInsertSchema = createInsertSchema(messageInfoTable);

export type MessageInfoEntity = z.infer<typeof MessageInfoEntitySchema>;
export type MessageInfoEntityInsert = z.infer<typeof MessageInfoEntityInsertSchema>;
