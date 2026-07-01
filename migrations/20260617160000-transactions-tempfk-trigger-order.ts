// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE "Transactions" t SET "stationId" = cs."id"
        FROM "ChargingStations" cs
        WHERE t."stationId" IS NULL
          AND t."ocppConnectionName" = cs."ocppConnectionName"
          AND t."tenantId" = cs."tenantId";

      UPDATE "Transactions" SET "temp_fk" = "stationId" WHERE "temp_fk" IS DISTINCT FROM "stationId";

      DROP TRIGGER IF EXISTS trg_transactions_resolve_station_id ON "Transactions";
      DROP TRIGGER IF EXISTS trg_resolve_station_id ON "Transactions";
      CREATE TRIGGER trg_resolve_station_id
        BEFORE INSERT OR UPDATE ON "Transactions"
        FOR EACH ROW EXECUTE FUNCTION fn_transactions_resolve_station_id();
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_resolve_station_id ON "Transactions";
      CREATE TRIGGER trg_transactions_resolve_station_id
        BEFORE INSERT OR UPDATE ON "Transactions"
        FOR EACH ROW EXECUTE FUNCTION fn_transactions_resolve_station_id();
    `);
  },
};
