// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Tariffs', 'tariffId', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'validFrom', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'description', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'energy', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'chargingTime', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'idleTime', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'fixedFee', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'reservationTime', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'reservationFixed', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'minCost', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'maxCost', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Tariffs', 'tariffId');
    await queryInterface.removeColumn('Tariffs', 'validFrom');
    await queryInterface.removeColumn('Tariffs', 'description');
    await queryInterface.removeColumn('Tariffs', 'energy');
    await queryInterface.removeColumn('Tariffs', 'chargingTime');
    await queryInterface.removeColumn('Tariffs', 'idleTime');
    await queryInterface.removeColumn('Tariffs', 'fixedFee');
    await queryInterface.removeColumn('Tariffs', 'reservationTime');
    await queryInterface.removeColumn('Tariffs', 'reservationFixed');
    await queryInterface.removeColumn('Tariffs', 'minCost');
    await queryInterface.removeColumn('Tariffs', 'maxCost');
  },
};
