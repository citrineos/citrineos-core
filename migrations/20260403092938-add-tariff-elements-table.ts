// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('TariffElements')) {
      await queryInterface.createTable('TariffElements', {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        tariffId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'Tariffs',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        priceComponents: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        restrictions: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });

      await queryInterface.addIndex('TariffElements', ['tariffId'], {
        name: 'idx_tariff_elements_tariff_id',
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('TariffElements')) {
      await queryInterface.dropTable('TariffElements');
    }
  },
};
