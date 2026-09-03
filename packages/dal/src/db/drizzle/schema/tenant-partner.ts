// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { PartnerProfile } from '@citrineos/types';
import { TableName } from '@dal/models/table-name.js';
import { integer, jsonb, pgSchema, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

// Column definitions are a function to ensure fresh objects per table instance,
// which is required when the same schema is used across multiple pgSchema() calls.
function tenantPartnerColumns() {
  return {
    id: serial('id').primaryKey(),
    partyId: varchar('partyId', { length: 255 }),
    countryCode: varchar('countryCode', { length: 255 }),
    partnerProfileOCPI: jsonb('partnerProfileOCPI').$type<PartnerProfile>(),
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
export const tenantPartnerTable = pgTable(TableName.TenantPartners, tenantPartnerColumns());

// Schema-per-tenant (future approach): one Postgres schema per tenant, no tenantId filter needed
const tenantTableCache = new Map<number, typeof tenantPartnerTable>();

export function tenantTenantPartnerTable(tenantId: number): typeof tenantPartnerTable {
  if (!tenantTableCache.has(tenantId)) {
    const t = pgSchema(`tenant_${tenantId}`).table(
      TableName.TenantPartners,
      tenantPartnerColumns(),
    ) as unknown as typeof tenantPartnerTable;
    tenantTableCache.set(tenantId, t);
  }
  return tenantTableCache.get(tenantId)!;
}

// ─── Zod schemas (runtime validation + type inference) ───────────────────────

export const TenantPartnerEntitySchema = createSelectSchema(tenantPartnerTable);
export const TenantPartnerEntityInsertSchema = createInsertSchema(tenantPartnerTable);

export type TenantPartnerEntity = z.infer<typeof TenantPartnerEntitySchema>;
export type TenantPartnerEntityInsert = z.infer<typeof TenantPartnerEntityInsertSchema>;
