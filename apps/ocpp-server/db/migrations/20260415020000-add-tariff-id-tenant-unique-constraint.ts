// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addConstraint('Tariffs', {
      fields: ['tariffId', 'tenantId'],
      type: 'unique',
      name: 'tariffId_tenantId',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint('Tariffs', 'tariffId_tenantId');
  },
};
