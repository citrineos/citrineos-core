// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable('Connectors');

    if (!tableDescription.ocpiId) {
      await queryInterface.addColumn('Connectors', 'ocpiId', {
        type: DataTypes.STRING(36),
        allowNull: true,
      });
    }

    // Add unique constraint on (ocpiId, evseId) — required by Hasura on_conflict
    await queryInterface.addConstraint('Connectors', {
      fields: ['ocpiId', 'evseId'],
      type: 'unique',
      name: 'connectors_ocpi_id_evse_unique',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint('Connectors', 'connectors_ocpi_id_evse_unique');

    const tableDescription = await queryInterface.describeTable('Connectors');

    if (tableDescription.ocpiId) await queryInterface.removeColumn('Connectors', 'ocpiId');
  },
};
