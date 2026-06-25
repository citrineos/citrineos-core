// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

const TABLE_NAME = 'Authorizations';
const COLUMN_NAME = 'allowedChargingStations';

// Kabisa per-token station scope (Tags & Operations): an allow-list of charging
// stations a token may authorize at. The Authorization model declares this
// column, so under DB_STRATEGY=migrate (sync/alter off) it must be created here
// or every Authorization query fails on the missing column. Empty/null = no
// restriction; enforced online by KabisaScopeAuthorizer.
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  },
};
