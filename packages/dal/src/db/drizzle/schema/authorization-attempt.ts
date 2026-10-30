// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AuthorizationAttemptReason, AuthorizationStatusEnumType } from '@citrineos/types';
import { TableName } from '@dal/models/table-name.js';
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Range partitioned weekly on "createdAt", so the primary key must include the partition key.
export const authorizationAttemptTable = pgTable(
  TableName.AuthorizationAttempts,
  {
    id: serial('id'),
    stationId: integer('stationId'),
    ocppVersion: varchar('ocppVersion', { length: 255 }).notNull(),
    action: varchar('action', { length: 255 }).notNull(),
    correlationId: varchar('correlationId', { length: 255 }).notNull(),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).notNull(),
    idToken: varchar('idToken', { length: 255 }).notNull(),
    idTokenType: varchar('idTokenType', { length: 255 }),
    authorizationId: integer('authorizationId'),
    storedStatus: varchar('storedStatus', { length: 255 }).$type<AuthorizationStatusEnumType>(),
    responseStatus: varchar('responseStatus', { length: 255 }),
    reason: varchar('reason', { length: 255 }).$type<AuthorizationAttemptReason>().notNull(),
    details: jsonb('details').$type<Record<string, unknown>>(),
    evseId: integer('evseId'),
    connectorId: integer('connectorId'),
    transactionDatabaseId: integer('transactionDatabaseId'),
    transactionCreatedAt: timestamp('transactionCreatedAt', { withTimezone: true, mode: 'date' }),
    transactionId: varchar('transactionId', { length: 255 }),
    remoteStartId: integer('remoteStartId'),
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
    index('authorization_attempts_authorization_id_timestamp').on(t.authorizationId, t.timestamp),
    index('authorization_attempts_station_id_timestamp').on(t.stationId, t.timestamp),
  ],
);

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const AuthorizationAttemptEntitySchema = createSelectSchema(authorizationAttemptTable);
export const AuthorizationAttemptEntityInsertSchema = createInsertSchema(authorizationAttemptTable);

export type AuthorizationAttemptEntity = typeof authorizationAttemptTable.$inferSelect;
export type AuthorizationAttemptEntityInsert = z.infer<
  typeof AuthorizationAttemptEntityInsertSchema
>;
