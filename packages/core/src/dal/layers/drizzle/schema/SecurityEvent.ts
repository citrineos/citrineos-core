// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import { index, integer, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function securityEventColumns() {
  return {
    id: serial('id').primaryKey(),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).notNull(),
    techInfo: varchar('techInfo', { length: 255 }),
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
export const securityEventTable = pgTable(TableName.SecurityEvents, securityEventColumns(), (t) => [
  index('security_events_ocpp_connection_name').on(t.ocppConnectionName),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof securityEventTable>();

// Returns a schema-qualified table reference for schema-per-tenant queries.
// Cast to typeof securityEventTable so Drizzle's query builder can infer correct
// return types — the column structure is identical, only the schema name differs at runtime.
export function tenantSecurityEventTable(tenantId: number): typeof securityEventTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.SecurityEvents,
      securityEventColumns(),
    ) as unknown as typeof securityEventTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

// Entity schema: represents a fully-hydrated row read from the database.
export const SecurityEventEntitySchema = createSelectSchema(securityEventTable);

// Insert schema: represents the subset of fields required/accepted on write.
// drizzle-zod automatically makes columns with $defaultFn optional here.
export const SecurityEventEntityInsertSchema = createInsertSchema(securityEventTable);

export type SecurityEventEntity = z.infer<typeof SecurityEventEntitySchema>;
export type SecurityEventEntityInsert = z.infer<typeof SecurityEventEntityInsertSchema>;
