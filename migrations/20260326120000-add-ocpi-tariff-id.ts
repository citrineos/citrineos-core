// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
      ADD COLUMN IF NOT EXISTS "ocpiTariffId" VARCHAR(36);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
      ADD CONSTRAINT "Tariffs_ocpiTariffId_tenantPartnerId_key"
      UNIQUE ("ocpiTariffId", "tenantPartnerId");
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_tariffs_ocpi_tariff_id"
      ON "Tariffs" ("ocpiTariffId");
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_tariffs_ocpi_tariff_id";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
      DROP CONSTRAINT IF EXISTS "Tariffs_ocpiTariffId_tenantPartnerId_key";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
      DROP COLUMN IF EXISTS "ocpiTariffId";
    `);
  },
};
