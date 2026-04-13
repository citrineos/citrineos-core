// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

// The initial migration created a globally unique constraint on correlationId in
// SetNetworkProfiles, preventing different tenants from reusing the same correlation
// ID value. stationPkId already encodes tenant (it is a FK to ChargingStations(pkId),
// which is globally unique per station-tenant pair), so a composite unique on
// (stationPkId, correlationId) is sufficient to enforce per-station uniqueness.
export default {
  up: async (queryInterface: QueryInterface) => {
    console.log('Dropping global unique constraint on SetNetworkProfiles.correlationId...');

    // Drop both the inline constraint name and the explicitly-named index to cover
    // whichever form exists in this environment.
    await queryInterface.sequelize.query(
      `ALTER TABLE "SetNetworkProfiles" DROP CONSTRAINT IF EXISTS "SetNetworkProfiles_correlationId_key"`,
    );
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "set_network_profiles_correlation_id"`,
    );

    console.log('Creating per-station unique index on (stationPkId, correlationId)...');
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "set_network_profiles_stationPkId_correlationId"
        ON "SetNetworkProfiles" ("stationPkId", "correlationId")
    `);

    console.log('Successfully updated SetNetworkProfiles correlationId uniqueness constraint.');
  },

  down: async (queryInterface: QueryInterface) => {
    console.log('Dropping per-station correlationId index from SetNetworkProfiles...');

    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "set_network_profiles_stationPkId_correlationId"`,
    );

    console.log('Restoring global unique constraint on correlationId...');
    await queryInterface.sequelize.query(
      `ALTER TABLE "SetNetworkProfiles" ADD CONSTRAINT "SetNetworkProfiles_correlationId_key" UNIQUE ("correlationId")`,
    );

    console.log('Successfully restored original SetNetworkProfiles correlationId constraint.');
  },
};
