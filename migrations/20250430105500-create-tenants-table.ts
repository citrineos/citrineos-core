// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

const TENANTS_TABLE = `Tenants`;

export default {
  up: async (queryInterface: QueryInterface) => {
    const migrationName = '20250430105500-create-tenants-table';

    const [results] = await queryInterface.sequelize.query(
      `SELECT EXISTS (
      SELECT 1 
      FROM "SequelizeMeta" 
      WHERE name LIKE :pattern
    ) AS migration_exists`,
      {
        replacements: { pattern: `${migrationName}%` },
        type: QueryTypes.SELECT,
      },
    );

    if ((results as any).migration_exists) {
      console.log('Migration already run, skipping...');
      return;
    }

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
