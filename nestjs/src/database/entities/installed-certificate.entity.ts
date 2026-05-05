// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { certificates } from '@entities/certificate.entity';
import { tenants } from '@entities/tenant.entity';

/**
 * Mirrors legacy `InstalledCertificates`. Identifies an installed
 * certificate by the OCSP-style hash triple
 * (`hashAlgorithm`, `issuerNameHash`, `issuerKeyHash`, `serialNumber`)
 * plus a soft FK to the source `Certificates` row.
 */
export const installedCertificates = pgTable(TableName.InstalledCertificates, {
  id: serial('id').primaryKey(),
  stationId: varchar('stationId', { length: 36 }).notNull(),
  hashAlgorithm: varchar('hashAlgorithm', { length: 255 }).notNull(),
  issuerNameHash: varchar('issuerNameHash', { length: 255 }).notNull(),
  issuerKeyHash: varchar('issuerKeyHash', { length: 255 }).notNull(),
  serialNumber: varchar('serialNumber', { length: 255 }).notNull(),
  certificateType: varchar('certificateType', { length: 255 }).notNull(),
  /** Soft FK to the source `Certificates` row. */
  certificateId: integer('certificateId').references(() => certificates.id),
  /** Soft FK to `ChargingStations.pkId` per the legacy migration. */
  stationPkId: integer('stationPkId'),
  tenantId: integer('tenantId')
    .notNull()
    .default(sql`1`)
    .references(() => tenants.id),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type InstalledCertificate = typeof installedCertificates.$inferSelect;
export type NewInstalledCertificate = typeof installedCertificates.$inferInsert;
