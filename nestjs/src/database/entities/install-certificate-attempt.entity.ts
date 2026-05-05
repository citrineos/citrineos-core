// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { certificates } from '@entities/certificate.entity';
import { tenants } from '@entities/tenant.entity';

/**
 * Pending CSMS-initiated `InstallCertificate` request. The CSMS picks
 * a `Certificates.id`, sends it to the charger, and records the result
 * here. Mirrors legacy `InstallCertificateAttempt`.
 */
export const installCertificateAttempts = pgTable(TableName.InstallCertificateAttempts, {
  id: serial('id').primaryKey(),
  stationId: varchar('stationId', { length: 36 }).notNull(),
  certificateType: varchar('certificateType', { length: 255 }).notNull(),
  certificateId: integer('certificateId').references(() => certificates.id),
  /** Null while pending; Accepted/Rejected/Failed after response. */
  status: varchar('status', { length: 255 }),
  /** Soft FK to `ChargingStations.pkId` per the legacy migration. */
  stationPkId: integer('stationPkId'),
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

export type InstallCertificateAttempt = typeof installCertificateAttempts.$inferSelect;
export type NewInstallCertificateAttempt = typeof installCertificateAttempts.$inferInsert;
