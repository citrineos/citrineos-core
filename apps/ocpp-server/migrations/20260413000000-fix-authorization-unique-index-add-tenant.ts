// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Drop the existing index that does not include tenantId, which prevents
    // different tenants from using the same idToken+idTokenType combination.
    console.log('Dropping index idToken_type (missing tenantId)...');
    try {
      await queryInterface.removeIndex('Authorizations', 'idToken_type');
      console.log('Successfully dropped index: idToken_type');
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log('Index idToken_type does not exist, skipping removal');
      } else {
        throw error;
      }
    }

    console.log('Checking for duplicate tenantId/idToken/idTokenType combinations...');

    const [duplicates] = await queryInterface.sequelize.query(`
      SELECT "tenantId", "idToken", "idTokenType", COUNT(*) as count
      FROM "Authorizations"
      WHERE "idToken" IS NOT NULL
      GROUP BY "tenantId", "idToken", "idTokenType"
      HAVING COUNT(*) > 1
      ORDER BY "tenantId", "idToken", "idTokenType"
    `);

    if (duplicates.length > 0) {
      console.error('Cannot create unique index due to duplicate data:');
      duplicates.forEach((dup: any) => {
        console.error(
          `  - tenantId: "${dup.tenantId}", idToken: "${dup.idToken}", idTokenType: "${dup.idTokenType}", count: ${dup.count}`,
        );
      });
      throw new Error(
        `Migration failed: Found ${duplicates.length} duplicate tenantId/idToken/idTokenType combinations. ` +
          'Please resolve these duplicates before running this migration. ' +
          'You may need to update or remove duplicate records in the Authorizations table.',
      );
    }

    console.log('No duplicates found. Proceeding with index creation...');

    await queryInterface.addIndex('Authorizations', ['tenantId', 'idToken', 'idTokenType'], {
      unique: true,
      name: 'idToken_type',
    });
    console.log('Successfully created unique index: idToken_type');
  },

  down: async (queryInterface: QueryInterface) => {
    console.log('Reverting to index without tenantId...');

    try {
      await queryInterface.removeIndex('Authorizations', 'idToken_type');
      console.log('Successfully dropped index: idToken_type');
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log('Index idToken_type does not exist, skipping removal');
      } else {
        throw error;
      }
    }

    await queryInterface.addIndex('Authorizations', ['idToken', 'idTokenType'], {
      unique: true,
      name: 'idToken_type',
    });
    console.log('Successfully recreated original index: idToken_type');
  },
};
