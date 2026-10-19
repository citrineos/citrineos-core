// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { DataTypes, QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Connectors', 'latestStatusNotificationId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'StatusNotifications',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Connectors', 'latestStatusNotificationId');
  },
};
