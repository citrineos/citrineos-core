// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

const TABLE_NAME = 'EventData';
const CONSTRAINT_NAME = 'EventData_stationName_tenantId_eventId';
const INDEX_NAME = 'event_data_stationName_tenantId_eventId';
const COLUMNS = '"ocppConnectionName", "tenantId", "eventId"';

const constraintExists = async (queryInterface: QueryInterface): Promise<boolean> => {
  const rows = await queryInterface.sequelize.query(
    `SELECT 1 FROM information_schema.table_constraints
       WHERE table_schema = 'public' AND table_name = :table AND constraint_name = :name`,
    { replacements: { table: TABLE_NAME, name: CONSTRAINT_NAME }, type: QueryTypes.SELECT },
  );
  return rows.length > 0;
};

export default {
  // eventId is not unique per charging station over time: it is assigned by the
  // station and restarts from zero whenever the station reboots, so ids are
  // reused and collide with rows stored before the reboot. Keep the lookup
  // index, drop the uniqueness.
  up: async (queryInterface: QueryInterface) => {
    if (await constraintExists(queryInterface)) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE_NAME}" DROP CONSTRAINT "${CONSTRAINT_NAME}"`,
        { type: QueryTypes.RAW },
      );
    }

    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "${INDEX_NAME}" ON "${TABLE_NAME}" (${COLUMNS})`,
      { type: QueryTypes.RAW },
    );
  },

  // Restoring uniqueness fails if duplicate (station, tenant, eventId) rows have
  // accumulated; de-duplicate EventData before rolling back.
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${INDEX_NAME}"`, {
      type: QueryTypes.RAW,
    });

    if (!(await constraintExists(queryInterface))) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE_NAME}" ADD CONSTRAINT "${CONSTRAINT_NAME}" UNIQUE (${COLUMNS})`,
        { type: QueryTypes.RAW },
      );
    }
  },
};
