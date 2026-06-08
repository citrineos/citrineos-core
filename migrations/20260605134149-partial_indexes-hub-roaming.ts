// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // =========================================================
    // Tariffs
    // =========================================================
    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
      DROP CONSTRAINT IF EXISTS "Tariffs_ocpiTariffId_tenantPartnerId_key";
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Tariffs_ocpiTariffId_tenantPartnerId_key"
      ON "Tariffs" ("ocpiTariffId", "tenantPartnerId")
      WHERE "roamingPartnerId" IS NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Tariffs_ocpiTariffId_tenantPartnerId_roamingPartnerId_key"
      ON "Tariffs" ("ocpiTariffId", "tenantPartnerId", "roamingPartnerId")
      WHERE "roamingPartnerId" IS NOT NULL;
    `);

    // =========================================================
    // Sessions
    // =========================================================
    await queryInterface.sequelize.query(`
      ALTER TABLE "Sessions"
      DROP CONSTRAINT IF EXISTS "Sessions_countryCode_partyId_ocpiSessionId_tenantPartnerId_key";
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Sessions_ocpiSessionId_tenantPartnerId_key"
      ON "Sessions" ("ocpiSessionId", "tenantPartnerId")
      WHERE "roamingPartnerId" IS NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Sessions_ocpiSessionId_tenantPartnerId_roamingPartnerId_key"
      ON "Sessions" ("ocpiSessionId", "tenantPartnerId", "roamingPartnerId")
      WHERE "roamingPartnerId" IS NOT NULL;
    `);

    // =========================================================
    // Cdrs
    // =========================================================
    await queryInterface.sequelize.query(`
      ALTER TABLE "Cdrs"
      DROP CONSTRAINT IF EXISTS "cdrs_countrycode_partyid_ocpicdrid_tenantpartnerid_key";
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Cdrs_ocpiCdrId_tenantPartnerId_key"
      ON "Cdrs" ("ocpiCdrId", "tenantPartnerId")
      WHERE "roamingPartnerId" IS NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Cdrs_ocpiCdrId_tenantPartnerId_roamingPartnerId_key"
      ON "Cdrs" ("ocpiCdrId", "tenantPartnerId", "roamingPartnerId")
      WHERE "roamingPartnerId" IS NOT NULL;
    `);

    // =========================================================
    // Locations
    // =========================================================
    await queryInterface.sequelize.query(`
      ALTER TABLE "Locations"
      DROP CONSTRAINT IF EXISTS "locations_ocpi_id_partner_unique";
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "locations_ocpi_id_partner_unique"
      ON "Locations" ("ocpiId", "ownerTenantPartnerId")
      WHERE "roamingPartnerId" IS NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "locations_ocpi_id_partner_roaming_unique"
      ON "Locations" ("ocpiId", "ownerTenantPartnerId", "roamingPartnerId")
      WHERE "roamingPartnerId" IS NOT NULL;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    // =========================================================
    // Locations
    // =========================================================
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "locations_ocpi_id_partner_roaming_unique";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "locations_ocpi_id_partner_unique";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Locations"
      ADD CONSTRAINT "locations_ocpi_id_partner_unique"
      UNIQUE ("ocpiId", "ownerTenantPartnerId");
    `);

    // =========================================================
    // Cdrs
    // =========================================================
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "Cdrs_ocpiCdrId_tenantPartnerId_roamingPartnerId_key";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "Cdrs_ocpiCdrId_tenantPartnerId_key";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Cdrs"
      ADD CONSTRAINT "cdrs_countrycode_partyid_ocpicdrid_tenantpartnerid_key"
      UNIQUE ("countryCode", "partyId", "ocpiCdrId", "tenantPartnerId");
    `);

    // =========================================================
    // Sessions
    // =========================================================
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "Sessions_ocpiSessionId_tenantPartnerId_roamingPartnerId_key";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "Sessions_ocpiSessionId_tenantPartnerId_key";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Sessions"
      ADD CONSTRAINT "Sessions_countryCode_partyId_ocpiSessionId_tenantPartnerId_key"
      UNIQUE ("countryCode", "partyId", "ocpiSessionId", "tenantPartnerId");
    `);

    // =========================================================
    // Tariffs
    // =========================================================
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "Tariffs_ocpiTariffId_tenantPartnerId_roamingPartnerId_key";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "Tariffs_ocpiTariffId_tenantPartnerId_key";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
      ADD CONSTRAINT "Tariffs_ocpiTariffId_tenantPartnerId_key"
      UNIQUE ("ocpiTariffId", "tenantPartnerId");
    `);
  },
};
