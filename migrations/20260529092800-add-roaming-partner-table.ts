// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "RoamingPartners" (
        "id"              SERIAL      PRIMARY KEY,
        "countryCode"     VARCHAR(2)  NOT NULL,
        "partyId"         VARCHAR(3)  NOT NULL,
        "tenantPartnerId" INTEGER     NOT NULL REFERENCES "TenantPartners"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("countryCode", "partyId", "tenantPartnerId")
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_roaming_partners_tenant_partner_id"
      ON "RoamingPartners" ("tenantPartnerId");
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_roaming_partners_tenant_partner_id";
    `);

    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS "RoamingPartners";
    `);
  },
};
