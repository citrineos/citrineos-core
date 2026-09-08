// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // First check if the index already exists
    console.log('Checking if index idToken_type already exists...');
    const [indexes] = await queryInterface.sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'Authorizations' 
      AND indexname = 'idToken_type'
    `);

    if (indexes.length > 0) {
      console.log('Index idToken_type already exists, skipping creation');
      return;
    }

    console.log('Checking for duplicate idToken/idTokenType combinations...');

    // Check for duplicates before creating the index
    const [duplicates] = await queryInterface.sequelize.query(`
      SELECT "idToken", "idTokenType", COUNT(*) as count
      FROM "Authorizations"
      WHERE "idToken" IS NOT NULL
      GROUP BY "idToken", "idTokenType"
      HAVING COUNT(*) > 1
      ORDER BY "idToken", "idTokenType"
    `);

    if (duplicates.length > 0) {
      console.error('Cannot create unique index due to duplicate data:');
      duplicates.forEach((dup: any) => {
        console.error(
          `  - idToken: "${dup.idToken}", idTokenType: "${dup.idTokenType}", count: ${dup.count}`,
        );
      });
      throw new Error(
        `Migration failed: Found ${duplicates.length} duplicate idToken/idTokenType combinations. ` +
          'Please resolve these duplicates before running this migration. ' +
          'You may need t`o` update or remove duplicate records in the Authorizations table.',
      );
    }

    console.log('No duplicates found. Proceeding with index creation...');

    await queryInterface.addIndex('Authorizations', ['idToken', 'idTokenType'], {
      unique: true,
      name: 'idToken_type',
    });
    console.log('Successfully created unique index: idToken_type');
  },

  down: async (queryInterface: QueryInterface) => {
    console.log('Removing unique index on idToken and idTokenType columns...');
    try {
      await queryInterface.removeIndex('Authorizations', 'idToken_type');
      console.log('Successfully removed unique index: idToken_type');
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log('Index idToken_type does not exist, skipping removal');
        return;
      }
      throw error;
    }
  },
};
