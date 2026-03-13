// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const migrationName = '20250714120500-create-tenant-partner-table';

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

    await queryInterface.createTable('TenantPartners', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      partyId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      countryCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id',
        },
        defaultValue: DEFAULT_TENANT_ID,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      partnerProfileOCPI: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('TenantPartners');
  },
};
