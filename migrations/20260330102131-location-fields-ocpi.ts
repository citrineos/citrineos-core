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

    if (!tableDescription.ocpiId) {
      await queryInterface.addColumn('Locations', 'ocpiId', {
        type: DataTypes.STRING(36),
        allowNull: true,
      });
    }

    if (!tableDescription.publishAllowedTo) {
      await queryInterface.addColumn('Locations', 'publishAllowedTo', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.energyMix) {
      await queryInterface.addColumn('Locations', 'energyMix', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.relatedLocations) {
      await queryInterface.addColumn('Locations', 'relatedLocations', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.directions) {
      await queryInterface.addColumn('Locations', 'directions', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.operator) {
      await queryInterface.addColumn('Locations', 'operator', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.suboperator) {
      await queryInterface.addColumn('Locations', 'suboperator', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.owner) {
      await queryInterface.addColumn('Locations', 'owner', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.chargingWhenClosed) {
      await queryInterface.addColumn('Locations', 'chargingWhenClosed', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      });
    }

    if (!tableDescription.images) {
      await queryInterface.addColumn('Locations', 'images', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    // Add unique constraint on (ocpiId, ownerTenantPartnerId) — required by Hasura on_conflict
    await queryInterface.addConstraint('Locations', {
      fields: ['ocpiId', 'ownerTenantPartnerId'],
      type: 'unique',
      name: 'locations_ocpi_id_partner_unique',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint('Locations', 'locations_ocpi_id_partner_unique');

    const tableDescription = await queryInterface.describeTable('Locations');

    if (tableDescription.images) await queryInterface.removeColumn('Locations', 'images');
    if (tableDescription.chargingWhenClosed)
      await queryInterface.removeColumn('Locations', 'chargingWhenClosed');
    if (tableDescription.owner) await queryInterface.removeColumn('Locations', 'owner');
    if (tableDescription.suboperator) await queryInterface.removeColumn('Locations', 'suboperator');
    if (tableDescription.operator) await queryInterface.removeColumn('Locations', 'operator');
    if (tableDescription.directions) await queryInterface.removeColumn('Locations', 'directions');
    if (tableDescription.relatedLocations)
      await queryInterface.removeColumn('Locations', 'relatedLocations');
    if (tableDescription.energyMix) await queryInterface.removeColumn('Locations', 'energyMix');
    if (tableDescription.publishAllowedTo)
      await queryInterface.removeColumn('Locations', 'publishAllowedTo');
    if (tableDescription.ocpiId) await queryInterface.removeColumn('Locations', 'ocpiId');
    if (tableDescription.ownerTenantPartnerId)
      await queryInterface.removeColumn('Locations', 'ownerTenantPartnerId');
  },
};
