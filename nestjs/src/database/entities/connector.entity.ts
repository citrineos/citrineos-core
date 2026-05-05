// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * Internal Connector row — mirrors `core/src/dal/layers/sequelize/model/Location/Connector.ts`.
 *
 * `status` carries the OCPP 2.0.1 `ConnectorStatusEnumType` value (Available,
 * Occupied, Reserved, Unavailable, Faulted). 1.6's wider status set is
 * collapsed into the same column by the StatusNotification handler.
 *
 * The remaining columns mirror the physical connector metadata (type,
 * format, errorCode, powerType, max ratings, vendor info) — populated
 * when the charger emits a 1.6 StatusNotification or when the operator
 * inserts the row via REST. Most are optional since OCPP 2.0.1 doesn't
 * carry them on StatusNotification (they come from device-model GetReport).
 */
export const connectors = pgTable(
  TableName.Connectors,
  {
    id: serial('id').primaryKey(),
    stationId: varchar('stationId', { length: 255 }).notNull(),
    /** Integer FK to `Evses.id` (NOT the wire-level OCPP evseId, which is varchar on `Evses`). Nullable when the EVSE row has not yet been materialised — matches legacy. */
    evseId: integer('evseId'),
    connectorId: integer('connectorId').notNull(),
    status: varchar('status', { length: 64 }),
    type: varchar('type', { length: 64 }),
    format: varchar('format', { length: 32 }),
    errorCode: varchar('errorCode', { length: 64 }),
    powerType: varchar('powerType', { length: 32 }),
    maximumAmperage: integer('maximumAmperage'),
    maximumVoltage: integer('maximumVoltage'),
    maximumPowerWatts: integer('maximumPowerWatts'),
    info: varchar('info', { length: 255 }),
    vendorId: varchar('vendorId', { length: 255 }),
    vendorErrorCode: varchar('vendorErrorCode', { length: 255 }),
    timestamp: timestamp('timestamp', { withTimezone: true }),
    /** Soft FK to `EvseTypes.connectorId` per the legacy device model. */
    evseTypeConnectorId: integer('evseTypeConnectorId'),
    /** Soft FK to a Tariff that applies to this connector. */
    tariffId: integer('tariffId'),
    termsAndConditionsUrl: varchar('termsAndConditionsUrl', { length: 255 }),
    /** Soft FK to `ChargingStations.pkId` per the legacy migration. */
    stationPkId: integer('stationPkId'),
    tenantId: integer('tenantId')
      .notNull()
      .references(() => tenants.id),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index('connectors_station_id_idx').on(t.stationId),
    uniqueIndex('stationPkId_connectorId').on(t.stationPkId, t.connectorId),
  ],
);

export type Connector = typeof connectors.$inferSelect;
export type NewConnector = typeof connectors.$inferInsert;
