// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW "OCPIBillingEmsp" AS
      SELECT
        c."id",
        c."tenantId",
        c."startDateTime" AS "session_start",
        c."endDateTime" AS "session_end",
        c."totalEnergy" AS "energy_charged_kwh",
        (c."totalCost"->>'excl_vat')::numeric AS "total_cost_eur_excl_vat",
        c."cdrToken"->>'uid' AS "badge_id",
        c."cdrLocation"->>'name' AS "location"
      FROM "Cdrs" c
    `);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS "OCPIBillingEmsp"
    `);
  },
};
