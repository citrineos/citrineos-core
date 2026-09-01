// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
import { integer, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function latestStatusNotificationColumns() {
  return {
    // Implicit auto-increment PK (the sequelize model declares no @PrimaryKey).
    id: serial('id').primaryKey(),
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    // FK to StatusNotification; the sequelize model declares this as a string.
    statusNotificationId: varchar('statusNotificationId', { length: 255 }),
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
export const latestStatusNotificationTable = pgTable(
  TableName.LatestStatusNotifications,
  latestStatusNotificationColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof latestStatusNotificationTable>();

export function tenantLatestStatusNotificationTable(
  tenantId: number,
): typeof latestStatusNotificationTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.LatestStatusNotifications,
      latestStatusNotificationColumns(),
    ) as unknown as typeof latestStatusNotificationTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const LatestStatusNotificationEntitySchema = createSelectSchema(
  latestStatusNotificationTable,
);
export const LatestStatusNotificationEntityInsertSchema = createInsertSchema(
  latestStatusNotificationTable,
);

export type LatestStatusNotificationEntity = z.infer<typeof LatestStatusNotificationEntitySchema>;
export type LatestStatusNotificationEntityInsert = z.infer<
  typeof LatestStatusNotificationEntityInsertSchema
>;
