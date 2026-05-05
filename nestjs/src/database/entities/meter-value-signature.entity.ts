// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { meterValues } from '@entities/meter-value.entity';
import { tenants } from '@entities/tenant.entity';

/**
 * Per-sample signed-meter-value audit. One row per `signedMeterValue`
 * envelope verified, capturing the result and the public key fingerprint
 * used. Mirrors legacy `core/src/dal/layers/sequelize/model/MeterValueSignature.ts`.
 *
 * Independent of `MeterValues` (one row in `MeterValueSignatures` per
 * sampledValue inside the envelope, not per envelope) so dashboards can
 * surface "this transaction had 200 samples, 198 verified".
 */
export const meterValueSignatures = pgTable(
  TableName.MeterValueSignatures,
  {
    id: serial('id').primaryKey(),
    meterValueId: integer('meterValueId').references(() => meterValues.id),
    /** SHA-256 hash of the verified public key (not the key itself). */
    publicKeyFingerprint: varchar('publicKeyFingerprint', { length: 128 }),
    signingMethod: varchar('signingMethod', { length: 32 }),
    signedMeterData: text('signedMeterData'),
    valid: boolean('valid').notNull(),
    /** Reason on failure; null when `valid=true`. */
    reason: varchar('reason', { length: 500 }),
    tenantId: integer('tenantId')
      .notNull()
      .references(() => tenants.id),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index('meter_value_signatures_meter_value_id_idx').on(t.meterValueId)],
);

export type MeterValueSignature = typeof meterValueSignatures.$inferSelect;
export type NewMeterValueSignature = typeof meterValueSignatures.$inferInsert;
