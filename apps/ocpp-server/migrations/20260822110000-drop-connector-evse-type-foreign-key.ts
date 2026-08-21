// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

const TABLE_NAME = 'Connectors';
const CONSTRAINT_NAME = 'Connectors_evseTypeConnectorId_fkey';

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

  down: async (queryInterface: QueryInterface) => {
    if (!(await constraintExists(queryInterface))) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE_NAME}" ADD CONSTRAINT "${CONSTRAINT_NAME}"
           FOREIGN KEY ("evseTypeConnectorId") REFERENCES "EvseTypes" ("databaseId")
           ON UPDATE CASCADE ON DELETE SET NULL`,
        { type: QueryTypes.RAW },
      );
    }
  },
};
