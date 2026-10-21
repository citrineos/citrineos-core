// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

// "MeterValues" is partitioned; altering the parent alters every partition with it.
const TABLE_NAMES = ['Authorizations', 'LocalListAuthorizations', 'MeterValues'];

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of TABLE_NAMES) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "customData"`,
          { transaction, type: QueryTypes.RAW },
        );
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of TABLE_NAMES) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "customData" jsonb`,
          { transaction, type: QueryTypes.RAW },
        );
      }
    });
  },
};
