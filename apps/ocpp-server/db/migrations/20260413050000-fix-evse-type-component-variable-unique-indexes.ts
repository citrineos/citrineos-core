// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

// EvseTypes: the schema-fix migration created this table without any unique
// constraints. The model defines (id, connectorId) uniqueness, but it was never
// applied via migration and lacks tenantId.
//
// Components / Variables: the initial migration created inline UNIQUE (name, instance)
// constraints and partial indexes on (name) WHERE instance IS NULL, both without
// tenantId, preventing different tenants from sharing the same component or variable names.
//
// This migration adds tenantId to all three tables' unique constraints.
export default {
  up: async (queryInterface: QueryInterface) => {
    // ── EvseTypes ──────────────────────────────────────────────────────────────
    console.log('Adding tenantId-inclusive unique constraints to EvseTypes...');

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'evse_types_tenantId_id_connectorId' AND conrelid = '"EvseTypes"'::regclass) THEN
          ALTER TABLE "EvseTypes" ADD CONSTRAINT "evse_types_tenantId_id_connectorId" UNIQUE ("tenantId", "id", "connectorId");
        END IF;
      END $$
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "evse_types_tenantId_id"
        ON "EvseTypes" ("tenantId", "id")
        WHERE "connectorId" IS NULL
    `);

    // ── Components ─────────────────────────────────────────────────────────────
    console.log('Replacing Components unique constraints with tenantId-inclusive versions...');

    // The inline UNIQUE (name, instance) is auto-named by PostgreSQL.
    await queryInterface.sequelize.query(
      `ALTER TABLE "Components" DROP CONSTRAINT IF EXISTS "Components_name_instance_key"`,
    );
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "components_name"`);
    // Drop the misnamed constraint left behind by a failed prior run.
    await queryInterface.sequelize.query(
      `ALTER TABLE "Components" DROP CONSTRAINT IF EXISTS "tenantId_name_instance"`,
    );

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

    // ── Variables ──────────────────────────────────────────────────────────────
    console.log('Replacing Variables unique constraints with tenantId-inclusive versions...');

    await queryInterface.sequelize.query(
      `ALTER TABLE "Variables" DROP CONSTRAINT IF EXISTS "Variables_name_instance_key"`,
    );
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "variables_name"`);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'variables_tenantId_name_instance' AND conrelid = '"Variables"'::regclass) THEN
          ALTER TABLE "Variables" ADD CONSTRAINT "variables_tenantId_name_instance" UNIQUE ("tenantId", "name", "instance");
        END IF;
      END $$
    `);
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variables_tenantId_name"
        ON "Variables" ("tenantId", "name")
        WHERE "instance" IS NULL
    `);

    console.log('Successfully updated EvseTypes, Components, and Variables unique constraints.');
  },

  down: async (queryInterface: QueryInterface) => {
    // ── EvseTypes ──────────────────────────────────────────────────────────────
    await queryInterface.sequelize.query(
      `ALTER TABLE "EvseTypes" DROP CONSTRAINT IF EXISTS "evse_types_tenantId_id_connectorId"`,
    );
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "evse_types_tenantId_id"`);

    // ── Components ─────────────────────────────────────────────────────────────
    await queryInterface.sequelize.query(
      `ALTER TABLE "Components" DROP CONSTRAINT IF EXISTS "components_tenantId_name_instance"`,
    );
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "components_tenantId_name"`);

    await queryInterface.sequelize.query(
      `ALTER TABLE "Components" ADD CONSTRAINT "Components_name_instance_key" UNIQUE ("name", "instance")`,
    );
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "components_name"
        ON "Components" ("name")
        WHERE "instance" IS NULL
    `);

    // ── Variables ──────────────────────────────────────────────────────────────
    await queryInterface.sequelize.query(
      `ALTER TABLE "Variables" DROP CONSTRAINT IF EXISTS "variables_tenantId_name_instance"`,
    );
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "variables_tenantId_name"`);

    await queryInterface.sequelize.query(
      `ALTER TABLE "Variables" ADD CONSTRAINT "Variables_name_instance_key" UNIQUE ("name", "instance")`,
    );
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variables_name"
        ON "Variables" ("name")
        WHERE "instance" IS NULL
    `);

    console.log('Successfully reverted EvseTypes, Components, and Variables unique constraints.');
  },
};
