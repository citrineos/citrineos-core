// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS "AuthorizationTenants" (
          "id"              SERIAL        PRIMARY KEY,
          "authorizationId" INTEGER       NOT NULL REFERENCES "Authorizations"("id") ON DELETE CASCADE,
          "tenantId"        INTEGER       NOT NULL REFERENCES "Tenants"("id") ON DELETE CASCADE,
          "createdAt"       TIMESTAMPTZ   DEFAULT NOW(),
          "updatedAt"       TIMESTAMPTZ   DEFAULT NOW(),
          UNIQUE ("authorizationId", "tenantId")
        );
      `,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
        INSERT INTO "AuthorizationTenants" ("authorizationId", "tenantId", "createdAt", "updatedAt")
        SELECT "id", "tenantId", NOW(), NOW()
        FROM "Authorizations"
        WHERE "tenantId" IS NOT NULL
        ON CONFLICT DO NOTHING;
      `,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM "Authorizations" a
            WHERE NOT EXISTS (
              SELECT 1 FROM "AuthorizationTenants" at
              WHERE at."authorizationId" = a."id"
            )
          ) THEN
            RAISE EXCEPTION 'Orphaned Authorizations detected — migration aborted';
          END IF;
        END $$;
      `,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Authorizations"
        DROP COLUMN IF EXISTS "tenantId";
      `,
        { transaction: t },
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Authorizations"
        ADD COLUMN IF NOT EXISTS "tenantId" INTEGER REFERENCES "Tenants"("id");
      `,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Authorizations" a
        SET "tenantId" = at."tenantId"
        FROM (
          SELECT DISTINCT ON ("authorizationId") "authorizationId", "tenantId"
          FROM "AuthorizationTenants"
          ORDER BY "authorizationId", "tenantId"
        ) at
        WHERE a."id" = at."authorizationId";
      `,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
        DROP TABLE IF EXISTS "AuthorizationTenants";
      `,
        { transaction: t },
      );
    });
  },
};
