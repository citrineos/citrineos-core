// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Locations"
        ADD COLUMN IF NOT EXISTS "roamingPartnerId" INTEGER
        REFERENCES "RoamingPartners"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Authorizations"
        ADD COLUMN IF NOT EXISTS "roamingPartnerId" INTEGER
        REFERENCES "RoamingPartners"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Cdrs"
        ADD COLUMN IF NOT EXISTS "roamingPartnerId" INTEGER
        REFERENCES "RoamingPartners"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
        ADD COLUMN IF NOT EXISTS "roamingPartnerId" INTEGER
        REFERENCES "RoamingPartners"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Sessions"
        ADD COLUMN IF NOT EXISTS "roamingPartnerId" INTEGER
        REFERENCES "RoamingPartners"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Sessions" DROP COLUMN IF EXISTS "roamingPartnerId";
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs" DROP COLUMN IF EXISTS "roamingPartnerId";
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Cdrs" DROP COLUMN IF EXISTS "roamingPartnerId";
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "roamingPartnerId";
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Locations" DROP COLUMN IF EXISTS "roamingPartnerId";
    `);
  },
};
