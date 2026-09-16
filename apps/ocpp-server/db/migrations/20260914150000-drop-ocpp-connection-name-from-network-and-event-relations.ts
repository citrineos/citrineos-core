// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Drops the "ocppConnectionName" column from SetNetworkProfiles and EventData, and
 * moves EventData's name-keyed indexes onto the FK. Both stay nullable (SET NULL).
 */

const TABLES = ['SetNetworkProfiles', 'EventData'] as const;

// This name covers the NAME column today: index names did not follow the
// 20260427000000 rename. It is reused for the FK, so it must be dropped first —
// CREATE INDEX IF NOT EXISTS would be a silent no-op and DROP COLUMN would take it.
const EVENT_DATA_STATION_INDEX = 'event_data_station_id';
// Sequelize derives this one from the model's @Index; present only in a model-built
// schema, hence the separate drop.
const EVENT_DATA_NAME_INDEX = 'event_data_ocpp_connection_name';
// Created by 20260729000000 over ("ocppConnectionName", "tenantId", "eventId").
const EVENT_DATA_LOOKUP_INDEX_OLD = 'event_data_stationName_tenantId_eventId';
const EVENT_DATA_LOOKUP_INDEX_NEW = 'event_data_station_id_tenant_id_event_id';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      for (const table of TABLES) {
        // Backfill the FK from the name, scoped by tenant — connection names are
        // only unique within a tenant.
        await q(`
          UPDATE "${table}" AS t
             SET "stationId" = cs."id"
            FROM "ChargingStations" AS cs
           WHERE t."stationId" IS NULL
             AND t."ocppConnectionName" = cs."ocppConnectionName"
             AND t."tenantId" = cs."tenantId"
        `);

        const [unattributed] = await queryInterface.sequelize.query<{ count: string }>(
          `SELECT COUNT(*) AS count FROM "${table}" WHERE "stationId" IS NULL`,
          { transaction, type: QueryTypes.SELECT },
        );
        const count = Number(unattributed?.count ?? 0);
        if (count > 0) {
          console.warn(
            `[20260914150000] ${table}: ${count} row(s) have no resolvable station and ` +
              `will keep a null "stationId". They are retained, but lose their station ` +
              `attribution when "ocppConnectionName" is dropped.`,
          );
        }
      }

      // Move EventData's name-keyed indexes onto the FK before the column goes.
      await q(`DROP INDEX IF EXISTS "${EVENT_DATA_NAME_INDEX}"`);
      await q(`DROP INDEX IF EXISTS "${EVENT_DATA_LOOKUP_INDEX_OLD}"`);
      await q(`DROP INDEX IF EXISTS "${EVENT_DATA_STATION_INDEX}"`);
      await q(`CREATE INDEX "${EVENT_DATA_STATION_INDEX}" ON "EventData" ("stationId")`);
      await q(`CREATE INDEX IF NOT EXISTS "${EVENT_DATA_LOOKUP_INDEX_NEW}"
                 ON "EventData" ("stationId", "tenantId", "eventId")`);

      for (const table of TABLES) {
        await q(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "ocppConnectionName"`);
      }

      // populate_station_id() (20260427000000) reads the dropped column, so drop the
      // per-table trigger. The shared function stays for unconverted relations.
      for (const table of TABLES) {
        await q(
          `DROP TRIGGER IF EXISTS "trigger_populate_${table.toLowerCase()}_station_id" ON "${table}"`,
        );
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      for (const table of TABLES) {
        await q(
          `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "ocppConnectionName" VARCHAR(255)`,
        );
        await q(`
          UPDATE "${table}" AS t
             SET "ocppConnectionName" = cs."ocppConnectionName"
            FROM "ChargingStations" AS cs
           WHERE t."stationId" = cs."id"
        `);
      }

      // Put EventData's indexes back on the name column.
      await q(`DROP INDEX IF EXISTS "${EVENT_DATA_STATION_INDEX}"`);
      await q(`DROP INDEX IF EXISTS "${EVENT_DATA_LOOKUP_INDEX_NEW}"`);
      // Restored under its historical name, over the name column, as 20250430103000
      // left it.
      await q(`CREATE INDEX IF NOT EXISTS "${EVENT_DATA_STATION_INDEX}"
                 ON "EventData" ("ocppConnectionName")`);
      await q(`CREATE INDEX IF NOT EXISTS "${EVENT_DATA_LOOKUP_INDEX_OLD}"
                 ON "EventData" ("ocppConnectionName", "tenantId", "eventId")`);

      // Reinstate the trigger dropped by `up`; the shared function is still present.
      for (const table of TABLES) {
        await q(`
          CREATE TRIGGER "trigger_populate_${table.toLowerCase()}_station_id"
          BEFORE INSERT OR UPDATE ON "${table}"
          FOR EACH ROW
          WHEN (NEW."stationId" IS NULL)
          EXECUTE FUNCTION populate_station_id()
        `);
      }
    });
  },
};
