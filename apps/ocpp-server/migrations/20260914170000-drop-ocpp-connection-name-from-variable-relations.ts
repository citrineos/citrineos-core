// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Drops the "ocppConnectionName" column from VariableAttributes (NOT NULL, orphans
 * deleted) and VariableMonitorings (nullable; index and uniqueness move to the FK).
 */

const TABLES = ['VariableAttributes', 'VariableMonitorings'] as const;

// Tables whose station FK is ON DELETE SET NULL: their rows outlive the station, so
// the column has to accept the null the FK writes.
const NULLABLE: ReadonlySet<string> = new Set(['VariableMonitorings']);

// Index names did not follow the 20260427000000 rename, so this one covers the NAME
// column today. Reused for the FK below, which means dropping it first.
const VM_STATION_INDEX = 'variable_monitorings_station_id';
// Sequelize derives these from the models' @Index; present only in a model-built schema.
const VM_NAME_INDEX = 'variable_monitorings_ocpp_connection_name';
const VA_NAME_INDEX = 'variable_attributes_ocpp_connection_name';

// Renamed to ...stationName... by 20260427000000; moves back onto the FK here.
const VM_NAME_UNIQUE = 'VariableMonitorings_stationName_tenantId_id';
const VM_FK_UNIQUE = 'VariableMonitorings_stationId_tenantId_id';

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

        const [orphans] = await queryInterface.sequelize.query<{ count: string }>(
          `SELECT COUNT(*) AS count FROM "${table}" WHERE "stationId" IS NULL`,
          { transaction, type: QueryTypes.SELECT },
        );
        const orphanCount = Number(orphans?.count ?? 0);
        if (orphanCount > 0) {
          if (NULLABLE.has(table)) {
            console.warn(
              `[20260914170000] ${table}: ${orphanCount} row(s) have no resolvable ` +
                `station and will keep a null "stationId". They are retained, but lose ` +
                `their station attribution when "ocppConnectionName" is dropped.`,
            );
          } else {
            console.warn(
              `[20260914170000] ${table}: deleting ${orphanCount} row(s) whose ` +
                `"ocppConnectionName" matches no charging station in the same tenant.`,
            );
            // VariableStatuses hang off VariableAttributes.
            await q(`
              DELETE FROM "VariableStatuses" AS s
               USING "VariableAttributes" AS a
               WHERE s."variableAttributeId" = a."id"
                 AND a."stationId" IS NULL
            `);
            await q(`DELETE FROM "${table}" WHERE "stationId" IS NULL`);
          }
        }
      }

      // Move the name-keyed indexes and uniqueness onto the FK before the column goes.
      await q(`DROP INDEX IF EXISTS "${VA_NAME_INDEX}"`);
      await q(`DROP INDEX IF EXISTS "${VM_NAME_INDEX}"`);
      await q(`DROP INDEX IF EXISTS "${VM_STATION_INDEX}"`);
      await q(`CREATE INDEX "${VM_STATION_INDEX}" ON "VariableMonitorings" ("stationId")`);

      await q(`ALTER TABLE "VariableMonitorings" DROP CONSTRAINT IF EXISTS "${VM_NAME_UNIQUE}"`);
      await q(`ALTER TABLE "VariableMonitorings" DROP CONSTRAINT IF EXISTS "${VM_FK_UNIQUE}"`);
      await q(
        `ALTER TABLE "VariableMonitorings"
           ADD CONSTRAINT "${VM_FK_UNIQUE}" UNIQUE ("stationId", "tenantId", "id")`,
      );

      for (const table of TABLES) {
        if (!NULLABLE.has(table)) {
          await q(`ALTER TABLE "${table}" ALTER COLUMN "stationId" SET NOT NULL`);
        }
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

      // A column inside a primary key carries its own NOT NULL that cannot be
      // relaxed; check before trying, so `down` works against both a
      // migration-built and a model-built schema.
      const inPrimaryKey = async (table: string, column: string): Promise<boolean> => {
        const rows = await queryInterface.sequelize.query<{ count: string }>(
          `SELECT COUNT(*) AS count
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
               ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema = 'public' AND tc.table_name = :table
              AND tc.constraint_type = 'PRIMARY KEY' AND kcu.column_name = :column`,
          { replacements: { table, column }, transaction, type: QueryTypes.SELECT },
        );
        return Number(rows[0]?.count ?? 0) > 0;
      };

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
        if (!NULLABLE.has(table) && !(await inPrimaryKey(table, 'stationId'))) {
          await q(`ALTER TABLE "${table}" ALTER COLUMN "stationId" DROP NOT NULL`);
        }
      }

      // VariableAttributes declared the name NOT NULL before this migration.
      await q(`ALTER TABLE "VariableAttributes" ALTER COLUMN "ocppConnectionName" SET NOT NULL`);

      // Put the index and the uniqueness back over the name column.
      await q(`DROP INDEX IF EXISTS "${VM_STATION_INDEX}"`);
      await q(`CREATE INDEX "${VM_STATION_INDEX}" ON "VariableMonitorings" ("ocppConnectionName")`);
      await q(`ALTER TABLE "VariableMonitorings" DROP CONSTRAINT IF EXISTS "${VM_FK_UNIQUE}"`);
      await q(
        `ALTER TABLE "VariableMonitorings"
           ADD CONSTRAINT "${VM_NAME_UNIQUE}" UNIQUE ("ocppConnectionName", "tenantId", "id")`,
      );

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
