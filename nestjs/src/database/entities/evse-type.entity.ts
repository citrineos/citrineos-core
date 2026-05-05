// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * EVSE reference data — `id` is the OCPP-protocol-level EVSE id
 * (charger-assigned), `databaseId` is our internal serial PK. Used by
 * VariableAttribute / Component lookups when the OCPP wire frame
 * carries an `evseId` reference.
 *
 * Mirrors legacy `EvseType`.
 */
export const evseTypes = pgTable(TableName.EvseTypes, {
  databaseId: serial('databaseId').primaryKey(),
  id: integer('id').notNull(),
  connectorId: integer('connectorId'),
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

export type EvseType = typeof evseTypes.$inferSelect;
export type NewEvseType = typeof evseTypes.$inferInsert;
