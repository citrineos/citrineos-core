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
      WHERE t."ocppConnectionName" = cs."ocppConnectionName"
        AND t."tenantId" = cs."tenantId"
        AND t."stationId" IS NULL;

      CREATE OR REPLACE FUNCTION fn_transactions_resolve_station_id()
        RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
      BEGIN
        IF NEW."stationId" IS NULL AND NEW."ocppConnectionName" IS NOT NULL THEN
          SELECT cs."id" INTO NEW."stationId"
          FROM "ChargingStations" cs
          WHERE cs."ocppConnectionName" = NEW."ocppConnectionName"
            AND cs."tenantId" = COALESCE(NEW."tenantId", 1)
          LIMIT 1;
        END IF;
        RETURN NEW;
      END; $fn$;

      DROP TRIGGER IF EXISTS trg_transactions_resolve_station_id ON "Transactions";
      CREATE TRIGGER trg_transactions_resolve_station_id
        BEFORE INSERT OR UPDATE ON "Transactions"
        FOR EACH ROW EXECUTE FUNCTION fn_transactions_resolve_station_id();
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_transactions_resolve_station_id ON "Transactions";
      DROP FUNCTION IF EXISTS fn_transactions_resolve_station_id();
    `);
  },
};
