// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    console.log('Fixing Certificates.signedBy column type from VARCHAR to INTEGER...');

    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      // Drop the self-referencing FK before altering the column type.
      // PostgreSQL cannot change the type of a column that is part of a FK constraint.
      await q(`ALTER TABLE "Certificates" DROP CONSTRAINT IF EXISTS "Certificates_signedBy_fkey"`);

      // Cast the existing values to INTEGER.  Any existing rows with a non-numeric
      // signedBy value will raise an error here, which is the correct behaviour
      // (it would indicate pre-existing data corruption).
      await q(`
        ALTER TABLE "Certificates"
          ALTER COLUMN "signedBy" TYPE INTEGER
          USING "signedBy"::INTEGER
      `);

      // Re-add the self-referencing FK now that both sides are INTEGER.
      await q(`
        ALTER TABLE "Certificates"
          ADD CONSTRAINT "Certificates_signedBy_fkey"
          FOREIGN KEY ("signedBy")
          REFERENCES "Certificates" ("id")
          ON UPDATE CASCADE
          ON DELETE NO ACTION
      `);
    });

    console.log('Successfully fixed Certificates.signedBy column type.');
  },

  down: async (queryInterface: QueryInterface) => {
    console.log('Reverting Certificates.signedBy column type from INTEGER to VARCHAR...');

    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      await q(`ALTER TABLE "Certificates" DROP CONSTRAINT IF EXISTS "Certificates_signedBy_fkey"`);

      await q(`
        ALTER TABLE "Certificates"
          ALTER COLUMN "signedBy" TYPE VARCHAR
          USING "signedBy"::VARCHAR
      `);

      // Note: the original broken schema had a VARCHAR FK referencing an INTEGER id,
      // which is why this constraint could never be created.  The down migration
      // reverts the column type only; the broken FK is intentionally not restored.
    });

    console.log('Successfully reverted Certificates.signedBy column type.');
  },
};
