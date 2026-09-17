// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    console.log('Updating Certificates unique constraints to include tenantId...');

    await queryInterface.sequelize.query(
      `ALTER TABLE "Certificates" DROP CONSTRAINT IF EXISTS "serialNumber_issuerName"`,
    );
    await queryInterface.sequelize.query(`
      ALTER TABLE "Certificates"
        ADD CONSTRAINT "tenantId_serialNumber_issuerName"
        UNIQUE ("tenantId", "serialNumber", "issuerName")
    `);

    // The certificateFileHash constraint was created by addColumn with unique: true,
    // which auto-names the constraint as Certificates_certificateFileHash_key.
    await queryInterface.sequelize.query(
      `ALTER TABLE "Certificates" DROP CONSTRAINT IF EXISTS "Certificates_certificateFileHash_key"`,
    );
    await queryInterface.sequelize.query(`
      ALTER TABLE "Certificates"
        ADD CONSTRAINT "tenantId_certificateFileHash"
        UNIQUE ("tenantId", "certificateFileHash")
    `);

    console.log('Successfully updated Certificates unique constraints.');
  },

  down: async (queryInterface: QueryInterface) => {
    console.log('Reverting Certificates unique constraints...');

    await queryInterface.sequelize.query(
      `ALTER TABLE "Certificates" DROP CONSTRAINT IF EXISTS "tenantId_serialNumber_issuerName"`,
    );
    await queryInterface.sequelize.query(`
      ALTER TABLE "Certificates"
        ADD CONSTRAINT "serialNumber_issuerName"
        UNIQUE ("serialNumber", "issuerName")
    `);

    await queryInterface.sequelize.query(
      `ALTER TABLE "Certificates" DROP CONSTRAINT IF EXISTS "tenantId_certificateFileHash"`,
    );
    await queryInterface.sequelize.query(`
      ALTER TABLE "Certificates"
        ADD CONSTRAINT "Certificates_certificateFileHash_key"
        UNIQUE ("certificateFileHash")
    `);

    console.log('Successfully reverted Certificates unique constraints.');
  },
};
