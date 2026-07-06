// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { AuthorizationWhitelistEnum } from '@citrineos/base';
import { DataTypes, QueryInterface } from 'sequelize';

const TABLE_NAME = 'Authorizations';
const COLUMN_NAME = 'realTimeAuth';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn(TABLE_NAME, COLUMN_NAME, {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      `ALTER TABLE "${TABLE_NAME}" ALTER COLUMN "${COLUMN_NAME}" DROP DEFAULT`,
    );
  },

  down: async (queryInterface: QueryInterface) => {
    // Restore the original NOT NULL column with a default of 'Never'.
    await queryInterface.sequelize.query(
      `UPDATE "${TABLE_NAME}" SET "${COLUMN_NAME}" = '${AuthorizationWhitelistEnum.Never}' WHERE "${COLUMN_NAME}" IS NULL`,
    );
    await queryInterface.changeColumn(TABLE_NAME, COLUMN_NAME, {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: AuthorizationWhitelistEnum.Never,
    });
  },
};
