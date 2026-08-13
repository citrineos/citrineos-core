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
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function ocppMessageColumns() {
  return {
    // Not a standalone primary key: the table is partitioned on "createdAt", so the
    // key must contain the partition column. Declared as a composite below.
    id: serial('id'),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }).notNull(),
    correlationId: varchar('correlationId', { length: 255 }),
    origin: varchar('origin', { length: 255 }),
    // OCPP RPC messageTypeId (2 = Call, 3 = CallResult, 4 = CallError). Absent for messages
    // that could not be parsed far enough to determine it.
    type: integer('type'),
    // Deprecated: superseded by `type`, kept in sync on every write for consumers written against
    // the pre-`type` schema. varchar because MessageState is persisted as its numeric value in text.
    state: varchar('state', { length: 255 }),
    protocol: varchar('protocol', { length: 255 }),
    action: varchar('action', { length: 255 }),
    // Parsed OCPP payload only — the surrounding RPC frame lives in `raw`.
    payload: jsonb('payload'),
    // Exact message as it appeared on the wire. text because messages routinely exceed 255 chars.
    raw: text('raw').notNull(),
    // Deprecated: superseded by `payload` + `raw`, kept in sync on every write for consumers
    // written against the pre-`payload` schema. Holds the whole RPC frame.
    message: jsonb('message'),
    requestMessageId: integer('requestMessageId'),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).notNull(),
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
  // A unique constraint on a partitioned table must contain every partition key
  primaryKey({ columns: [t.id, t.createdAt] }),
  index('ocpp_messages_ocpp_connection_name').on(t.ocppConnectionName),
  index('ocpp_messages_correlation_id').on(t.correlationId),
  index('ocpp_messages_request_message_id').on(t.requestMessageId),
  // Serves the request/response lookups in the correlation insert triggers.
  index('ocpp_messages_correlation_lookup').on(t.tenantId, t.ocppConnectionName, t.correlationId),
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
