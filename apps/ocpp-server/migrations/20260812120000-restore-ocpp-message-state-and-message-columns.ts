// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

/**
 * Restores the two columns that 20260729120000-refactor-ocpp-message-columns dropped:
 *
 *   state   (varchar, MessageState 1/2/99)  -- mirror of type    (2 -> 1, 3|4 -> 2, null -> 99)
 *   message (jsonb, whole RPC frame)        -- mirror of raw parsed back into JSON
 *
 * They are deprecated mirrors, not a revert: `type`, `payload` and `raw` stay authoritative and
 * the application keeps both sides in sync on every insert. The point is that integrations built
 * against the old schema — Hasura consumers, reporting queries, downstream ETL — keep reading the
 * column names they were written against.
 *
 * Both are nullable with no backfilled default beyond what is derivable, so the correlation
 * triggers (which key off `type`) are unaffected.
 *
 * @type {import('sequelize-cli').Migration}
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'OCPPMessages',
        'state',
        { type: DataTypes.STRING, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'OCPPMessages',
        'message',
        { type: DataTypes.JSONB, allowNull: true },
        { transaction },
      );

      // MessageState is persisted as its numeric enum value in a varchar column
      // (Request = 1, Response = 2, Unknown = 99). Rows with a null `type` are the ones that
      // never parsed into an RPC frame, which is exactly what Unknown meant.
      await queryInterface.sequelize.query(
        `UPDATE "OCPPMessages"
            SET "state" = CASE
                            WHEN "type" = 2 THEN '1'
                            WHEN "type" IN (3, 4) THEN '2'
                            ELSE '99'
                          END`,
        { transaction, type: QueryTypes.RAW },
      );

      // `raw` is arbitrary text, so a blanket raw::jsonb cast would abort the migration on the
      // first unparseable row. Cast per row and leave `message` null where it is not valid JSON —
      // those rows had no RPC frame to record in the first place.
      await queryInterface.sequelize.query(
        `DO $$
           DECLARE r RECORD;
           BEGIN
             FOR r IN SELECT "id", "raw" FROM "OCPPMessages" WHERE "raw" IS NOT NULL AND "raw" <> '' LOOP
               BEGIN
                 UPDATE "OCPPMessages" SET "message" = r."raw"::jsonb WHERE "id" = r."id";
               EXCEPTION WHEN others THEN
                 NULL;
               END;
             END LOOP;
           END $$;`,
        { transaction, type: QueryTypes.RAW },
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('OCPPMessages', 'message', { transaction });
      await queryInterface.removeColumn('OCPPMessages', 'state', { transaction });
    });
  },
};
