// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Drops the "ocppConnectionName" column from the charging station's
 * relations.
 */

const TABLES = [
  'ChargingStationSequences',
  'ChargingStationSecurityInfos',
  'ChargingStationNetworkProfiles',
] as const;

// 20260330100000 left this table ON DELETE SET NULL while the other two cascade.
// "stationId" becomes NOT NULL here, so the key moves to CASCADE — SET NULL would
// write a null the column rejects and fail every station delete.
const TO_CASCADE: ReadonlySet<string> = new Set(['ChargingStationSecurityInfos']);

// Only this constraint still spans the name; the other two tables are already
// unique over the FK. Moved onto a NOT NULL column it is strictly stronger, since
// no row can sit outside it with a null station.
const SECURITY_INFO_NAME_UNIQUE = 'ChargingStationSecurityInfos_stationName_tenantId';
const SECURITY_INFO_FK_UNIQUE = 'ChargingStationSecurityInfos_stationId_tenantId';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      // Resolve by what the constraint does rather than by name, so this works
      // against both a migration-built and a model-built schema.
      const stationFkName = async (table: string): Promise<string | undefined> => {
        const rows = await queryInterface.sequelize.query<{ conname: string }>(
          `SELECT c.conname
             FROM pg_constraint c
             JOIN pg_class rel ON rel.oid = c.conrelid
             JOIN pg_class ref ON ref.oid = c.confrelid
            WHERE c.contype = 'f'
              AND rel.relname = :table
              AND ref.relname = 'ChargingStations'
              AND c.conkey = ARRAY[
                (SELECT attnum FROM pg_attribute
                  WHERE attrelid = rel.oid AND attname = 'stationId')
              ]::smallint[]`,
          { replacements: { table }, transaction, type: QueryTypes.SELECT },
        );
        return rows[0]?.conname;
      };

      const unattributed: string[] = [];

      for (const table of TABLES) {
        // 1. Backfill the FK from the name, scoped by tenant — connection names
        //    are only unique within a tenant.
        await q(`
          UPDATE "${table}" AS t
             SET "stationId" = cs."id"
            FROM "ChargingStations" AS cs
           WHERE t."stationId" IS NULL
             AND t."ocppConnectionName" = cs."ocppConnectionName"
             AND t."tenantId" = cs."tenantId"
        `);

        // 2. Record what could not be attributed; the migration aborts below if any
        //    remain, rather than deciding for the operator what to do with them.
        const [orphans] = await queryInterface.sequelize.query<{ count: string }>(
          `SELECT COUNT(*) AS count FROM "${table}" WHERE "stationId" IS NULL`,
          { transaction, type: QueryTypes.SELECT },
        );
        const orphanCount = Number(orphans?.count ?? 0);
        if (orphanCount > 0) {
          unattributed.push(`${table}: ${orphanCount}`);
        }
      }

      if (unattributed.length > 0) {
        throw new Error(
          `[20260914120000] Cannot make "stationId" NOT NULL — these rows have an ` +
            `"ocppConnectionName" matching no charging station in their tenant:\n` +
            unattributed.map((line) => `  ${line}`).join('\n') +
            `\nRepoint them at a station or delete them, then re-run this migration.`,
        );
      }

      // 3. Move the ChargingStationSecurityInfos unique constraint onto the FK.
      await q(
        `ALTER TABLE "ChargingStationSecurityInfos"
           DROP CONSTRAINT IF EXISTS "${SECURITY_INFO_NAME_UNIQUE}"`,
      );
      await q(
        `ALTER TABLE "ChargingStationSecurityInfos"
           DROP CONSTRAINT IF EXISTS "${SECURITY_INFO_FK_UNIQUE}"`,
      );
      await q(
        `ALTER TABLE "ChargingStationSecurityInfos"
           ADD CONSTRAINT "${SECURITY_INFO_FK_UNIQUE}" UNIQUE ("stationId", "tenantId")`,
      );

      // 4 & 5. The FK is now the only link to the station.
      for (const table of TABLES) {
        if (TO_CASCADE.has(table)) {
          const fk = await stationFkName(table);
          if (fk) {
            await q(`ALTER TABLE "${table}" DROP CONSTRAINT "${fk}"`);
          }
          await q(`
            ALTER TABLE "${table}"
              ADD CONSTRAINT "${table}_stationId_fkey" FOREIGN KEY ("stationId")
                REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE`);
        }
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

      // Rows deleted by `up` are not recoverable.
      const widths: Record<(typeof TABLES)[number], string> = {
        ChargingStationSequences: 'VARCHAR(36)',
        ChargingStationSecurityInfos: 'VARCHAR(255)',
        ChargingStationNetworkProfiles: 'VARCHAR(255)',
      };

      // A primary-key column carries its own NOT NULL that cannot be relaxed;
      // ChargingStationNetworkProfiles is a junction table in a model-built schema.
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
          `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "ocppConnectionName" ${widths[table]}`,
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
        if (TO_CASCADE.has(table)) {
          await q(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_stationId_fkey"`);
          await q(`
            ALTER TABLE "${table}"
              ADD CONSTRAINT "${table}_stationId_fkey" FOREIGN KEY ("stationId")
                REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE SET NULL`);
        }
      }

      // ChargingStationSequences declared the name NOT NULL before this migration.
      await q(
        `ALTER TABLE "ChargingStationSequences" ALTER COLUMN "ocppConnectionName" SET NOT NULL`,
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

      // Put the security-info unique constraint back on the name column.
      await q(
        `ALTER TABLE "ChargingStationSecurityInfos"
           DROP CONSTRAINT IF EXISTS "${SECURITY_INFO_FK_UNIQUE}"`,
      );
      await q(
        `ALTER TABLE "ChargingStationSecurityInfos"
           ADD CONSTRAINT "${SECURITY_INFO_NAME_UNIQUE}" UNIQUE ("ocppConnectionName", "tenantId")`,
      );
    });
  },
};
