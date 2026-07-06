// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    console.log('Creating citext extension if not exists...');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS citext;');

    console.log('Changing column to use CITEXT type...');
    await queryInterface.changeColumn('Authorizations', 'idToken', {
      type: DataTypes.CITEXT,
      allowNull: false,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn('Authorizations', 'idToken', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    // Note: Not dropping the extension in case other tables use it
  },
};
