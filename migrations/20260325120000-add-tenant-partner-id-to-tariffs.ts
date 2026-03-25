// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
      ADD COLUMN IF NOT EXISTS "tenantPartnerId" INTEGER
      REFERENCES "TenantPartners"("id") ON DELETE SET NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_tariffs_tenant_partner_id"
      ON "Tariffs" ("tenantPartnerId");
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_tariffs_tenant_partner_id";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Tariffs"
      DROP COLUMN IF EXISTS "tenantPartnerId";
    `);
  },
};
