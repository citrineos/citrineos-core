// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * OCPI-style partner profile a tenant has registered with. Mirrors
 * legacy `core/src/dal/layers/sequelize/model/TenantPartner.ts`:
 * the row identifies a partner by `(partyId, countryCode)` (the OCPI
 * pair) and stores its OCPI configuration as a `partnerProfileOCPI`
 * jsonb blob.
 */
export const tenantPartners = pgTable(TableName.TenantPartners, {
  id: serial('id').primaryKey(),
  partyId: varchar('partyId', { length: 255 }).notNull(),
  countryCode: varchar('countryCode', { length: 255 }).notNull(),
  tenantId: integer('tenantId')
    .notNull()
    .default(sql`1`)
    .references(() => tenants.id),
  partnerProfileOCPI: jsonb('partnerProfileOCPI'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type TenantPartner = typeof tenantPartners.$inferSelect;
export type NewTenantPartner = typeof tenantPartners.$inferInsert;
