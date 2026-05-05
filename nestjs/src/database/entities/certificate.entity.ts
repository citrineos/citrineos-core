// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { bigint, boolean, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * CA / station / sub-CA certificate metadata. Distinct from
 * `InstalledCertificates` (which tracks what a charger has installed).
 * Self-references via `signedBy` so a chain can be reconstructed.
 *
 * Mirrors legacy `core/src/dal/.../Certificate/Certificate.ts`.
 */
export const certificates = pgTable(TableName.Certificates, {
  id: serial('id').primaryKey(),
  serialNumber: bigint('serialNumber', { mode: 'number' }).notNull(),
  issuerName: varchar('issuerName', { length: 512 }).notNull(),
  organizationName: varchar('organizationName', { length: 256 }).notNull(),
  commonName: varchar('commonName', { length: 256 }).notNull(),
  keyLength: integer('keyLength'),
  validBefore: varchar('validBefore', { length: 64 }),
  signatureAlgorithm: varchar('signatureAlgorithm', { length: 64 }),
  countryName: varchar('countryName', { length: 4 }),
  isCA: boolean('isCA').default(false),
  pathLen: integer('pathLen'),
  certificateFileId: varchar('certificateFileId', { length: 256 }),
  certificateFileHash: varchar('certificateFileHash', { length: 256 }),
  privateKeyFileId: varchar('privateKeyFileId', { length: 256 }),
  signedBy: integer('signedBy').references((): AnyPgColumn => certificates.id),
  tenantId: integer('tenantId')
    .notNull()
    .references(() => tenants.id),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
