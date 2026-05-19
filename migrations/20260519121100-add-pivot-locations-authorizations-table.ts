// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS "AuthorizationLocations" (
          "id"              SERIAL        PRIMARY KEY,
          "authorizationId" INTEGER       NOT NULL REFERENCES "Authorizations"("id") ON DELETE CASCADE,
          "locationId"      INTEGER       NOT NULL REFERENCES "Locations"("id") ON DELETE CASCADE,
          "createdAt"       TIMESTAMPTZ   DEFAULT NOW(),
          "updatedAt"       TIMESTAMPTZ   DEFAULT NOW(),
          UNIQUE ("authorizationId", "locationId")
        );
      `,
      );
      await queryInterface.sequelize.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_authorization_locations_authorization_id"
        ON "AuthorizationLocations" ("authorizationId");
      `);
  
      await queryInterface.sequelize.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_authorization_locations_location_id"
        ON "AuthorizationLocations" ("locationId");
      `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      `
      DROP TABLE IF EXISTS "AuthorizationLocations";
      `,
    );
    await queryInterface.sequelize.query(`
      DROP INDEX CONCURRENTLY IF EXISTS "idx_authorization_locations_authorization_id";
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX CONCURRENTLY IF EXISTS "idx_authorization_locations_location_id";
    `);
  },
};
