// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  char,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Mirrors legacy `Tariffs` — OCPI-style flat-fee shape. The 2.1
 * `elements` / `energyMix` hierarchical structure isn't carried here;
 * legacy materializes per-fee-type jsonb columns
 * (`chargingTime`, `idleTime`, `fixedFee`, `reservationTime`, etc.)
 * alongside the flat numeric `pricePerKwh` / `pricePerMin` / etc.
 */
export const tariffs = pgTable(
  TableName.Tariffs,
  {
    id: serial('id').primaryKey(),
    currency: char('currency', { length: 3 }).notNull(),
    pricePerKwh: numeric('pricePerKwh').notNull(),
    pricePerMin: numeric('pricePerMin'),
    pricePerSession: numeric('pricePerSession'),
    authorizationAmount: numeric('authorizationAmount'),
    paymentFee: numeric('paymentFee'),
    taxRate: numeric('taxRate'),
    tariffAltText: varchar('tariffAltText', { length: 255 }),
    tariffId: varchar('tariffId', { length: 255 }),
    validFrom: timestamp('validFrom', { withTimezone: true }),
    /** OCPP 2.1 hierarchical jsonb fields (added by the
     *  `add-ocpp21-tariff-fields` legacy migration). */
    description: jsonb('description'),
    energy: jsonb('energy'),
    chargingTime: jsonb('chargingTime'),
    idleTime: jsonb('idleTime'),
    fixedFee: jsonb('fixedFee'),
    reservationTime: jsonb('reservationTime'),
    reservationFixed: jsonb('reservationFixed'),
    minCost: jsonb('minCost'),
    maxCost: jsonb('maxCost'),
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
  },
  (t) => [index('tariffs_tariff_id_idx').on(t.tariffId)],
);

export type Tariff = typeof tariffs.$inferSelect;
export type NewTariff = typeof tariffs.$inferInsert;
