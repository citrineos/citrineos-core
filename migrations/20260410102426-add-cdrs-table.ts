// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Cdrs" (
        "id" SERIAL PRIMARY KEY,
        "ocpiCdrId"               VARCHAR(39)   NOT NULL,
        "countryCode"             VARCHAR(2)    NOT NULL,
        "partyId"                 VARCHAR(3)    NOT NULL,
        "startDateTime"           TIMESTAMPTZ   NOT NULL,
        "endDateTime"             TIMESTAMPTZ   NOT NULL,
        "sessionId"               VARCHAR(36),
        "cdrToken"                JSONB         NOT NULL,
        "authMethod"              VARCHAR(50)   NOT NULL,
        "authorizationReference"  VARCHAR(36),
        "cdrLocation"             JSONB         NOT NULL,
        "meterId"                 VARCHAR(255),
        "currency"                VARCHAR(3)    NOT NULL,
        "tariffs"                 JSONB,
        "chargingPeriods"         JSONB         NOT NULL,
        "signedData"              JSONB,
        "totalCost"               JSONB         NOT NULL,
        "totalFixedCost"          JSONB,
        "totalEnergy"             NUMERIC       NOT NULL,
        "totalEnergyCost"         JSONB,
        "totalTime"               NUMERIC       NOT NULL,
        "totalTimeCost"           JSONB,
        "totalParkingTime"        NUMERIC,
        "totalParkingCost"        JSONB,
        "totalReservationCost"    JSONB,
        "remark"                  VARCHAR(255),
        "invoiceReferenceId"      VARCHAR(39),
        "credit"                  BOOLEAN,
        "creditReferenceId"       VARCHAR(39),
        "homeChargingCompensation" BOOLEAN,
        "lastUpdated"             TIMESTAMPTZ   NOT NULL,
        "createdAt"               TIMESTAMPTZ   DEFAULT NOW(),
        "updatedAt"               TIMESTAMPTZ   DEFAULT NOW(),
        "tenantId"                INTEGER       NOT NULL REFERENCES "Tenants"("id"),
        "tenantPartnerId"         INTEGER       NOT NULL REFERENCES "TenantPartners"("id"),

        UNIQUE ("countryCode", "partyId", "ocpiCdrId", "tenantPartnerId")
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_cdrs_tenant_partner_id"
      ON "Cdrs" ("tenantPartnerId");
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_cdrs_tenant_id"
      ON "Cdrs" ("tenantId");
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_cdrs_ocpi_lookup"
      ON "Cdrs" ("countryCode", "partyId", "ocpiCdrId");
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_cdrs_last_updated"
      ON "Cdrs" ("lastUpdated");
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_cdrs_credit_reference_id"
      ON "Cdrs" ("creditReferenceId")
      WHERE "creditReferenceId" IS NOT NULL;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_cdrs_credit_reference_id";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_cdrs_last_updated";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_cdrs_ocpi_lookup";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_cdrs_tenant_id";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_cdrs_tenant_partner_id";
    `);

    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS "Cdrs";
    `);
  },
};
