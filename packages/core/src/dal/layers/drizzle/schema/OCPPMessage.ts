// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  index,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function ocppMessageColumns() {
  return {
    id: serial('id').primaryKey(),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    correlationId: varchar('correlationId', { length: 255 }),
    origin: varchar('origin', { length: 255 }),
    state: varchar('state', { length: 255 }),
    protocol: varchar('protocol', { length: 255 }),
    action: varchar('action', { length: 255 }),
    message: jsonb('message'),
    requestMessageId: integer('requestMessageId'),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }),
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
export const ocppMessageTable = pgTable(TableName.OCPPMessages, ocppMessageColumns(), (t) => [
  index('ocpp_messages_ocpp_connection_name').on(t.ocppConnectionName),
  index('ocpp_messages_correlation_id').on(t.correlationId),
  index('ocpp_messages_request_message_id').on(t.requestMessageId),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof ocppMessageTable>();

export function tenantOCPPMessageTable(tenantId: number): typeof ocppMessageTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.OCPPMessages,
      ocppMessageColumns(),
    ) as unknown as typeof ocppMessageTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const OCPPMessageEntitySchema = createSelectSchema(ocppMessageTable);
export const OCPPMessageEntityInsertSchema = createInsertSchema(ocppMessageTable);

export type OCPPMessageEntity = z.infer<typeof OCPPMessageEntitySchema>;
export type OCPPMessageEntityInsert = z.infer<typeof OCPPMessageEntityInsertSchema>;
