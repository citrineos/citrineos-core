// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

const CONSTRAINTS: { table: string; name: string; columns: string }[] = [
  {
    table: 'StatusNotifications',
    name: 'StatusNotifications_connectorId_fkey',
    columns: '"connectorId"',
  },
  { table: 'EvseTypes', name: 'EvseTypes_connectorId_fkey', columns: '"connectorId"' },
];

const constraintExists = async (
  queryInterface: QueryInterface,
  table: string,
  name: string,
): Promise<boolean> => {
  const rows = await queryInterface.sequelize.query(
    `SELECT 1 FROM information_schema.table_constraints
       WHERE table_schema = 'public' AND table_name = :table AND constraint_name = :name`,
    { replacements: { table, name }, type: QueryTypes.SELECT },
  );
  return rows.length > 0;
};

export default {
  up: async (queryInterface: QueryInterface) => {
    for (const { table, name } of CONSTRAINTS) {
      if (await constraintExists(queryInterface, table, name)) {
        await queryInterface.sequelize.query(`ALTER TABLE "${table}" DROP CONSTRAINT "${name}"`, {
          type: QueryTypes.RAW,
        });
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    for (const { table, name, columns } of CONSTRAINTS) {
      if (!(await constraintExists(queryInterface, table, name))) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY (${columns})
             REFERENCES "Connectors" ("id") ON UPDATE CASCADE ON DELETE SET NULL`,
          { type: QueryTypes.RAW },
        );
      }
    }
  },
};
