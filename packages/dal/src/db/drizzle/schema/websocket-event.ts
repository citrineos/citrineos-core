// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import type { MessageOrigin, WebsocketEventType } from '@citrineos/types';
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Range partitioned weekly on "createdAt", so the primary key must include the partition key.
export const websocketEventTable = pgTable(
  TableName.WebsocketEvents,
  {
    id: serial('id'),
    stationId: integer('stationId'),
    serverId: varchar('serverId', { length: 255 }).notNull(),
    host: varchar('host', { length: 255 }).notNull(),
    remoteAddress: text('remoteAddress'),
    uri: text('uri'),
    type: varchar('type', { length: 255 }).$type<WebsocketEventType>().notNull(),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).notNull(),
    subprotocol: varchar('subprotocol', { length: 255 }),
    httpStatus: integer('httpStatus'),
    wsCloseCode: integer('wsCloseCode'),
    sentCode: integer('sentCode'),
    closeReason: text('closeReason'),
    initiator: varchar('initiator', { length: 255 }).$type<MessageOrigin>(),
    source: varchar('source', { length: 255 }),
    details: jsonb('details').$type<Record<string, unknown>>(),
    tenantId: integer('tenantId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.id, t.createdAt] }),
    index('websocket_events_station_id_timestamp').on(t.stationId, t.timestamp),
    index('websocket_events_type_timestamp').on(t.type, t.timestamp),
  ],
);

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const WebsocketEventEntitySchema = createSelectSchema(websocketEventTable);
export const WebsocketEventEntityInsertSchema = createInsertSchema(websocketEventTable);

// Inferred from the table rather than the Zod schema: createSelectSchema drops the $type<>
// narrowing on varchar columns, which `type` and `initiator` depend on.
export type WebsocketEventEntity = typeof websocketEventTable.$inferSelect;
export type WebsocketEventEntityInsert = z.infer<typeof WebsocketEventEntityInsertSchema>;
