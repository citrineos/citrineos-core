// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/TableName.js';
import { integer, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function deleteCertificateAttemptColumns() {
  return {
    id: serial('id').primaryKey(),
    // FK to ChargingStation (resolved from ocppConnectionName in the domain layer).
    stationId: integer('stationId'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 36 }).notNull(),
    hashAlgorithm: varchar('hashAlgorithm', { length: 255 }).notNull(),
    issuerNameHash: varchar('issuerNameHash', { length: 255 }),
    issuerKeyHash: varchar('issuerKeyHash', { length: 255 }),
    serialNumber: varchar('serialNumber', { length: 255 }),
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
export const deleteCertificateAttemptTable = pgTable(
  TableName.DeleteCertificateAttempts,
  deleteCertificateAttemptColumns(),
);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof deleteCertificateAttemptTable>();

export function tenantDeleteCertificateAttemptTable(
  tenantId: number,
): typeof deleteCertificateAttemptTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.DeleteCertificateAttempts,
      deleteCertificateAttemptColumns(),
    ) as unknown as typeof deleteCertificateAttemptTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const DeleteCertificateAttemptEntitySchema = createSelectSchema(
  deleteCertificateAttemptTable,
);
export const DeleteCertificateAttemptEntityInsertSchema = createInsertSchema(
  deleteCertificateAttemptTable,
);

export type DeleteCertificateAttemptEntity = z.infer<typeof DeleteCertificateAttemptEntitySchema>;
export type DeleteCertificateAttemptEntityInsert = z.infer<
  typeof DeleteCertificateAttemptEntityInsertSchema
>;
