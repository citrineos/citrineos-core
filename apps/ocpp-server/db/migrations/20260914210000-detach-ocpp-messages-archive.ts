// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Detaches "OCPPMessages_old" from live data if this table exists. 20260813120000 renamed the
 * pre-partition heap, and Postgres carried its station FK and populate trigger along. So deleting
 * a station updated the archive to a null "stationId", firing a trigger that re-resolved
 * the name against the station being deleted and aborted to delete.
 */

const ARCHIVE = 'OCPPMessages_old';
const TRIGGER = 'trigger_populate_ocppmessages_station_id';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      const [archive] = await queryInterface.sequelize.query<{ exists: string | null }>(
        `SELECT to_regclass('"${ARCHIVE}"')::text AS exists`,
        { transaction, type: QueryTypes.SELECT },
      );
      if (!archive?.exists) {
        return;
      }

      await q(`DROP TRIGGER IF EXISTS "${TRIGGER}" ON "${ARCHIVE}"`);

      // By what it does, not by name: the constraint was inherited through the rename.
      const fks = await queryInterface.sequelize.query<{ conname: string }>(
        `SELECT c.conname
           FROM pg_constraint c
           JOIN pg_class rel ON rel.oid = c.conrelid
           JOIN pg_class ref ON ref.oid = c.confrelid
          WHERE c.contype = 'f'
            AND rel.relname = :archive
            AND ref.relname = 'ChargingStations'`,
        { replacements: { archive: ARCHIVE }, transaction, type: QueryTypes.SELECT },
      );
      for (const { conname } of fks) {
        await q(`ALTER TABLE "${ARCHIVE}" DROP CONSTRAINT "${conname}"`);
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      const [archive] = await queryInterface.sequelize.query<{ exists: string | null }>(
        `SELECT to_regclass('"${ARCHIVE}"')::text AS exists`,
        { transaction, type: QueryTypes.SELECT },
      );
      if (!archive?.exists) {
        return;
      }

      // Stations deleted while the key was absent left dangling ids; null them, which
      // is what the SET NULL key would have done, so it can be validated again.
      await q(`
        UPDATE "${ARCHIVE}" AS o
           SET "stationId" = NULL
         WHERE o."stationId" IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM "ChargingStations" cs WHERE cs."id" = o."stationId")
      `);
      await q(`
        ALTER TABLE "${ARCHIVE}"
          ADD CONSTRAINT "OCPPMessages_stationId_fkey" FOREIGN KEY ("stationId")
            REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE SET NULL`);

      // Restores the trigger, and with it the station-delete failure this migration fixed.
      await q(`
        CREATE TRIGGER "${TRIGGER}"
          BEFORE INSERT OR UPDATE ON "${ARCHIVE}"
          FOR EACH ROW WHEN (NEW."stationId" IS NULL)
          EXECUTE FUNCTION populate_station_id()`);
    });
  },
};
