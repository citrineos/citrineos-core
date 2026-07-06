// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Add isUserTenant column
    await queryInterface.addColumn('Tenants', 'isUserTenant', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if this tenant is a user tenant',
    });

    // Make url, partyId, countryCode optional
    await queryInterface.changeColumn('Tenants', 'url', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('Tenants', 'partyId', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('Tenants', 'countryCode', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Tenants', 'isUserTenant');

    await queryInterface.changeColumn('Tenants', 'url', {
      type: DataTypes.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('Tenants', 'partyId', {
      type: DataTypes.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('Tenants', 'countryCode', {
      type: DataTypes.STRING,
      allowNull: false,
    });
  },
};
