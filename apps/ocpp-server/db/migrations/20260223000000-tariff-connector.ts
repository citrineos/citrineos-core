// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Add tariffId FK to Connectors so each connector can reference at most one reusable tariff
    await queryInterface.addColumn('Connectors', 'tariffId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Tariffs', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Migrate existing data: for Tariffs that had a connectorId set, populate
    // Connectors.tariffId with that tariff's id before dropping the old columns.
    await queryInterface.sequelize.query(`
      UPDATE "Connectors" c
      SET    "tariffId" = t.id
      FROM   "Tariffs" t
      WHERE  t."connectorId" = c.id;
    `);

    // Drop the old FK constraint and station/connector columns from Tariffs
    await queryInterface.sequelize.query(
      'ALTER TABLE "Tariffs" DROP CONSTRAINT IF EXISTS "Tariffs_connectorId_fkey";',
    );
    await queryInterface.removeColumn('Tariffs', 'connectorId');
    await queryInterface.removeColumn('Tariffs', 'stationId');
  },

  down: async (queryInterface: QueryInterface) => {
    // Restore stationId and connectorId columns on Tariffs
    await queryInterface.addColumn('Tariffs', 'stationId', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'connectorId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE "Tariffs" ADD CONSTRAINT "Tariffs_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connectors" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );

    // Remove tariffId from Connectors
    await queryInterface.removeColumn('Connectors', 'tariffId');
  },
};
