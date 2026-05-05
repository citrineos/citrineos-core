// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { components } from '@entities/component.entity';
import { tenants } from '@entities/tenant.entity';

/**
 * Mirrors legacy `MessageInfos`. `databaseId` is the local PK
 * (serial); `id` is the wire-level message id. The `message` column
 * carries the full `MessageContentType` jsonb (`format`, `content`,
 * `language`) — legacy stores the wire shape directly rather than
 * splitting into separate columns.
 */
export const messageInfos = pgTable(
  TableName.MessageInfos,
  {
    databaseId: serial('databaseId').primaryKey(),
    stationId: varchar('stationId', { length: 255 }),
    id: integer('id'),
    priority: varchar('priority', { length: 255 }),
    state: varchar('state', { length: 255 }),
    startDateTime: timestamp('startDateTime', { withTimezone: true }),
    endDateTime: timestamp('endDateTime', { withTimezone: true }),
    transactionId: varchar('transactionId', { length: 255 }),
    /** OCPP `MessageContentType` jsonb (format / content / language). */
    message: json('message'),
    active: boolean('active'),
    /**
     * Optional FK to `Components`. Wire field
     * `MessageInfoType.display: ComponentType` resolves through
     * `findOrCreateEvseAndComponent` to a Component row; storing the
     * FK preserves which (evse, component) the message renders on.
     */
    displayComponentId: integer('displayComponentId').references(() => components.id),
    tenantId: integer('tenantId')
      .notNull()
      .default(sql`1`)
      .references(() => tenants.id),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index('message_infos_station_id_idx').on(t.stationId)],
);

export type MessageInfo = typeof messageInfos.$inferSelect;
export type NewMessageInfo = typeof messageInfos.$inferInsert;
