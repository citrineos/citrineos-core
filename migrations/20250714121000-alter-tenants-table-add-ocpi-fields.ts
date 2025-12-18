// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const migrationName = '20250714121000-alter-tenants-table-add-ocpi-fields';

    const [results] = await queryInterface.sequelize.query(
      `SELECT EXISTS (
      SELECT 1 
      FROM "SequelizeMeta" 
      WHERE name LIKE :pattern
    ) AS migration_exists`,
      {
        replacements: { pattern: `${migrationName}%` },
        type: QueryTypes.SELECT,
      },
    );

    if ((results as any).migration_exists) {
      console.log('Migration already run, skipping...');
      return;
    }

    await queryInterface.addColumn('Tenants', 'partyId', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    });
    await queryInterface.addColumn('Tenants', 'countryCode', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'US',
    });
    await queryInterface.addColumn('Tenants', 'url', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Tenants', 'serverProfileOCPI', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Tenants', 'partyId');
    await queryInterface.removeColumn('Tenants', 'countryCode');
    await queryInterface.removeColumn('Tenants', 'url');
    await queryInterface.removeColumn('Tenants', 'serverProfileOCPI');
  },
};
