// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Makes OCPPMessages."stationId" NOT NULL and its key ON DELETE RESTRICT, so deleting
 * a station with messages is refused rather than silently discarding its whole log.
 * Rows with a null "stationId" are DELETED — they predate the mandatory link.
 */

const TABLE = 'OCPPMessages';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      const [unattributed] = await queryInterface.sequelize.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM "${TABLE}" WHERE "stationId" IS NULL`,
        { transaction, type: QueryTypes.SELECT },
      );
      const count = Number(unattributed?.count ?? 0);
      if (count > 0) {
        console.warn(
          `[20260914200000] ${TABLE}: deleting ${count} row(s) with a NULL "stationId". ` +
            `Their station was deleted before "stationId" became mandatory and the name ` +
            `that identified it has already been dropped, so they cannot be attributed.`,
        );
        await q(`DELETE FROM "${TABLE}" WHERE "stationId" IS NULL`);
      }

      // Resolve the constraint by what it does rather than by name: the partition
      // rebuild named it "OCPPMessages_stationId_fkey", but a model-built schema is
      // free to pick its own.
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
        { replacements: { table: TABLE }, transaction, type: QueryTypes.SELECT },
      );
      const fk = rows[0]?.conname;

      // The FK action has to change before NOT NULL can hold: SET NULL would write a
      // null the column no longer accepts. RESTRICT refuses the delete instead, so
      // clearing a station's messages stays a deliberate, separate act.
      if (fk) {
        await q(`ALTER TABLE "${TABLE}" DROP CONSTRAINT "${fk}"`);
      }
      await q(`
        ALTER TABLE "${TABLE}"
          ADD CONSTRAINT "${TABLE}_stationId_fkey" FOREIGN KEY ("stationId")
            REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE RESTRICT`);

      await q(`ALTER TABLE "${TABLE}" ALTER COLUMN "stationId" SET NOT NULL`);
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      // Rows deleted by `up` are not recoverable. This restores the shape only.
      await q(`ALTER TABLE "${TABLE}" ALTER COLUMN "stationId" DROP NOT NULL`);
      await q(`ALTER TABLE "${TABLE}" DROP CONSTRAINT IF EXISTS "${TABLE}_stationId_fkey"`);
      await q(`
        ALTER TABLE "${TABLE}"
          ADD CONSTRAINT "${TABLE}_stationId_fkey" FOREIGN KEY ("stationId")
            REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE SET NULL`);
    });
  },
};
