// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';
import { variableAttributes } from '@entities/variable-attribute.entity';

/**
 * Per-VariableAttribute status snapshot — the charger's last reported
 * status for a SetVariables / GetVariables round-trip. Each row is a
 * point-in-time snapshot; the latest is queried by `(variableAttributeId, createdAt DESC)`.
 *
 * Mirrors legacy `VariableStatus`.
 */
export const variableStatuses = pgTable(TableName.VariableStatuses, {
  id: serial('id').primaryKey(),
  /** OCPP variable value can be 4000 chars in 2.0.1. */
  value: text('value').notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  statusInfo: jsonb('statusInfo'),
  variableAttributeId: integer('variableAttributeId').references(() => variableAttributes.id),
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

export type VariableStatus = typeof variableStatuses.$inferSelect;
export type NewVariableStatus = typeof variableStatuses.$inferInsert;
