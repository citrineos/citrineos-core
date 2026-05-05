// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';
import { variableMonitorings } from '@entities/variable-monitoring.entity';

/**
 * Per-VariableMonitoring status snapshot — the charger's last reported
 * status for a SetVariableMonitoring / ClearVariableMonitoring
 * round-trip. Mirrors legacy `VariableMonitoringStatus`.
 */
export const variableMonitoringStatuses = pgTable(TableName.VariableMonitoringStatuses, {
  id: serial('id').primaryKey(),
  status: varchar('status', { length: 32 }).notNull(),
  /**
   * Carries `{ reasonCode: <CallAction> }` for rejection rows written by
   * `SetMonitoringBase` — legacy stores the originating action here
   * rather than on a dedicated column.
   */
  statusInfo: jsonb('statusInfo'),
  variableMonitoringId: integer('variableMonitoringId').references(
    () => variableMonitorings.databaseId,
  ),
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

export type VariableMonitoringStatus = typeof variableMonitoringStatuses.$inferSelect;
export type NewVariableMonitoringStatus = typeof variableMonitoringStatuses.$inferInsert;
