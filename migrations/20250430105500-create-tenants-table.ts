'use strict';

import { Tenant } from '@citrineos/data';
/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

const TENANTS_TABLE = `${Tenant.MODEL_NAME}s`;

export = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable(TENANTS_TABLE, {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
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
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable(TENANTS_TABLE);
  },
};
