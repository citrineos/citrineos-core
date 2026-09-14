// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

const TABLE_NAME = 'CompositeSchedules';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn(TABLE_NAME, 'evseId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      `UPDATE "${TABLE_NAME}" cs
          SET "evseId" = e."id"
         FROM "Evses" e
        WHERE e."ocppConnectionName" = cs."ocppConnectionName"
          AND e."tenantId" = cs."tenantId"
          AND e."evseTypeId" = cs."evseId"`,
      { type: QueryTypes.RAW },
    );

    await queryInterface.sequelize.query(
      `UPDATE "${TABLE_NAME}" cs
          SET "evseId" = NULL
        WHERE cs."evseId" IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM "Evses" e WHERE e."id" = cs."evseId")`,
      { type: QueryTypes.RAW },
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      `UPDATE "${TABLE_NAME}" SET "evseId" = 0 WHERE "evseId" IS NULL`,
      {
        type: QueryTypes.RAW,
      },
    );

    await queryInterface.changeColumn(TABLE_NAME, 'evseId', {
      type: DataTypes.INTEGER,
      allowNull: false,
    });
  },
};
