// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { AuthorizationWhitelistEnum } from '@citrineos/base';
import { QueryInterface, QueryTypes } from 'sequelize';
import { DataType } from 'sequelize-typescript';

const TABLE_NAME = 'Authorizations';
const COLUMNS = [
  {
    name: 'realTimeAuth',
    attributes: {
      type: DataType.STRING,
      allowNull: false,
      defaultValue: AuthorizationWhitelistEnum.Never,
    },
  },
  {
    name: 'realTimeAuthUrl',
    attributes: {
      type: DataType.STRING,
      allowNull: true,
    },
  },
];

export default {
  up: async (queryInterface: QueryInterface) => {
    const migrationName = '20250618150800-update-existing-authorization-to-include-realtimeauth';

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
    for (const column of COLUMNS) {
      if (!tableDescription[column.name]) {
        await queryInterface.addColumn(TABLE_NAME, column.name, column.attributes);
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable(TABLE_NAME);
    for (const column of COLUMNS) {
      if (tableDescription[column.name]) {
        await queryInterface.removeColumn(TABLE_NAME, column.name);
      }
    }
  },
};
