// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, integer, json, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenantPartners } from '@entities/tenant-partner.entity';

/**
 * Async background job tracking — used by long-running OCPI / partner
 * imports. Mirrors legacy `AsyncJobStatus`.
 *
 * Primary key is `jobId` directly (varchar) — no synthetic `id`. Jobs
 * scope to a tenant *partner* (the OCPI counterparty), not directly to
 * a tenant; legacy carries no top-level `tenantId` here.
 */
export const asyncJobStatuses = pgTable(TableName.AsyncJobStatuses, {
  jobId: varchar('jobId', { length: 255 }).primaryKey(),
  jobName: varchar('jobName', { length: 255 }).notNull(),
  tenantPartnerId: integer('tenantPartnerId')
    .notNull()
    .references(() => tenantPartners.id),
  finishedAt: timestamp('finishedAt', { withTimezone: true }),
  stoppedAt: timestamp('stoppedAt', { withTimezone: true }),
  stopScheduled: boolean('stopScheduled').notNull().default(false),
  isFailed: boolean('isFailed').notNull().default(false),
  paginationParams: json('paginationParams').notNull(),
  totalObjects: integer('totalObjects'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type AsyncJobStatus = typeof asyncJobStatuses.$inferSelect;
export type NewAsyncJobStatus = typeof asyncJobStatuses.$inferInsert;
