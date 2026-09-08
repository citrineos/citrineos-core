// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const table = await queryInterface.describeTable('ServerNetworkProfiles');

    if (!table.protocols) {
      await queryInterface.addColumn('ServerNetworkProfiles', 'protocols', {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      });
    }

    // Migrate existing data: wrap the string value of 'protocol' into a single-element array
    if (table.protocol) {
      await queryInterface.sequelize.query(`
        UPDATE "ServerNetworkProfiles"
        SET    "protocols" = ARRAY["protocol"]
        WHERE  "protocol" IS NOT NULL;
      `);

      await queryInterface.removeColumn('ServerNetworkProfiles', 'protocol');
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const table = await queryInterface.describeTable('ServerNetworkProfiles');

    if (!table.protocol) {
      await queryInterface.addColumn('ServerNetworkProfiles', 'protocol', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }

    // Migrate back: take the first element of the 'protocols' array
    if (table.protocols) {
      await queryInterface.sequelize.query(`
        UPDATE "ServerNetworkProfiles"
        SET    "protocol" = "protocols"[1]
        WHERE  "protocols" IS NOT NULL
          AND  array_length("protocols", 1) > 0;
      `);

      await queryInterface.removeColumn('ServerNetworkProfiles', 'protocols');
    }
  },
};
