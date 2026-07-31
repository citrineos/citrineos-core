// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { StatusInfo } from '@citrineos/types';
import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import { integer, jsonb, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function variableMonitoringStatusColumns() {
  return {
    // No @PrimaryKey in the model → Sequelize adds an auto-increment integer id.
    id: serial('id').primaryKey(),
    status: varchar('status', { length: 255 }),
    statusInfo: jsonb('statusInfo').$type<StatusInfo>(),
    variableMonitoringId: integer('variableMonitoringId'),
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
export const variableMonitoringStatusTable = pgTable(
  TableName.VariableMonitoringStatuses,
  variableMonitoringStatusColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof variableMonitoringStatusTable>();

export function tenantVariableMonitoringStatusTable(
  tenantId: number,
): typeof variableMonitoringStatusTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.VariableMonitoringStatuses,
      variableMonitoringStatusColumns(),
    ) as unknown as typeof variableMonitoringStatusTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const VariableMonitoringStatusEntitySchema = createSelectSchema(
  variableMonitoringStatusTable,
);
export const VariableMonitoringStatusEntityInsertSchema = createInsertSchema(
  variableMonitoringStatusTable,
);

export type VariableMonitoringStatusEntity = z.infer<typeof VariableMonitoringStatusEntitySchema>;
export type VariableMonitoringStatusEntityInsert = z.infer<
  typeof VariableMonitoringStatusEntityInsertSchema
>;
