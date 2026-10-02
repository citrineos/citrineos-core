// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import type {
  NetworkAlertDto,
  NetworkAlertResolvedBy,
  NetworkAlertSeverity,
  NetworkAlertStatus,
  NetworkAlertType,
} from '@citrineos/types';
import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

export const networkAlertTable = pgTable(
  TableName.NetworkAlerts,
  {
    id: serial('id').primaryKey(),
    type: varchar('type', { length: 255 }).$type<NetworkAlertType>().notNull(),
    severity: varchar('severity', { length: 255 }).$type<NetworkAlertSeverity>().notNull(),
    status: varchar('status', { length: 255 }).$type<NetworkAlertStatus>().notNull(),
    stationId: integer('stationId'),
    evseId: integer('evseId'),
    connectorId: integer('connectorId'),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    firstSeenAt: timestamp('firstSeenAt', { withTimezone: true, mode: 'date' }).notNull(),
    lastSeenAt: timestamp('lastSeenAt', { withTimezone: true, mode: 'date' }).notNull(),
    occurrenceCount: integer('occurrenceCount').default(1).notNull(),
    resolvedAt: timestamp('resolvedAt', { withTimezone: true, mode: 'date' }),
    resolvedBy: varchar('resolvedBy', { length: 255 }).$type<NetworkAlertResolvedBy>(),
    details: jsonb('details').$type<NetworkAlertDto['details']>().notNull(),
    tenantId: integer('tenantId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index('network_alerts_station_id').on(t.stationId),
    index('network_alerts_open_lookup')
      .on(t.tenantId, t.stationId, t.type)
      .where(sql`${t.status} <> 'Resolved'`),
  ],
);

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const NetworkAlertEntitySchema = createSelectSchema(networkAlertTable);
export const NetworkAlertEntityInsertSchema = createInsertSchema(networkAlertTable);

export type NetworkAlertEntity = z.infer<typeof NetworkAlertEntitySchema>;
export type NetworkAlertEntityInsert = z.infer<typeof NetworkAlertEntityInsertSchema>;
