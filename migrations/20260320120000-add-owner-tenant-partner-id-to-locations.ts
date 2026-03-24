// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable('Locations');
    if (!tableDescription.ownerTenantPartnerId) {
      await queryInterface.addColumn('Locations', 'ownerTenantPartnerId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'TenantPartners',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable('Locations');
    if (tableDescription.ownerTenantPartnerId) {
      await queryInterface.removeColumn('Locations', 'ownerTenantPartnerId');
    }
  },
};
