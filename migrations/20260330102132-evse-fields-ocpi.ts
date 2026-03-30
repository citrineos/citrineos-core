// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable('Evses');

    if (!tableDescription.capabilities) {
      await queryInterface.addColumn('Evses', 'capabilities', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.images) {
      await queryInterface.addColumn('Evses', 'images', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.directions) {
      await queryInterface.addColumn('Evses', 'directions', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.floorLevel) {
      await queryInterface.addColumn('Evses', 'floorLevel', {
        type: DataTypes.STRING(4),
        allowNull: true,
      });
    }

    if (!tableDescription.coordinates) {
      await queryInterface.addColumn('Evses', 'coordinates', {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: true,
      });
    }

    if (!tableDescription.parkingRestrictions) {
      await queryInterface.addColumn('Evses', 'parkingRestrictions', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.statusSchedule) {
      await queryInterface.addColumn('Evses', 'statusSchedule', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    if (!tableDescription.ocpiUid) {
      await queryInterface.addColumn('Evses', 'ocpiUid', {
        type: DataTypes.STRING(36),
        allowNull: true,
      });
    }

    // Add unique constraint on (ocpiUid, stationId) — required by Hasura on_conflict
    await queryInterface.addConstraint('Evses', {
      fields: ['ocpiUid', 'stationId'],
      type: 'unique',
      name: 'evses_ocpi_uid_station_unique',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint('Evses', 'evses_ocpi_uid_station_unique');

    const tableDescription = await queryInterface.describeTable('Evses');

    if (tableDescription.ocpiUid) await queryInterface.removeColumn('Evses', 'ocpiUid');
    if (tableDescription.statusSchedule)
      await queryInterface.removeColumn('Evses', 'statusSchedule');
    if (tableDescription.parkingRestrictions)
      await queryInterface.removeColumn('Evses', 'parkingRestrictions');
    if (tableDescription.coordinates) await queryInterface.removeColumn('Evses', 'coordinates');
    if (tableDescription.floorLevel) await queryInterface.removeColumn('Evses', 'floorLevel');
    if (tableDescription.directions) await queryInterface.removeColumn('Evses', 'directions');
    if (tableDescription.images) await queryInterface.removeColumn('Evses', 'images');
    if (tableDescription.capabilities) await queryInterface.removeColumn('Evses', 'capabilities');
  },
};
