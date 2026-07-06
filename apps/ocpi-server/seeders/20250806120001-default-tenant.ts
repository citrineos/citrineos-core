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

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    const serverProfileOCPI = {
      versionDetails: [
        {
          version: '2.2.1',
          versionDetailsUrl: 'http://localhost:8085/ocpi/versions/1/2.2.1',
        },
      ],
      versionEndpoints: {
        '2.2.1': [
          {
            url: `http://localhost:8085/ocpi/2.2.1/credentials`,
            identifier: 'credentials',
          },
          {
            url: `http://localhost:8085/ocpi/2.2.1/locations`,
            identifier: 'locations_SENDER',
          },
          {
            url: `http://localhost:8085/ocpi/2.2.1/tariffs`,
            identifier: 'tariffs_SENDER',
          },
          {
            url: `http://localhost:8085/ocpi/2.2.1/sessions`,
            identifier: 'sessions_SENDER',
          },
          {
            url: `http://localhost:8085/ocpi/2.2.1/cdrs`,
            identifier: 'cdrs_SENDER',
          },
          {
            url: `http://localhost:8085/ocpi/2.2.1/tokens`,
            identifier: 'tokens_RECEIVER',
          },
          {
            url: `http://localhost:8085/ocpi/2.2.1/commands`,
            identifier: 'commands_RECEIVER',
          },
        ],
      },
      credentialsRole: {
        role: 'CPO',
        businessDetails: {
          logo: {
            url: 'https://citrineos.github.io/latest/assets/img/Icon.svg',
            type: 'svg',
            width: 200,
            height: 80,
            category: 'OPERATOR',
          },
          name: 'CitrineOSElectricVehicleSolutions',
          website: 'https://citrineos.github.io',
        },
      },
    };

    const tenant = {
      id: 1,
      name: 'Default Tenant',
      partyId: 'S44',
      countryCode: 'US',
      serverProfileOCPI: JSON.stringify(serverProfileOCPI),
      isUserTenant: false,
      createdAt: new Date('2025-08-07T17:55:00+00:00'),
      updatedAt: new Date(),
    };

    await upsert(queryInterface, 'Tenants', tenant);
  },

  down: async (queryInterface: QueryInterface) => {
    // The default tenant (id=1) is referenced by virtually every other table
    // (Boots, ChargingStations, Authorizations, …) via RESTRICT foreign keys, so
    // it can only be removed from an otherwise-empty database. Treat a conflict as
    // a no-op rather than aborting the undo — a seed-undo should never tear down a
    // tenant that owns live data.
    try {
      await queryInterface.bulkDelete('Tenants', { id: 1 }, {} as QueryOptions);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`Skipping delete of default Tenant (id=1) — it still owns data: ${reason}`);
    }
  },
};
