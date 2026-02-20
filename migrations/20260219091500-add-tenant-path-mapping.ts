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

    // Add tenantPathMapping column if it doesn't exist
    if (!table.tenantPathMapping) {
      await queryInterface.addColumn('ServerNetworkProfiles', 'tenantPathMapping', {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Mapping of URL path segments to tenant IDs',
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // Rollback: remove the column
    await queryInterface.removeColumn('ServerNetworkProfiles', 'tenantPathMapping');
  },
};
