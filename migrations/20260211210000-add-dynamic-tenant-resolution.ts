// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Check if columns already exist
    const table = await queryInterface.describeTable('ServerNetworkProfiles');

    // Add dynamicTenantResolution column if it doesn't exist
    if (!table.dynamicTenantResolution) {
      await queryInterface.addColumn('ServerNetworkProfiles', 'dynamicTenantResolution', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Enable dynamic tenant resolution at WebSocket upgrade time',
      });
    }

    // Add maxConnectionsPerTenant column if it doesn't exist
    if (!table.maxConnectionsPerTenant) {
      await queryInterface.addColumn('ServerNetworkProfiles', 'maxConnectionsPerTenant', {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum number of concurrent connections allowed per tenant',
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // Rollback: remove the columns
    await queryInterface.removeColumn('ServerNetworkProfiles', 'dynamicTenantResolution');
    await queryInterface.removeColumn('ServerNetworkProfiles', 'maxConnectionsPerTenant');
  },
};
