// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Change tenantId to allow null in ServerNetworkProfiles
    await queryInterface.changeColumn('ServerNetworkProfiles', 'tenantId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Rollback: change tenantId back to not allow null
    await queryInterface.changeColumn('ServerNetworkProfiles', 'tenantId', {
      type: DataTypes.INTEGER,
      allowNull: false,
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },
};
