// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Locations"
      ADD COLUMN IF NOT EXISTS "disableOCPI" BOOLEAN DEFAULT FALSE;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Locations"
      DROP COLUMN IF EXISTS "disableOCPI";
    `);
  },
};
