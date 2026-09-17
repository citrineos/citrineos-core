// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Drops the global UNIQUE ("serialNumber", "issuerName") constraint that 20260413040000 intended to
 * remove but could not: it dropped a constraint named "serialNumber_issuerName", while the one the
 * initial migration created inline is auto-named "Certificates_serialNumber_issuerName_key". On any
 * database that already ran 20260413040000, the global constraint therefore survives and blocks two
 * tenants from holding a certificate with the same serialNumber/issuerName — which the per-tenant
 * "tenantId_serialNumber_issuerName" constraint (added by that same migration) is meant to allow.
 */

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      await q(
        `ALTER TABLE "Certificates" DROP CONSTRAINT IF EXISTS "Certificates_serialNumber_issuerName_key"`,
      );
      await q(`ALTER TABLE "Certificates" DROP CONSTRAINT IF EXISTS "serialNumber_issuerName"`);
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      // Best-effort restore of the global uniqueness this migration removed. It fails if two tenants
      // already hold the same serialNumber/issuerName — the state this migration exists to allow — in
      // which case those rows must be reconciled before rolling back.
      await q(`
        ALTER TABLE "Certificates"
          ADD CONSTRAINT "Certificates_serialNumber_issuerName_key"
          UNIQUE ("serialNumber", "issuerName")
      `);
    });
  },
};
