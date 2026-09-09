// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import { integer, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function statusNotificationColumns() {
  return {
    // Implicit auto-increment PK (the sequelize model declares no @PrimaryKey).
    id: serial('id').primaryKey(),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }),
    connectorStatus: varchar('connectorStatus', { length: 255 }),
    evseId: integer('evseId'),
    connectorId: integer('connectorId'),
    errorCode: varchar('errorCode', { length: 255 }),
    info: varchar('info', { length: 255 }),
    vendorId: varchar('vendorId', { length: 255 }),
    vendorErrorCode: varchar('vendorErrorCode', { length: 255 }),
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
export const statusNotificationTable = pgTable(
  TableName.StatusNotifications,
  statusNotificationColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof statusNotificationTable>();

export function tenantStatusNotificationTable(tenantId: number): typeof statusNotificationTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.StatusNotifications,
      statusNotificationColumns(),
    ) as unknown as typeof statusNotificationTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const StatusNotificationEntitySchema = createSelectSchema(statusNotificationTable);
export const StatusNotificationEntityInsertSchema = createInsertSchema(statusNotificationTable);

export type StatusNotificationEntity = z.infer<typeof StatusNotificationEntitySchema>;
export type StatusNotificationEntityInsert = z.infer<typeof StatusNotificationEntityInsertSchema>;
