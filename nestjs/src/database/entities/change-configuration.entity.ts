// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * OCPP 1.6 ChangeConfiguration history. Each accepted CSMS-initiated
 * ChangeConfiguration call appends/updates a row keyed by `(stationId, key)`
 * so the CSMS knows what value the charger currently has.
 */
export const changeConfigurations = pgTable(
  TableName.ChangeConfigurations,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }).notNull(),
    key: varchar('key', { length: 255 }).notNull(),
    value: varchar('value', { length: 500 }),
    readonly: boolean('readonly'),
    tenantId: integer('tenantId')
      .notNull()
      .references(() => tenants.id),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex('change_configurations_station_key_tenant_unique').on(
      t.stationId,
      t.key,
      t.tenantId,
    ),
  ],
);

export type ChangeConfiguration = typeof changeConfigurations.$inferSelect;
export type NewChangeConfiguration = typeof changeConfigurations.$inferInsert;
