// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Drops the "ocppConnectionName" column from the certificate relations, and makes
 * "stationId" NOT NULL on all three — as the name column always was. The two attempt
 * logs move from ON DELETE SET NULL to CASCADE, which NOT NULL requires.
 */

const TABLES = [
  'InstalledCertificates',
  'InstallCertificateAttempts',
  'DeleteCertificateAttempts',
] as const;

// These two were left ON DELETE SET NULL by 20260330100000 while their name column
// stayed NOT NULL. CASCADE matches InstalledCertificates, which already has it, so
// all three certificate relations now go with the station.
const TO_CASCADE: ReadonlySet<string> = new Set([
  'InstallCertificateAttempts',
  'DeleteCertificateAttempts',
]);

// Every one of these declared the name as VARCHAR(36); used by `down`.
const NAME_COLUMN_TYPE = 'VARCHAR(36)';

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

        // A non-null name is not a resolvable one: since 20260330100000 the name has
        // been a plain column, so a station delete nulled the FK and left it dangling.
        const [orphans] = await queryInterface.sequelize.query<{ count: string }>(
          `SELECT COUNT(*) AS count FROM "${table}" WHERE "stationId" IS NULL`,
          { transaction, type: QueryTypes.SELECT },
        );
        const orphanCount = Number(orphans?.count ?? 0);
        if (orphanCount > 0) {
          console.warn(
            `[20260914130000] ${table}: deleting ${orphanCount} row(s) whose ` +
              `"ocppConnectionName" matches no charging station in the same tenant.`,
          );
          await q(`DELETE FROM "${table}" WHERE "stationId" IS NULL`);
        }

        // SET NULL cannot coexist with NOT NULL — it would write a null the column
        // rejects, failing every station delete. CASCADE takes the rows instead.
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
          `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "ocppConnectionName" ${NAME_COLUMN_TYPE}`,
        );
        await q(`
          UPDATE "${table}" AS t
             SET "ocppConnectionName" = cs."ocppConnectionName"
            FROM "ChargingStations" AS cs
           WHERE t."stationId" = cs."id"
        `);
        // Every row resolves to a station after `up`, so the name is fully restorable.
        await q(`ALTER TABLE "${table}" ALTER COLUMN "ocppConnectionName" SET NOT NULL`);
        if (!(await inPrimaryKey(table, 'stationId'))) {
          await q(`ALTER TABLE "${table}" ALTER COLUMN "stationId" DROP NOT NULL`);
        }

        // Put the attempt logs back on SET NULL; rows deleted by `up` are not
        // recoverable.
        if (TO_CASCADE.has(table)) {
          await q(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_stationId_fkey"`);
          await q(`
            ALTER TABLE "${table}"
              ADD CONSTRAINT "${table}_stationId_fkey" FOREIGN KEY ("stationId")
                REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE SET NULL`);
        }
      }

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
