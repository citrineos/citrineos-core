// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

const TABLE_NAME = 'Authorizations';
const NAME = 'idToken_type';
const COLUMNS = '"tenantId", "idToken", "idTokenType"';

const SYNC_DERIVED_NAME = 'Authorizations_idToken_idTokenType_tenantId_key';

const constraintExists = async (queryInterface: QueryInterface, name: string): Promise<boolean> => {
  const rows = await queryInterface.sequelize.query(
    `SELECT 1 FROM information_schema.table_constraints
       WHERE table_schema = 'public' AND table_name = :table AND constraint_name = :name`,
    { replacements: { table: TABLE_NAME, name }, type: QueryTypes.SELECT },
  );
  return rows.length > 0;
};

const dropUniqueness = async (queryInterface: QueryInterface) => {
  for (const name of [NAME, SYNC_DERIVED_NAME]) {
    if (await constraintExists(queryInterface, name)) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE_NAME}" DROP CONSTRAINT "${name}"`,
        { type: QueryTypes.RAW },
      );
    }
  }
  await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${NAME}"`, { type: QueryTypes.RAW });
};

export default {
  up: async (queryInterface: QueryInterface) => {
    const duplicates = await queryInterface.sequelize.query<{
      tenantId: number;
      idToken: string;
      idTokenType: string | null;
      count: string;
    }>(
      `SELECT "tenantId", "idToken", "idTokenType", COUNT(*) AS count
         FROM "${TABLE_NAME}"
        GROUP BY "tenantId", "idToken", "idTokenType"
       HAVING COUNT(*) > 1
        ORDER BY "tenantId", "idToken"`,
      { type: QueryTypes.SELECT },
    );

    if (duplicates.length > 0) {
      const listed = duplicates
        .map(
          (row) =>
            `  - tenantId: ${row.tenantId}, idToken: "${row.idToken}", idTokenType: ${
              row.idTokenType === null ? 'NULL' : `"${row.idTokenType}"`
            }, count: ${row.count}`,
        )
        .join('\n');
      throw new Error(
        `Migration failed: found ${duplicates.length} duplicate tenantId/idToken/idTokenType ` +
          `combinations in "${TABLE_NAME}". These are rows the previous unique index permitted ` +
          `because it treated NULL idTokenType values as distinct. Resolve them before ` +
          `migrating:\n${listed}`,
      );
    }

    await dropUniqueness(queryInterface);

    await queryInterface.sequelize.query(
      `ALTER TABLE "${TABLE_NAME}" ADD CONSTRAINT "${NAME}" UNIQUE NULLS NOT DISTINCT (${COLUMNS})`,
      { type: QueryTypes.RAW },
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await dropUniqueness(queryInterface);

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX "${NAME}" ON "${TABLE_NAME}" (${COLUMNS})`,
      { type: QueryTypes.RAW },
    );
  },
};
