// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import type {
  NetworkAlertOccurrenceDto,
  NetworkAlertSeverity,
  NetworkAlertType,
} from '@citrineos/types';
import { index, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

export const networkAlertOccurrenceTable = pgTable(
  TableName.NetworkAlertOccurrences,
  {
    id: serial('id').primaryKey(),
    alertId: integer('alertId').notNull(),
    type: varchar('type', { length: 255 }).$type<NetworkAlertType>().notNull(),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    occurredAt: timestamp('occurredAt', { withTimezone: true, mode: 'date' }).notNull(),
    severity: varchar('severity', { length: 255 }).$type<NetworkAlertSeverity>().notNull(),
    websocketEventId: integer('websocketEventId'),
    statusNotificationId: integer('statusNotificationId'),
    ocppMessageId: integer('ocppMessageId'),
    details: jsonb('details').$type<NetworkAlertOccurrenceDto['details']>().notNull(),
    tenantId: integer('tenantId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index('network_alert_occurrences_alert_id_occurred_at').on(t.alertId, t.occurredAt),
    index('network_alert_occurrences_status_notification_id').on(t.statusNotificationId),
  ],
);

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const NetworkAlertOccurrenceEntitySchema = createSelectSchema(networkAlertOccurrenceTable);
export const NetworkAlertOccurrenceEntityInsertSchema = createInsertSchema(
  networkAlertOccurrenceTable,
);

export type NetworkAlertOccurrenceEntity = z.infer<typeof NetworkAlertOccurrenceEntitySchema>;
export type NetworkAlertOccurrenceEntityInsert = z.infer<
  typeof NetworkAlertOccurrenceEntityInsertSchema
>;
