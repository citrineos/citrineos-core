// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
DO $rec$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT cls.relname AS tbl,
           (SELECT a.attname FROM pg_attribute a
             WHERE a.attrelid = con.conrelid AND a.attnum = con.conkey[1]) AS col
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    WHERE con.contype = 'f' AND con.confrelid = '"ChargingStations"'::regclass
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "ocppConnectionName" text;', r.tbl);
    EXECUTE format(
      'UPDATE %I t SET "ocppConnectionName" = cs."ocppConnectionName"
         FROM "ChargingStations" cs WHERE cs."id" = t.%I;', r.tbl, r.col);
  END LOOP;
END
$rec$;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
DO $rec$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT cls.relname AS tbl
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    WHERE con.contype = 'f' AND con.confrelid = '"ChargingStations"'::regclass
  LOOP
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "ocppConnectionName";', r.tbl);
  END LOOP;
END
$rec$;
    `);
  },
};
