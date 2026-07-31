// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { PaginatedParams } from '@citrineos/base';
import { TableName } from '@dal/layers/sequelize/model/TableName.js';
import {
  boolean,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function asyncJobStatusColumns() {
  return {
    // String (uuid) primary key. The DB column is "jobId"; exposed as `id` so the
    // shared DrizzleRepository base (which requires an `id` column) can operate on it.
    id: varchar('jobId', { length: 255 }).primaryKey(),
    jobName: varchar('jobName', { length: 255 }),
    tenantPartnerId: integer('tenantPartnerId'),
    finishedAt: timestamp('finishedAt', { withTimezone: true, mode: 'date' }),
    stoppedAt: timestamp('stoppedAt', { withTimezone: true, mode: 'date' }),
    stopScheduled: boolean('stopScheduled').default(false),
    isFailed: boolean('isFailed').default(false),
    paginationParams: jsonb('paginationParams').$type<PaginatedParams>(),
    totalObjects: integer('totalObjects'),
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
export const asyncJobStatusTable = pgTable(TableName.AsyncJobStatuses, asyncJobStatusColumns());

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof asyncJobStatusTable>();

export function tenantAsyncJobStatusTable(tenantId: number): typeof asyncJobStatusTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.AsyncJobStatuses,
      asyncJobStatusColumns(),
    ) as unknown as typeof asyncJobStatusTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const AsyncJobStatusEntitySchema = createSelectSchema(asyncJobStatusTable);
export const AsyncJobStatusEntityInsertSchema = createInsertSchema(asyncJobStatusTable);

export type AsyncJobStatusEntity = z.infer<typeof AsyncJobStatusEntitySchema>;
export type AsyncJobStatusEntityInsert = z.infer<typeof AsyncJobStatusEntityInsertSchema>;
