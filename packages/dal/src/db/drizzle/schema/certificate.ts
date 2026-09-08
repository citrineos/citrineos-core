// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import {
  bigint,
  boolean,
  integer,
  pgSchema,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function certificateColumns() {
  return {
    id: serial('id').primaryKey(),
    serialNumber: bigint('serialNumber', { mode: 'number' }),
    issuerName: varchar('issuerName', { length: 255 }),
    organizationName: varchar('organizationName', { length: 255 }),
    commonName: varchar('commonName', { length: 255 }),
    keyLength: integer('keyLength'),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    validBefore: timestamp('validBefore', { withTimezone: true, mode: 'date' }),
    signatureAlgorithm: varchar('signatureAlgorithm', { length: 255 }),
    countryName: varchar('countryName', { length: 255 }),
    isCA: boolean('isCA'),
    pathLen: integer('pathLen'),
    certificateFileId: varchar('certificateFileId', { length: 255 }),
    certificateFileHash: varchar('certificateFileHash', { length: 255 }),
    privateKeyFileId: varchar('privateKeyFileId', { length: 255 }),
    // Self-referential FK to another Certificate (the signing certificate).
    signedBy: integer('signedBy'),
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
export const certificateTable = pgTable(TableName.Certificates, certificateColumns(), (t) => [
  uniqueIndex('tenantId_serialNumber_issuerName').on(t.tenantId, t.serialNumber, t.issuerName),
  uniqueIndex('tenantId_certificateFileHash').on(t.tenantId, t.certificateFileHash),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof certificateTable>();

export function tenantCertificateTable(tenantId: number): typeof certificateTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Certificates,
      certificateColumns(),
    ) as unknown as typeof certificateTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const CertificateEntitySchema = createSelectSchema(certificateTable);
export const CertificateEntityInsertSchema = createInsertSchema(certificateTable);

export type CertificateEntity = z.infer<typeof CertificateEntitySchema>;
export type CertificateEntityInsert = z.infer<typeof CertificateEntityInsertSchema>;
