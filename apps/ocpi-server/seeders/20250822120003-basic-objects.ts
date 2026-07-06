// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

'use strict';

import type { QueryOptions } from 'sequelize';
import { QueryInterface } from 'sequelize';

/**
 * Idempotent upsert helper for seeders.
 *
 * Seeders in this app are run with `db:seed:all` and are NOT tracked in a
 * SequelizeMeta-style table, so they execute on every run. Each seeder must
 * therefore be safe to apply repeatedly: insert the row if it is missing,
 * otherwise update the existing row in place.
 */
async function upsert(
  queryInterface: QueryInterface,
  table: string,
  record: Record<string, any>,
  conflictKeys: string[] = ['id'],
): Promise<void> {
  const whereClause = conflictKeys.map((k) => `"${k}" = :${k}`).join(' AND ');
  const replacements: Record<string, any> = {};
  for (const key of conflictKeys) {
    replacements[key] = record[key];
  }

  const [existing] = await queryInterface.sequelize.query(
    `SELECT 1 FROM "${table}" WHERE ${whereClause} LIMIT 1`,
    { replacements },
  );

  if ((existing as unknown[]).length > 0) {
    const updateValues: Record<string, any> = { ...record };
    for (const key of conflictKeys) {
      delete updateValues[key];
    }
    delete updateValues.createdAt; // never overwrite the original creation timestamp
    const where = conflictKeys.reduce<Record<string, any>>((acc, key) => {
      acc[key] = record[key];
      return acc;
    }, {});
    await queryInterface.bulkUpdate(table, updateValues, where, {} as QueryOptions);
  } else {
    await queryInterface.bulkInsert(table, [record], {} as QueryOptions);
  }
}

/**
 * Best-effort delete used by `down`. If the delete is blocked because the row has
 * accumulated live dependents (FK / trigger conflict), log a warning and continue
 * rather than aborting the entire undo.
 */
async function tryDelete(
  queryInterface: QueryInterface,
  table: string,
  where: Record<string, any>,
): Promise<void> {
  try {
    await queryInterface.bulkDelete(table, where, {} as QueryOptions);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `Skipping delete of ${table} ${JSON.stringify(where)} — it appears to be in live use: ${reason}`,
    );
  }
}

