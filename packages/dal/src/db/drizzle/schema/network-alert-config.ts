// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import type { NetworkAlertConfigDto, NetworkAlertType } from '@citrineos/types';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

export const networkAlertConfigTable = pgTable(
  TableName.NetworkAlertConfigs,
  {
    id: serial('id').primaryKey(),
    type: varchar('type', { length: 255 }).$type<NetworkAlertType>().notNull(),
    enabled: boolean('enabled'),
    rules: jsonb('rules').$type<NetworkAlertConfigDto['rules']>(),
    tenantId: integer('tenantId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex('network_alert_configs_tenant_id_type').on(t.tenantId, t.type)],
);

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const NetworkAlertConfigEntitySchema = createSelectSchema(networkAlertConfigTable);
export const NetworkAlertConfigEntityInsertSchema = createInsertSchema(networkAlertConfigTable);

export type NetworkAlertConfigEntity = z.infer<typeof NetworkAlertConfigEntitySchema>;
export type NetworkAlertConfigEntityInsert = z.infer<typeof NetworkAlertConfigEntityInsertSchema>;
