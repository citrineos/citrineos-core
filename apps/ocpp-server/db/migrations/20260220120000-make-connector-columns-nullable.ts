// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Change evseId to allow null
    await queryInterface.changeColumn('Connectors', 'evseId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    // Change connectorId to allow null
    await queryInterface.changeColumn('Connectors', 'connectorId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    // Change evseTypeConnectorId to allow null
    await queryInterface.changeColumn('Connectors', 'evseTypeConnectorId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Rollback: change columns back to not allow null
    await queryInterface.changeColumn('Connectors', 'evseId', {
      type: DataTypes.INTEGER,
      allowNull: false,
    });

    await queryInterface.changeColumn('Connectors', 'connectorId', {
      type: DataTypes.INTEGER,
      allowNull: false,
    });

    await queryInterface.changeColumn('Connectors', 'evseTypeConnectorId', {
      type: DataTypes.INTEGER,
      allowNull: false,
    });
  },
};
