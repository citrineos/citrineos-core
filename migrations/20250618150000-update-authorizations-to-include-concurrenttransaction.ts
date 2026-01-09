// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';
import { DataType } from 'sequelize-typescript';

const TABLE_NAME = 'Authorizations';
const COLUMN_NAME = 'concurrentTransaction';

export default {
  up: async (queryInterface: QueryInterface) => {
    const migrationName = '20250618150000-update-authorizations-to-include-concurrenttransaction';

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

    const tableDescription = await queryInterface.describeTable(TABLE_NAME);
    if (!tableDescription[COLUMN_NAME]) {
      await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
        type: DataType.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable(TABLE_NAME);
    if (tableDescription[COLUMN_NAME]) {
      await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
    }
  },
};
