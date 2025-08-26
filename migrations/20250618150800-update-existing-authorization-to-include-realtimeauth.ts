'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';
import { AuthorizationWhitelistType } from '@citrineos/base';
import { DataType } from 'sequelize-typescript';

const TABLE_NAME = 'Authorizations';
const COLUMNS = [
  {
    name: 'realTimeAuth',
    attributes: {
      type: DataType.ENUM(...Object.values(AuthorizationWhitelistType)),
      allowNull: false,
      defaultValue: AuthorizationWhitelistType.Never,
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
