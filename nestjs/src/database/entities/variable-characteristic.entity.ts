// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';
import { variables } from '@entities/variable.entity';

/**
 * Per-Variable static metadata: data type, range, allowed values,
 * monitoring support. Mirrors legacy
 * `core/src/dal/.../DeviceModel/VariableCharacteristics.ts`.
 *
 * One row per `Variables` entry. Populated from `NotifyReport`.
 */
export const variableCharacteristics = pgTable(TableName.VariableCharacteristics, {
  id: serial('id').primaryKey(),
  variableId: integer('variableId').references(() => variables.id),
  unit: varchar('unit', { length: 32 }),
  dataType: varchar('dataType', { length: 32 }).notNull(),
  minLimit: numeric('minLimit'),
  maxLimit: numeric('maxLimit'),
  /** OCPP 2.0.1 caps `valuesList` at 4000 chars. */
  valuesList: text('valuesList'),
  supportsMonitoring: boolean('supportsMonitoring').notNull().default(false),
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

export type VariableCharacteristic = typeof variableCharacteristics.$inferSelect;
export type NewVariableCharacteristic = typeof variableCharacteristics.$inferInsert;
