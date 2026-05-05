// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TableName } from '@db/table-names';
import { localListAuthorizations } from '@entities/local-list-authorization.entity';
import { sendLocalLists } from '@entities/send-local-list.entity';
import { tenants } from '@entities/tenant.entity';

/**
 * Junction table: which `LocalListAuthorization` entries went out as
 * part of a particular `SendLocalList` envelope. Mirrors legacy
 * `SendLocalListAuthorization` — composite PK on
 * `(sendLocalListId, authorizationId)`, no synthetic `id`.
 */
export const sendLocalListAuthorizations = pgTable(
  TableName.SendLocalListAuthorizations,
  {
    sendLocalListId: integer('sendLocalListId')
      .notNull()
      .references(() => sendLocalLists.id),
    authorizationId: integer('authorizationId')
      .notNull()
      .references(() => localListAuthorizations.id),
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
  (t) => [primaryKey({ columns: [t.sendLocalListId, t.authorizationId] })],
);

export type SendLocalListAuthorization = typeof sendLocalListAuthorizations.$inferSelect;
export type NewSendLocalListAuthorization = typeof sendLocalListAuthorizations.$inferInsert;
