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
    SELECT c.table_name AS tbl
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'stationId'
      AND c.data_type IN ('character varying', 'text')
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns o
        WHERE o.table_schema = 'public' AND o.table_name = c.table_name
          AND o.column_name = 'ocppConnectionName')
  LOOP
    EXECUTE format('ALTER TABLE %I RENAME COLUMN "stationId" TO "ocppConnectionName";', r.tbl);
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
    SELECT c.table_name AS tbl
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'ocppConnectionName'
      AND c.table_name <> 'ChargingStations'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns s
        WHERE s.table_schema = 'public' AND s.table_name = c.table_name
          AND s.column_name = 'stationId')
  LOOP
    EXECUTE format('ALTER TABLE %I RENAME COLUMN "ocppConnectionName" TO "stationId";', r.tbl);
  END LOOP;
END
$rec$;
    `);
  },
};
