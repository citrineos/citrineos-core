// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface } from 'sequelize';

/**
 * A charging station cannot be deleted once anything references it.
 *
 * 20260427000000-rename-charging-station-columns puts a trigger on sixteen child tables:
 *
 *   BEFORE INSERT OR UPDATE ... FOR EACH ROW WHEN (NEW."stationId" IS NULL)
 *   EXECUTE FUNCTION populate_station_id()
 *
 * populate_station_id() resolves the id from ocppConnectionName + tenantId and raises
 * when it cannot. Every one of those foreign keys is ON DELETE SET NULL, so deleting a
 * station sets stationId to NULL on its child rows, the trigger fires, the station it
 * would look up has already gone, and the whole delete aborts:
 *
 *   ERROR:  No ChargingStation found with ocppConnectionName=CS-001 and tenantId=1
 *   CONTEXT:  PL/pgSQL function populate_station_id() line 8 at RAISE
 *
 * Any station that has ever sent a message has rows in OCPPMessages, so in practice no
 * commissioned station can be removed. Through Hasura -- the operator UI's Delete
 * button -- it surfaces as `database query error` with P0001.
 *
 * Backfilling the id only means anything for a row being written for the first time, so
 * the exception is raised on INSERT alone. An UPDATE that clears stationId is the
 * cascade doing exactly what the foreign key asked for, and leaving the column NULL
 * there is the intended outcome.
 *
 * @type {import('sequelize-cli').Migration}
 */
const populateStationId = (raiseWhen: string) => `
  CREATE OR REPLACE FUNCTION populate_station_id()
  RETURNS TRIGGER AS $$
  BEGIN
    SELECT "id" INTO NEW."stationId"
    FROM "ChargingStations"
    WHERE "ocppConnectionName" = NEW."ocppConnectionName" AND "tenantId" = NEW."tenantId";

    IF NEW."stationId" IS NULL${raiseWhen} THEN
      RAISE EXCEPTION 'No ChargingStation found with ocppConnectionName=% and tenantId=%',
                      NEW."ocppConnectionName", NEW."tenantId";
    END IF;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`;

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(populateStationId(" AND TG_OP = 'INSERT'"));
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(populateStationId(''));
  },
};
