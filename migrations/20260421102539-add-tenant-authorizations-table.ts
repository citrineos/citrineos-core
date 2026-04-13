// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "AuthorizationTenants" (
        "id"              SERIAL        PRIMARY KEY,
        "authorizationId" INTEGER       NOT NULL REFERENCES "Authorizations"("id") ON DELETE CASCADE,
        "tenantId"        INTEGER       NOT NULL REFERENCES "Tenants"("id") ON DELETE CASCADE,
        "createdAt"       TIMESTAMPTZ   DEFAULT NOW(),
        "updatedAt"       TIMESTAMPTZ   DEFAULT NOW(),

        UNIQUE ("authorizationId", "tenantId")
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_authorization_tenants_authorization_id"
      ON "AuthorizationTenants" ("authorizationId");
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_authorization_tenants_tenant_id"
      ON "AuthorizationTenants" ("tenantId");
    `);

    /* Migrate existing single-tenant associations to the new junction table */
    await queryInterface.sequelize.query(`
      INSERT INTO "AuthorizationTenants" ("authorizationId", "tenantId", "createdAt", "updatedAt")
      SELECT "id", "tenantId", NOW(), NOW()
      FROM "Authorizations"
      WHERE "tenantId" IS NOT NULL
      ON CONFLICT DO NOTHING;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Authorizations"
      DROP COLUMN IF EXISTS "tenantId";
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    /* Restore the tenantId column on Authorizations */
    await queryInterface.sequelize.query(`
      ALTER TABLE "Authorizations"
      ADD COLUMN IF NOT EXISTS "tenantId" INTEGER REFERENCES "Tenants"("id");
    `);

    /* Back-fill from the junction table (picks the lowest tenantId per authorization) */
    await queryInterface.sequelize.query(`
      UPDATE "Authorizations" a
      SET "tenantId" = at."tenantId"
      FROM (
        SELECT DISTINCT ON ("authorizationId") "authorizationId", "tenantId"
        FROM "AuthorizationTenants"
        ORDER BY "authorizationId", "tenantId"
      ) at
      WHERE a."id" = at."authorizationId";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_authorization_tenants_tenant_id";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_authorization_tenants_authorization_id";
    `);

    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS "AuthorizationTenants";
    `);
  },
};
