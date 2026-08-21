// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

const TABLE_NAME = 'Authorizations';
const NAME = 'idToken_type';
const COLUMNS = '"tenantId", "idToken", "idTokenType"';

// sync() names the constraint it derives from the model's `unique: 'idToken_type'` group after the
// table and columns, so a database built that way carries a different name from a migrated one.
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
  // A plain unique index shares the namespace but is not a constraint, so it needs its own drop.
  await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${NAME}"`, { type: QueryTypes.RAW });
};

export default {
  // Two defects share one cause: uniqueness was expressed as a unique INDEX over three columns,
  // one of which is nullable.
  //
  // Postgres treats NULLs in a unique index as distinct from one another, so the index does not
  // constrain rows whose idTokenType is null - the same token can be inserted repeatedly. OCPP 1.6
  // then resolves an idTag against every row carrying that string and refuses the token outright
  // once more than one comes back, so a duplicate silently and permanently deauthorises it.
  //
  // Separately, Hasura resolves `on_conflict` against unique CONSTRAINTS. An index is not one, so
  // an upsert naming this target fails at runtime and callers are pushed into a query-then-insert
  // that races. NULLS NOT DISTINCT closes the first; expressing it as a constraint closes the
  // second.
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
