// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

const TABLE_NAME = 'Connectors';

export = {
  up: async (queryInterface: QueryInterface) => {
    // Drop the unique constraint on stationId_connectorId
    await queryInterface.removeConstraint(TABLE_NAME, 'stationId_connectorId');

    console.log('Removed stationId_connectorId unique constraint and made connectorId nullable');
  },

  down: async (queryInterface: QueryInterface) => {
    // Re-add the unique constraint
    await queryInterface.addConstraint(TABLE_NAME, {
      fields: ['stationId', 'connectorId'],
      type: 'unique',
      name: 'stationId_connectorId',
    });

    console.log(
      'Restored stationId_connectorId unique constraint and made connectorId not nullable',
    );
  },
};
