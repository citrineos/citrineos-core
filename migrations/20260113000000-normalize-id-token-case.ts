// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    console.log('Normalizing existing idToken values to lowercase...');

    // Update all existing idToken values to lowercase
    await queryInterface.sequelize.query(`
      UPDATE "Authorizations" 
      SET "idToken" = LOWER("idToken") 
      WHERE "idToken" IS NOT NULL
    `);

    console.log('Successfully normalized all idToken values to lowercase.');
  },

  down: async () => {
    // No automatic rollback possible since we don't know the original casing
  },
};
