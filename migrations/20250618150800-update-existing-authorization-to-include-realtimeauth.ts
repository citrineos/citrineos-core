'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';
import { RealTimeAuthEnumType } from '@citrineos/base';
import { DataType } from 'sequelize-typescript';

const TABLE_NAME = 'Authorizations';
const COLUMN_NAME = 'realTimeAuth';

export = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable(TABLE_NAME);
    if (!tableDescription[COLUMN_NAME]) {
      await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
        type: DataType.ENUM(...Object.values(RealTimeAuthEnumType)),
        allowNull: false,
        defaultValue: RealTimeAuthEnumType.Never,
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable(TABLE_NAME);
    if (tableDescription[COLUMN_NAME]) {
      await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_${TABLE_NAME}_${COLUMN_NAME}";`,
      );
    }
  },
};
