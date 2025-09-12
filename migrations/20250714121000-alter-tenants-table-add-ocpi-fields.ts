// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DataTypes, QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Tenants', 'partyId', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    });
    await queryInterface.addColumn('Tenants', 'countryCode', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'US',
    });
    await queryInterface.addColumn('Tenants', 'url', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Tenants', 'serverProfileOCPI', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Tenants', 'partyId');
    await queryInterface.removeColumn('Tenants', 'countryCode');
    await queryInterface.removeColumn('Tenants', 'url');
    await queryInterface.removeColumn('Tenants', 'serverProfileOCPI');
  },
};
