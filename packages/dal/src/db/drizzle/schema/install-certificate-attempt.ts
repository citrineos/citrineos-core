// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import { integer, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function installCertificateAttemptColumns() {
  return {
    id: serial('id').primaryKey(),
    // FK to ChargingStation (resolved from ocppConnectionName in the domain layer).
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 36 }).notNull(),
    certificateType: varchar('certificateType', { length: 255 }).notNull(),
    // FK to Certificate.
    certificateId: integer('certificateId'),
    requestId: integer('requestId'),
    status: varchar('status', { length: 255 }),
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
export const installCertificateAttemptTable = pgTable(
  TableName.InstallCertificateAttempts,
  installCertificateAttemptColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof installCertificateAttemptTable>();

export function tenantInstallCertificateAttemptTable(
  tenantId: number,
): typeof installCertificateAttemptTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.InstallCertificateAttempts,
      installCertificateAttemptColumns(),
    ) as unknown as typeof installCertificateAttemptTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const InstallCertificateAttemptEntitySchema = createSelectSchema(
  installCertificateAttemptTable,
);
export const InstallCertificateAttemptEntityInsertSchema = createInsertSchema(
  installCertificateAttemptTable,
);

export type InstallCertificateAttemptEntity = z.infer<typeof InstallCertificateAttemptEntitySchema>;
export type InstallCertificateAttemptEntityInsert = z.infer<
  typeof InstallCertificateAttemptEntityInsertSchema
>;
