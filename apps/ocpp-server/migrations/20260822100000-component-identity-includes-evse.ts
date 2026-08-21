// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

const TABLE_NAME = 'Components';

const OLD_INDEXES = ['components_tenantId_name'];
const OLD_CONSTRAINTS = ['Components_tenantId_name_instance_key', 'Components_name_instance_key'];

const NEW_CONSTRAINT = {
  name: 'Components_tenantId_name_instance_evseDatabaseId_key',
  columns: '"name", "instance", "evseDatabaseId", "tenantId"',
};

const NEW_INDEXES = [
  {
    name: 'components_tenantId_name',
    columns: '"tenantId", "name"',
    where: '"instance" IS NULL AND "evseDatabaseId" IS NULL',
  },
  {
    name: 'components_tenantId_name_evseDatabaseId',
    columns: '"tenantId", "name", "evseDatabaseId"',
    where: '"instance" IS NULL',
  },
  {
    name: 'components_tenantId_name_instance',
    columns: '"tenantId", "name", "instance"',
    where: '"evseDatabaseId" IS NULL',
  },
];

const constraintExists = async (queryInterface: QueryInterface, name: string): Promise<boolean> => {
  const rows = await queryInterface.sequelize.query(
    `SELECT 1 FROM information_schema.table_constraints
       WHERE table_schema = 'public' AND table_name = :table AND constraint_name = :name`,
    { replacements: { table: TABLE_NAME, name }, type: QueryTypes.SELECT },
  );
  return rows.length > 0;
};

export default {
  up: async (queryInterface: QueryInterface) => {
    for (const name of OLD_CONSTRAINTS) {
      if (await constraintExists(queryInterface, name)) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${TABLE_NAME}" DROP CONSTRAINT "${name}"`,
          { type: QueryTypes.RAW },
        );
      }
    }
    for (const name of OLD_INDEXES) {
      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${name}"`, {
        type: QueryTypes.RAW,
      });
    }

    if (!(await constraintExists(queryInterface, NEW_CONSTRAINT.name))) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE_NAME}" ADD CONSTRAINT "${NEW_CONSTRAINT.name}"
           UNIQUE (${NEW_CONSTRAINT.columns})`,
        { type: QueryTypes.RAW },
      );
    }
    for (const index of NEW_INDEXES) {
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "${index.name}" ON "${TABLE_NAME}" (${index.columns})
           WHERE ${index.where}`,
        { type: QueryTypes.RAW },
      );
    }
  },

  down: async (queryInterface: QueryInterface) => {
    for (const index of NEW_INDEXES) {
      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${index.name}"`, {
        type: QueryTypes.RAW,
      });
    }
    if (await constraintExists(queryInterface, NEW_CONSTRAINT.name)) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE_NAME}" DROP CONSTRAINT "${NEW_CONSTRAINT.name}"`,
        { type: QueryTypes.RAW },
      );
    }

    await queryInterface.sequelize.query(
      `ALTER TABLE "${TABLE_NAME}" ADD CONSTRAINT "Components_tenantId_name_instance_key"
         UNIQUE ("name", "instance", "tenantId")`,
      { type: QueryTypes.RAW },
    );
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "components_tenantId_name" ON "${TABLE_NAME}"
         ("tenantId", "name") WHERE "instance" IS NULL`,
      { type: QueryTypes.RAW },
    );
  },
};
