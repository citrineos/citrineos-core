// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Authorizations', 'isPrepaid', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Authorizations', 'prepaidBalance', {
      type: DataTypes.DECIMAL,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Authorizations', 'isPrepaid');
    await queryInterface.removeColumn('Authorizations', 'prepaidBalance');
  },
};
