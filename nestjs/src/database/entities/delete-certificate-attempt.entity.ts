// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Pending CSMS-initiated `DeleteCertificate` request. Created when the
 * CSMS sends the CALL; the response handler resolves it on
 * status, then removes matching `InstalledCertificates` rows on
 * `Accepted`. Mirrors legacy `DeleteCertificateAttempt`.
 */
export const deleteCertificateAttempts = pgTable(TableName.DeleteCertificateAttempts, {
  id: serial('id').primaryKey(),
  stationId: varchar('stationId', { length: 36 }).notNull(),
  hashAlgorithm: varchar('hashAlgorithm', { length: 255 }).notNull(),
  issuerNameHash: varchar('issuerNameHash', { length: 255 }),
  issuerKeyHash: varchar('issuerKeyHash', { length: 255 }),
  serialNumber: varchar('serialNumber', { length: 255 }),
  /** Null while pending; Accepted/Failed/NotFound after response. */
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

export type DeleteCertificateAttempt = typeof deleteCertificateAttempts.$inferSelect;
export type NewDeleteCertificateAttempt = typeof deleteCertificateAttempts.$inferInsert;
