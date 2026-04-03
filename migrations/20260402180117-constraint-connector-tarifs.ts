// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Remove the incorrect unique constraint based on ocpiIds
    await queryInterface.removeConstraint('ConnectorTariffs', 'connector_tariffs_unique');

    // Replace with correct constraint scoped to DB surrogate keys
    await queryInterface.addConstraint('ConnectorTariffs', {
      fields: ['connectorId', 'tariffId', 'tenantPartnerId'],
      type: 'unique',
      name: 'connector_tariffs_unique',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint('ConnectorTariffs', 'connector_tariffs_unique');

    await queryInterface.addConstraint('ConnectorTariffs', {
      fields: ['connectorOcpiId', 'tariffOcpiId', 'tenantPartnerId'],
      type: 'unique',
      name: 'connector_tariffs_unique',
    });
  },
};
