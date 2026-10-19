// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { DataTypes, QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'StatusNotifications',
        'connectorDatabaseId',
        {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'Connectors',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addIndex('StatusNotifications', ['connectorDatabaseId'], {
        name: 'status_notifications_connector_database_id',
        transaction,
      });
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('StatusNotifications', 'connectorDatabaseId');
  },
};
