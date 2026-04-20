// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const table = await queryInterface.describeTable('ServerNetworkProfiles');
    if (table.maxConnectionsPerTenant) {
      await queryInterface.removeColumn('ServerNetworkProfiles', 'maxConnectionsPerTenant');
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // Column is intentionally not restored; per-tenant limits are now driven by Tenant.maxChargingStations
  },
};
