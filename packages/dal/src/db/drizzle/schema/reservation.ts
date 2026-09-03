// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TableName } from '@dal/models/table-name.js';
import {
  boolean,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function reservationColumns() {
  return {
    databaseId: serial('databaseId').primaryKey(),
    id: integer('id'),
    ocppConnectionName: varchar('ocppConnectionName', { length: 255 }),
    // mode: 'date' returns a JS Date — mapped to ISO string in the repository layer
    expiryDateTime: timestamp('expiryDateTime', { withTimezone: true, mode: 'date' }),
    connectorType: varchar('connectorType', { length: 255 }),
    reserveStatus: varchar('reserveStatus', { length: 255 }),
    isActive: boolean('isActive').default(false),
    terminatedByTransaction: varchar('terminatedByTransaction', { length: 255 }),
    idToken: jsonb('idToken'),
    groupIdToken: jsonb('groupIdToken'),
    // FK column created via the @BelongsTo(EvseType, 'evseId') association in the model.
    evseId: integer('evseId'),
    tenantId: integer('tenantId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  };
}

// Row-level tenancy (current approach): single public schema, tenantId column filter on every query
export const reservationTable = pgTable(TableName.Reservations, reservationColumns(), (t) => [
  uniqueIndex('reservations_station_name_tenant_id_id').on(t.id, t.ocppConnectionName, t.tenantId),
]);

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof reservationTable>();

export function tenantReservationTable(tenantId: number): typeof reservationTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.Reservations,
      reservationColumns(),
    ) as unknown as typeof reservationTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const ReservationEntitySchema = createSelectSchema(reservationTable);
export const ReservationEntityInsertSchema = createInsertSchema(reservationTable);

export type ReservationEntity = z.infer<typeof ReservationEntitySchema>;
export type ReservationEntityInsert = z.infer<typeof ReservationEntityInsertSchema>;
