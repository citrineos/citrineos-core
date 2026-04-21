// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import type { QueryInterface } from 'sequelize';

const TABLE = { tableName: 'Authorizations', schema: 'public' } as const;
const CONSTRAINT_NAME = 'authorizations_idtoken_idtokentype_key';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addConstraint(TABLE, {
      fields: ['idToken', 'idTokenType'],
      type: 'unique',
      name: CONSTRAINT_NAME,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint(TABLE, CONSTRAINT_NAME);
  },
};
