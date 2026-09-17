// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Drops the "ocppConnectionName" column from Evses and Connectors. Both FKs cascade, so
 * "stationId" becomes NOT NULL; aborts if any row cannot be attributed to a station.
 */

const TABLES = ['Connectors', 'Evses'] as const;

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      const unattributed: string[] = [];

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
          unattributed.push(`${table}: ${orphanCount}`);
        }
      }

      // Counted across both tables before changing anything, so one run reports the
      // full picture instead of failing on whichever table comes first.
      if (unattributed.length > 0) {
        throw new Error(
          `[20260914160000] Cannot make "stationId" NOT NULL — these rows have an ` +
            `"ocppConnectionName" matching no charging station in their tenant:\n` +
            unattributed.map((line) => `  ${line}`).join('\n') +
            `\nRepoint them at a station or delete them, then re-run this migration. ` +
            `Connectors hang off Evses, so clear them together.`,
        );
      }

      for (const table of TABLES) {
        // The FK is now the only link to the station.
        await q(`ALTER TABLE "${table}" ALTER COLUMN "stationId" SET NOT NULL`);
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
        if (!(await inPrimaryKey(table, 'stationId'))) {
          await q(`ALTER TABLE "${table}" ALTER COLUMN "stationId" DROP NOT NULL`);
        }
      }

      // Connectors declared the name NOT NULL before this migration; Evses did not.
      await q(`ALTER TABLE "Connectors" ALTER COLUMN "ocppConnectionName" SET NOT NULL`);

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
