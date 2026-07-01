// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(`
      ALTER TABLE "ConnectorTariffs"
        ALTER COLUMN "tenantPartnerId" DROP NOT NULL;

      ALTER TABLE "ConnectorTariffs"
        DROP CONSTRAINT IF EXISTS "connector_tariffs_unique";

      CREATE UNIQUE INDEX IF NOT EXISTS connector_tariffs_own_unique
        ON "ConnectorTariffs" ("connectorId", "tariffId")
        WHERE "tenantPartnerId" IS NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS connector_tariffs_partner_unique
        ON "ConnectorTariffs" ("connectorId", "tariffId", "tenantPartnerId")
        WHERE "tenantPartnerId" IS NOT NULL;
    `);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS connector_tariffs_own_unique;
      DROP INDEX IF EXISTS connector_tariffs_partner_unique;

      -- Only safe if no rows have tenantPartnerId IS NULL
      ALTER TABLE "ConnectorTariffs"
        ALTER COLUMN "tenantPartnerId" SET NOT NULL;

      ALTER TABLE "ConnectorTariffs"
        ADD CONSTRAINT connector_tariffs_unique
        UNIQUE ("connectorId", "tariffId", "tenantPartnerId");
    `);
  },
};
