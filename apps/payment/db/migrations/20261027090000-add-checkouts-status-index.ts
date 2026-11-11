// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface } from 'sequelize';

// The reconciliation sweep looks checkouts up by status and how long ago they changed.
/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addIndex('Checkouts', ['status', 'updatedAt'], {
      name: 'checkouts_status_updated',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex('Checkouts', 'checkouts_status_updated');
  },
};
