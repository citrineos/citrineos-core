// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * OCPP 2.0.1 SalesTariff — sub-element of a ChargingSchedule that
 * carries the price points exposed to the EV. Mirrors legacy
 * `core/src/dal/layers/sequelize/model/SalesTariff.ts`. `databaseId`
 * is the local PK; `id` is the wire-level salesTariffId.
 */
export const salesTariffs = pgTable(TableName.SalesTariffs, {
  databaseId: serial('databaseId').primaryKey(),
  id: integer('id'),
  numEPriceLevels: integer('numEPriceLevels'),
  salesTariffDescription: varchar('salesTariffDescription', { length: 255 }),
  /** Wire `SalesTariffEntryType[]` array as a single jsonb blob. */
  salesTariffEntry: jsonb('salesTariffEntry'),
  /** Soft FK to `ChargingSchedules.databaseId`. */
  chargingScheduleDatabaseId: integer('chargingScheduleDatabaseId'),
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

export type SalesTariff = typeof salesTariffs.$inferSelect;
export type NewSalesTariff = typeof salesTariffs.$inferInsert;
