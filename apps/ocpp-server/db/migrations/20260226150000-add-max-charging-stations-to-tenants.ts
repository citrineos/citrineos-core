// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Check if columns already exist
    const table = await queryInterface.describeTable('Tenants');

    // Add maxChargingStations column if it doesn't exist
    if (!table.maxChargingStations) {
      await queryInterface.addColumn('Tenants', 'maxChargingStations', {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum number of charging stations allowed for this tenant',
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // Rollback: remove the column
    await queryInterface.removeColumn('Tenants', 'maxChargingStations');
  },
};
