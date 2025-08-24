'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';
import { DEFAULT_TENANT_ID } from '@citrineos/base';

const TABLE_NAME = 'AsyncJobStatuses';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Create enum type for AsyncJobName
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'enum_AsyncJobStatuses_jobName'
        ) THEN
          CREATE TYPE "enum_AsyncJobStatuses_jobName" AS ENUM (
            'FETCH_OCPI_TOKENS'
          );
        END IF;
      END$$;
    `);

    await queryInterface.createTable(TABLE_NAME, {
      jobId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      jobName: {
        type: DataTypes.ENUM('FETCH_OCPI_TOKENS'),
        allowNull: false,
      },
      mspCountryCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mspPartyId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cpoCountryCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cpoPartyId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tenantPartnerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      finishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      stoppedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      stopScheduled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isFailed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      paginationParams: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      totalObjects: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: DEFAULT_TENANT_ID,
        references: {
          model: 'Tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable(TABLE_NAME);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_AsyncJobStatuses_jobName";
    `);
  },
};
