// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

// The initial migration created 7 partial unique indexes on VariableAttributes using
// stationId without tenantId, preventing different tenants from using the same
// variable attribute combinations. The 20260330000000-add-charging-station-pk-id
// migration replaced one of them (the all-null case) and the unconditional constraint
// with stationPkId-based equivalents, but left the remaining 6 partial indexes
// using stationId. This migration drops those and recreates them using stationPkId,
// which is a FK to ChargingStations(pkId) — globally unique per station-tenant pair —
// making the constraints effectively per-tenant.
export default {
  up: async (queryInterface: QueryInterface) => {
    const dropIndex = async (name: string) => {
      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${name}"`);
    };

    const oldIndexes = [
      'variable_attributes_station_id_type',
      'variable_attributes_station_id_variable_id',
      'variable_attributes_station_id_component_id',
      'variable_attributes_station_id_type_variable_id',
      'variable_attributes_station_id_type_component_id',
      'variable_attributes_station_id_variable_id_component_id',
    ];

    for (const name of oldIndexes) {
      console.log(`Dropping index ${name}...`);
      await dropIndex(name);
    }

    console.log('Creating stationPkId-based partial unique indexes...');

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_stationPkId_type"
        ON "VariableAttributes" ("stationPkId", "type")
        WHERE "variableId" IS NULL AND "componentId" IS NULL
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_stationPkId_variableId"
        ON "VariableAttributes" ("stationPkId", "variableId")
        WHERE "type" IS NULL AND "componentId" IS NULL
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_stationPkId_componentId"
        ON "VariableAttributes" ("stationPkId", "componentId")
        WHERE "type" IS NULL AND "variableId" IS NULL
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_stationPkId_type_variableId"
        ON "VariableAttributes" ("stationPkId", "type", "variableId")
        WHERE "componentId" IS NULL
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_stationPkId_type_componentId"
        ON "VariableAttributes" ("stationPkId", "type", "componentId")
        WHERE "variableId" IS NULL
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_stationPkId_variableId_componentId"
        ON "VariableAttributes" ("stationPkId", "variableId", "componentId")
        WHERE "type" IS NULL
    `);

    console.log('Successfully recreated VariableAttributes partial indexes with stationPkId.');
  },

  down: async (queryInterface: QueryInterface) => {
    const dropIndex = async (name: string) => {
      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${name}"`);
    };

    const newIndexes = [
      'variable_attributes_stationPkId_type',
      'variable_attributes_stationPkId_variableId',
      'variable_attributes_stationPkId_componentId',
      'variable_attributes_stationPkId_type_variableId',
      'variable_attributes_stationPkId_type_componentId',
      'variable_attributes_stationPkId_variableId_componentId',
    ];

    for (const name of newIndexes) {
      console.log(`Dropping index ${name}...`);
      await dropIndex(name);
    }

    console.log('Recreating original stationId-based partial unique indexes...');

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_station_id_type"
        ON "VariableAttributes" ("stationId", "type")
        WHERE "variableId" IS NULL AND "componentId" IS NULL
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_station_id_variable_id"
        ON "VariableAttributes" ("stationId", "variableId")
        WHERE "type" IS NULL AND "componentId" IS NULL
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_station_id_component_id"
        ON "VariableAttributes" ("stationId", "componentId")
        WHERE "type" IS NULL AND "variableId" IS NULL
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_station_id_type_variable_id"
        ON "VariableAttributes" ("stationId", "type", "variableId")
        WHERE "componentId" IS NULL
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_station_id_type_component_id"
        ON "VariableAttributes" ("stationId", "type", "componentId")
        WHERE "variableId" IS NULL
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_station_id_variable_id_component_id"
        ON "VariableAttributes" ("stationId", "variableId", "componentId")
        WHERE "type" IS NULL
    `);

    console.log('Successfully restored original stationId-based partial indexes.');
  },
};
