// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

// CompositeSchedules.evseId holds the EVSE number a charging station reported, with 0 meaning the
// whole grid connection. It is not a reference to an Evse row, and the association that made it one
// has been removed; this drops the constraint it left behind.
const TABLE_NAME = 'CompositeSchedules';
const CONSTRAINT_NAME = 'CompositeSchedules_evseId_fkey';

const constraintExists = async (queryInterface: QueryInterface): Promise<boolean> => {
  const rows = await queryInterface.sequelize.query(
    `SELECT 1 FROM information_schema.table_constraints
       WHERE table_schema = 'public' AND table_name = :table AND constraint_name = :name`,
    { replacements: { table: TABLE_NAME, name: CONSTRAINT_NAME }, type: QueryTypes.SELECT },
  );
  return rows.length > 0;
};

export default {
  up: async (queryInterface: QueryInterface) => {
    if (await constraintExists(queryInterface)) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE_NAME}" DROP CONSTRAINT "${CONSTRAINT_NAME}"`,
        { type: QueryTypes.RAW },
      );
    }
  },

  // Restoring the constraint fails wherever a stored EVSE number does not happen to be an Evse id,
  // which is the state it was wrong about in the first place.
  down: async (queryInterface: QueryInterface) => {
    if (!(await constraintExists(queryInterface))) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE_NAME}" ADD CONSTRAINT "${CONSTRAINT_NAME}" FOREIGN KEY ("evseId")
           REFERENCES "Evses" ("id") ON UPDATE CASCADE ON DELETE SET NULL`,
        { type: QueryTypes.RAW },
      );
    }
  },
};
