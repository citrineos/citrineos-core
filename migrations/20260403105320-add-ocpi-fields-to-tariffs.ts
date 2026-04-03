// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
      ADD COLUMN IF NOT EXISTS "tariffType"    VARCHAR(36),
      ADD COLUMN IF NOT EXISTS "tariffAltUrl"  TEXT,
      ADD COLUMN IF NOT EXISTS "minPrice"      JSONB,
      ADD COLUMN IF NOT EXISTS "maxPrice"      JSONB,
      ADD COLUMN IF NOT EXISTS "energyMix"     JSONB,
      ADD COLUMN IF NOT EXISTS "startDateTime" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "endDateTime"   TIMESTAMP WITH TIME ZONE;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
      DROP COLUMN IF EXISTS "tariffType",
      DROP COLUMN IF EXISTS "tariffAltUrl",
      DROP COLUMN IF EXISTS "minPrice",
      DROP COLUMN IF EXISTS "maxPrice",
      DROP COLUMN IF EXISTS "energyMix",
      DROP COLUMN IF EXISTS "startDateTime",
      DROP COLUMN IF EXISTS "endDateTime";
    `);
  },
};
