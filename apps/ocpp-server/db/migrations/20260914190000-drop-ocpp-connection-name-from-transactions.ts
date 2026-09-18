// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Drops the "ocppConnectionName" column from Transactions. "stationId" stays nullable
 * with ON DELETE SET NULL: history is archived for audit and outlives the station.
 */

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      // Rescue attribution for rows that still have a resolvable name. Only touches
      // rows with a null FK; the populate trigger filled the rest on insert.
      await q(`
        UPDATE "Transactions" AS t
           SET "stationId" = cs."id"
          FROM "ChargingStations" AS cs
         WHERE t."stationId" IS NULL
           AND t."ocppConnectionName" = cs."ocppConnectionName"
           AND t."tenantId" = cs."tenantId"
      `);

      const [unattributed] = await queryInterface.sequelize.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM "Transactions" WHERE "stationId" IS NULL`,
        { transaction, type: QueryTypes.SELECT },
      );
      const count = Number(unattributed?.count ?? 0);
      if (count > 0) {
        console.warn(
          `[20260914190000] Transactions: ${count} row(s) have no resolvable station and ` +
            `will keep a null "stationId". They are retained, but lose their station ` +
            `attribution when "ocppConnectionName" is dropped.`,
        );
      }

      // populate_station_id() (20260427000000) reads the dropped column, so drop the
      // per-table trigger. The shared function stays for unconverted relations.
      await q(
        `DROP TRIGGER IF EXISTS "trigger_populate_transactions_station_id" ON "Transactions"`,
      );

      // Metadata-only in Postgres, so no rewrite of a large partitioned table.
      await q(`ALTER TABLE "Transactions" DROP COLUMN IF EXISTS "ocppConnectionName"`);
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      await q(
        `ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "ocppConnectionName" VARCHAR(255)`,
      );
      await q(`
        UPDATE "Transactions" AS t
           SET "ocppConnectionName" = cs."ocppConnectionName"
          FROM "ChargingStations" AS cs
         WHERE t."stationId" = cs."id"
      `);

      await q(`
        CREATE TRIGGER "trigger_populate_transactions_station_id"
          BEFORE INSERT OR UPDATE ON "Transactions"
          FOR EACH ROW WHEN (NEW."stationId" IS NULL)
          EXECUTE FUNCTION populate_station_id()`);
    });
  },
};
