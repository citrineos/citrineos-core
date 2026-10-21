// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

// A component's identity includes its EVSE: keying on (tenantId, name, instance) alone
// collapsed every EVSE's Connector component onto one row. instance and evseDatabaseId
// are nullable and Postgres treats NULLs as distinct, so one partial index per nullable
// combination is needed. Widening a key only admits more rows, so existing data is safe.
export default {
  up: async (queryInterface: QueryInterface) => {
    console.log('Adding evseDatabaseId to the Components unique constraints...');

    await queryInterface.sequelize.query(
      `ALTER TABLE "Components" DROP CONSTRAINT IF EXISTS "components_tenantId_name_instance"`,
    );
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "components_tenantId_name"`);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'components_tenantId_name_instance_evseDatabaseId' AND conrelid = '"Components"'::regclass) THEN
          ALTER TABLE "Components" ADD CONSTRAINT "components_tenantId_name_instance_evseDatabaseId" UNIQUE ("tenantId", "name", "instance", "evseDatabaseId");
        END IF;
      END $$
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "components_tenantId_name_evseDatabaseId"
        ON "Components" ("tenantId", "name", "evseDatabaseId")
        WHERE "instance" IS NULL
    `);
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "components_tenantId_name_instance"
        ON "Components" ("tenantId", "name", "instance")
        WHERE "evseDatabaseId" IS NULL
    `);
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "components_tenantId_name"
        ON "Components" ("tenantId", "name")
        WHERE "instance" IS NULL AND "evseDatabaseId" IS NULL
    `);

    console.log('Successfully added evseDatabaseId to the Components unique constraints.');
  },

  down: async (queryInterface: QueryInterface) => {
    console.log('Reverting the Components unique constraints to the pre-EVSE key...');

    await queryInterface.sequelize.query(
      `ALTER TABLE "Components" DROP CONSTRAINT IF EXISTS "components_tenantId_name_instance_evseDatabaseId"`,
    );
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "components_tenantId_name_evseDatabaseId"`,
    );
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "components_tenantId_name_instance"`,
    );
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "components_tenantId_name"`);

    // Narrowing the key back can fail on rows this migration made legal. Deliberately
    // not deleting them: a rollback must not silently discard device model data.
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'components_tenantId_name_instance' AND conrelid = '"Components"'::regclass) THEN
          ALTER TABLE "Components" ADD CONSTRAINT "components_tenantId_name_instance" UNIQUE ("tenantId", "name", "instance");
        END IF;
      END $$
    `);
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "components_tenantId_name"
        ON "Components" ("tenantId", "name")
        WHERE "instance" IS NULL
    `);

    console.log('Successfully reverted the Components unique constraints.');
  },
};
