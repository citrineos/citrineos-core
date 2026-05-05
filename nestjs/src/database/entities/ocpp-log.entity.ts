// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Coarser session-level log distinct from the `OcppMessages` per-frame
 * audit trail. Captures whole sessions (`connect → disconnect`) plus
 * structured operator events (e.g. "blacklisted", "tariff-applied").
 *
 * Mirrors legacy `core/src/dal/layers/sequelize/model/OcppLog.ts`.
 */
export const ocppLog = pgTable(
  TableName.OcppLog,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }).notNull(),
    /** Coarse event type — `session.connected`, `session.disconnected`, … */
    eventType: varchar('eventType', { length: 64 }).notNull(),
    /** Free-form operator-readable summary. */
    message: text('message'),
    /** Structured detail. */
    details: jsonb('details'),
    tenantId: integer('tenantId')
      .notNull()
      .references(() => tenants.id),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index('ocpp_log_station_id_idx').on(t.stationId),
    index('ocpp_log_event_type_idx').on(t.eventType),
  ],
);

export type OcppLogRow = typeof ocppLog.$inferSelect;
export type NewOcppLogRow = typeof ocppLog.$inferInsert;
