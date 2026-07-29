// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // The websocket server (ServerNetworkProfile) a station is currently connected on. Set on
    // connection open, cleared on close. Lets the operator UI show the connected station's server.
    await queryInterface.addColumn('ChargingStations', 'connectedWebsocketServerConfigId', {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'ServerNetworkProfiles',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('ChargingStations', 'connectedWebsocketServerConfigId');
  },
};
