// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { DataTypes, QueryInterface } from 'sequelize';

/**
 * "ChargingStations"."lastConnectedAt", written in the same update that marks a station online.
 * Rows are left null: no earlier connect time is recorded anywhere to backfill from.
 * @type {import('sequelize-cli').Migration}
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('ChargingStations', 'lastConnectedAt', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('ChargingStations', 'lastConnectedAt');
  },
};
