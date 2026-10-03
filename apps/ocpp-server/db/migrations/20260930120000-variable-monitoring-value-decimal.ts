// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

const TABLE_NAME = 'VariableMonitorings';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn(TABLE_NAME, 'value', {
      type: DataTypes.DECIMAL,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE "${TABLE_NAME}" ALTER COLUMN "value" TYPE integer USING round("value")::integer`,
      { type: QueryTypes.RAW },
    );
  },
};
