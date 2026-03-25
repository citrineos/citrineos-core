// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Sessions" (
        "id" SERIAL PRIMARY KEY,
        "ocpiSessionId" VARCHAR(36) NOT NULL,
        "countryCode" VARCHAR(2) NOT NULL,
        "partyId" VARCHAR(3) NOT NULL,
        "startDateTime" TIMESTAMPTZ NOT NULL,
        "endDateTime" TIMESTAMPTZ,
        "kwh" NUMERIC NOT NULL DEFAULT 0,
        "cdrToken" JSONB NOT NULL,
        "authMethod" VARCHAR(50) NOT NULL,
        "authorizationReference" VARCHAR(36),
        "locationId" VARCHAR(36) NOT NULL,
        "evseUid" VARCHAR(36) NOT NULL,
        "connectorId" VARCHAR(36) NOT NULL,
        "meterId" VARCHAR(255),
        "currency" VARCHAR(3) NOT NULL,
        "chargingPeriods" JSONB,
        "totalCost" JSONB,
        "status" VARCHAR(20) NOT NULL,
        "lastUpdated" TIMESTAMPTZ NOT NULL,
        "tenantId" INTEGER NOT NULL REFERENCES "Tenants"("id"),
        "tenantPartnerId" INTEGER NOT NULL REFERENCES "TenantPartners"("id"),
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE("countryCode", "partyId", "ocpiSessionId", "tenantPartnerId")
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_tenant_partner_id"
      ON "Sessions" ("tenantPartnerId");
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_tenant_id"
      ON "Sessions" ("tenantId");
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_ocpi_lookup"
      ON "Sessions" ("countryCode", "partyId", "ocpiSessionId");
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_sessions_ocpi_lookup";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_sessions_tenant_id";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_sessions_tenant_partner_id";
    `);

    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS "Sessions";
    `);
  },
};
