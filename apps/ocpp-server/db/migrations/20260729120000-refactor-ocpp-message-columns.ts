// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

/**
 * Migration to reshape the OCPPMessages message columns:
 *
 *   state   (varchar, MessageState 1/2/99) -> type    (integer, OCPP messageTypeId 2/3/4)
 *   message (jsonb, whole RPC frame)       -> payload (jsonb, OCPP payload only)
 *                                           + raw     (text, exact wire message)
 *
 * The old `message` column held the full RPC frame, e.g. [2, "<id>", "BootNotification", {...}],
 * so both new columns are derivable from it. `raw` keeps the frame verbatim, which makes the
 * `payload` extraction below lossless in aggregate even where the per-type slicing is approximate.
 *
 * @type {import('sequelize-cli').Migration}
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'OCPPMessages',
        'type',
        { type: DataTypes.INTEGER, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'OCPPMessages',
        'payload',
        { type: DataTypes.JSONB, allowNull: true },
        { transaction },
      );
      // Added nullable so existing rows can be backfilled before NOT NULL is enforced.
      await queryInterface.addColumn(
        'OCPPMessages',
        'raw',
        { type: DataTypes.TEXT, allowNull: true },
        { transaction },
      );

      // Backfill from the old `message` frame. Rows whose `message` is not an array (legacy or
      // hand-written data) get raw = '' / type = null / payload = null rather than failing.
      await queryInterface.sequelize.query(
        `UPDATE "OCPPMessages"
            SET "raw"  = COALESCE("message"::text, ''),
                "type" = CASE
                           WHEN jsonb_typeof("message") = 'array' AND ("message" ->> 0) ~ '^[0-9]+$'
                             THEN ("message" ->> 0)::integer
                           ELSE NULL
                         END,
                "payload" = CASE
                              WHEN jsonb_typeof("message") <> 'array' THEN NULL
                              -- Call: [2, id, action, payload]
                              WHEN ("message" ->> 0) = '2' THEN "message" -> 3
                              -- CallResult: [3, id, payload]
                              WHEN ("message" ->> 0) = '3' THEN "message" -> 2
                              -- CallError: [4, id, errorCode, errorDescription, errorDetails]
                              WHEN ("message" ->> 0) = '4' THEN jsonb_build_object(
                                     'errorCode', "message" -> 2,
                                     'errorDescription', "message" -> 3,
                                     'errorDetails', "message" -> 4)
                              ELSE NULL
                            END`,
        { transaction, type: QueryTypes.RAW },
      );

      await queryInterface.changeColumn(
        'OCPPMessages',
        'raw',
        { type: DataTypes.TEXT, allowNull: false },
        { transaction },
      );

      await queryInterface.removeColumn('OCPPMessages', 'state', { transaction });
      await queryInterface.removeColumn('OCPPMessages', 'message', { transaction });
    });
  },

  down: async (queryInterface: QueryInterface) => {
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

      // MessageState was persisted as its numeric enum value in a varchar column
      // (Request = 1, Response = 2).
      await queryInterface.sequelize.query(
        `UPDATE "OCPPMessages"
            SET "state" = CASE
                            WHEN "type" = 2 THEN '1'
                            WHEN "type" IN (3, 4) THEN '2'
                            ELSE NULL
                          END`,
        { transaction, type: QueryTypes.RAW },
      );

      // `raw` is arbitrary text, so a blanket raw::jsonb cast would abort the migration on the
      // first unparseable row. Cast per row and leave `message` null where it is not valid JSON.
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

      await queryInterface.removeColumn('OCPPMessages', 'raw', { transaction });
      await queryInterface.removeColumn('OCPPMessages', 'payload', { transaction });
      await queryInterface.removeColumn('OCPPMessages', 'type', { transaction });
    });
  },
};
