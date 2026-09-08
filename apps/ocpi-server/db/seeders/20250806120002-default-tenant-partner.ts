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
    const partnerProfileOCPI = {
      roles: [
        {
          role: 'EMSP',
          businessDetails: {
            logo: {
              url: 'https://www.test-mobility.com/assets/brand/logo.svg',
              type: 'svg',
              width: 150,
              height: 60,
              category: 'OPERATOR',
            },
            name: 'TestMobilitySolutions',
            website: 'https://www.test-mobility.com',
          },
        },
      ],
      version: {
        version: '2.2.1',
        versionDetailsUrl: 'http://host.docker.internal:8083/ocpi/versions/2.2.1',
      },
      endpoints: [
        {
          url: 'http://host.docker.internal:8083/ocpi/2.2.1/credentials',
          identifier: 'credentials',
        },
        {
          url: 'http://host.docker.internal:8083/ocpi/2.2.1/emsp/locations',
          identifier: 'locations_RECEIVER',
        },
        {
          url: 'http://host.docker.internal:8083/ocpi/2.2.1/emsp/tariffs',
          identifier: 'tariffs_RECEIVER',
        },
        {
          url: 'http://host.docker.internal:8083/ocpi/2.2.1/emsp/sessions',
          identifier: 'sessions_RECEIVER',
        },
        {
          url: 'http://host.docker.internal:8083/ocpi/2.2.1/emsp/cdrs',
          identifier: 'cdrs_RECEIVER',
        },
        {
          url: 'http://host.docker.internal:8083/ocpi/2.2.1/emsp/tokens',
          identifier: 'tokens_SENDER',
        },
        {
          url: 'http://host.docker.internal:8083/ocpi/2.2.1/emsp/commands',
          identifier: 'commands_SENDER',
        },
        {
          url: 'http://host.docker.internal:8083/ocpi/2.2.1/emsp/chargingprofiles',
          identifier: 'chargingprofiles_RECEIVER',
        },
      ],
      credentials: {
        token: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
        versionsUrl: 'https://our-server.citrineos.com/ocpi/versions',
      },
      serverCredentials: {
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9eyJzdWIiOiJwYXJ0bmVyIn0',
        versionsUrl: 'http://host.docker.internal:8083/ocpi/versions',
      },
    };

    const tenantPartner = {
      id: 1,
      tenantId: 1,
      partyId: 'TST',
      countryCode: 'US',
      partnerProfileOCPI: JSON.stringify(partnerProfileOCPI),
      createdAt: new Date('2025-08-07T17:55:00+00:00'),
      updatedAt: new Date(),
    };

    await upsert(queryInterface, 'TenantPartners', tenantPartner);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('TenantPartners', { id: 1 }, {} as QueryOptions);
  },
};