// Fixed identifiers shared across the seeded objects so the graph wires together
// deterministically and re-running the seeder updates the same rows.
const TENANT_ID = 1;
const TENANT_PARTNER_ID = 1;
const LOCATION_ID = 1;
const STATION_ID = 1;
const STATION_NAME = 'cp001'; // ocppConnectionName (the tenant-scoped WebSocket identifier)
const EVSE_ID = 1;
const CONNECTOR_ID = 1;
const TARIFF_ID = 1;
const AUTHORIZATION_ID = 1;

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();

    // Location
    const location = {
      id: LOCATION_ID,
      name: 'Test Charging Hub',
      address: '123 Electric Avenue',
      city: 'San Francisco',
      postalCode: '94102',
      state: 'CA',
      country: 'USA',
      timeZone: 'America/Los_Angeles',
      publishUpstream: true,
      parkingType: 'AlongMotorway',
      facilities: JSON.stringify(['Cafe', 'ParkingLot', 'Wifi']),
      coordinates: JSON.stringify({
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // [longitude, latitude] for San Francisco
      }),
      openingHours: JSON.stringify({
        twentyfourSeven: true,
      }),
      tenantId: TENANT_ID,
      createdAt: now,
      updatedAt: now,
    };
    await upsert(queryInterface, 'Locations', location);

    // ChargingStation
    const chargingStation = {
      id: STATION_ID,
      ocppConnectionName: STATION_NAME,
      isOnline: false,
      protocol: 'ocpp2.0.1',
      chargePointVendor: 'CitrineOS',
      chargePointModel: 'TestStation',
      chargePointSerialNumber: 'CP001-SN-001',
      chargeBoxSerialNumber: 'CB001-SN-001',
      firmwareVersion: '1.0.0',
      meterType: 'EnergyMeter',
      meterSerialNumber: 'EM001-SN-001',
      coordinates: JSON.stringify({
        type: 'Point',
        coordinates: [-122.4194, 37.7749],
      }),
      floorLevel: '0',
      parkingRestrictions: JSON.stringify(['EVOnly']),
      capabilities: JSON.stringify(['RFIDReader', 'CreditCardPayable']),
      locationId: LOCATION_ID,
      tenantId: TENANT_ID,
      createdAt: now,
      updatedAt: now,
    };
    await upsert(queryInterface, 'ChargingStations', chargingStation);

    // Tariff
    const tariff = {
      id: TARIFF_ID,
      currency: 'USD',
      pricePerKwh: 0.3,
      pricePerMin: 0.05,
      pricePerSession: 1.5,
      authorizationAmount: 25.0,
      paymentFee: 0.35,
      taxRate: 0.0875, // 8.75% tax rate
      tenantId: TENANT_ID,
      createdAt: now,
      updatedAt: now,
    };
    await upsert(queryInterface, 'Tariffs', tariff);

    // EVSE
    const evse = {
      id: EVSE_ID,
      stationId: STATION_ID,
      ocppConnectionName: STATION_NAME,
      evseTypeId: 1,
      evseId: 'US*TST*E123456*1', // eMI3 compliant EVSE ID format
      physicalReference: 'EVSE-001-PHYSICAL',
      removed: false,
      tenantId: TENANT_ID,
      createdAt: now,
      updatedAt: now,
    };
    await upsert(queryInterface, 'Evses', evse);

    // Connector
    const connector = {
      id: CONNECTOR_ID,
      stationId: STATION_ID,
      ocppConnectionName: STATION_NAME,
      evseId: EVSE_ID,
      connectorId: 1,
      evseTypeConnectorId: 1,
      status: 'Available',
      type: 'IEC62196T2COMBO',
      format: 'Socket',
      powerType: 'AC3Phase',
      maximumAmperage: 32,
      maximumVoltage: 400,
      maximumPowerWatts: 22000,
      errorCode: 'NoError',
      timestamp: now,
      info: 'Test connector for CP001',
      vendorId: 'CitrineOS',
      termsAndConditionsUrl: 'https://citrineos.com/terms',
      tariffId: TARIFF_ID,
      tenantId: TENANT_ID,
      createdAt: now,
      updatedAt: now,
    };
    await upsert(queryInterface, 'Connectors', connector);

    // Authorization with Real-Time Auth enabled
    const authorization = {
      id: AUTHORIZATION_ID,
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
      additionalInfo: JSON.stringify([
        {
          additionalIdToken: 'USTSTC012345678',
          type: 'eMAID',
        },
        {
          additionalIdToken: 'CitrineOS',
          type: 'issuer',
        },
        {
          additionalIdToken: '02345',
          type: 'visual_number',
        },
      ]),
      status: 'Accepted',
      chargingPriority: 1,
      language1: 'en',
      realTimeAuth: 'AllowedOffline',
      realTimeAuthUrl: 'http://citrineos-ocpi:8085/ocpi/2.2.1/tokens/realTimeAuth',
      concurrentTransaction: false,
      tenantId: TENANT_ID,
      tenantPartnerId: TENANT_PARTNER_ID,
      createdAt: now,
      updatedAt: now,
    };
    await upsert(queryInterface, 'Authorizations', authorization);
  },

  down: async (queryInterface: QueryInterface) => {
    // Delete in reverse order to respect foreign key constraints.
    await queryInterface.bulkDelete('Authorizations', { id: AUTHORIZATION_ID }, {} as QueryOptions);
    await queryInterface.bulkDelete('Connectors', { id: CONNECTOR_ID }, {} as QueryOptions);
    await queryInterface.bulkDelete('Evses', { id: EVSE_ID }, {} as QueryOptions);
    await queryInterface.bulkDelete('Tariffs', { id: TARIFF_ID }, {} as QueryOptions);

    // The ChargingStation (and the Location it belongs to) may have accumulated
    // live data once a real charger connected with this ocppConnectionName — e.g.
    // OCPPMessages / StatusNotifications / VariableAttributes that reference it via
    // ON DELETE SET NULL. Deleting the station then cascades a `SET "stationId" =
    // NULL` onto those rows, which trips the `populate_station_id` BEFORE UPDATE
    // trigger (it tries to re-resolve the now-deleted station and raises). That is
    // expected: a seed-undo should not force-delete a station that is in live use.
    // Treat such conflicts as a no-op so the rest of the undo still succeeds.
    await tryDelete(queryInterface, 'ChargingStations', { id: STATION_ID });
    await tryDelete(queryInterface, 'Locations', { id: LOCATION_ID });
  },
};
