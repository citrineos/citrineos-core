// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('ChargingSchedules', 'salesTariffId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'SalesTariffs',
        key: 'databaseId',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('ChargingSchedules', 'salesTariffId');
  },
};
