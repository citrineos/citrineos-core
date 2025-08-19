'use strict';

import { QueryInterface, DataTypes } from 'sequelize';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { Tenant } from '@citrineos/data';

/**
 * CitrineOS v1.8.0 Consolidated Migration
 *
 * This migration consolidates all database schema changes for version 1.8.0:
 * - Multi-tenant support with Tenants table
 * - Authorization schema flattening
 * - Async job status tracking
 * - Tenant partner relationships
 * - OCPI field enhancements
 *
 * This replaces individual migrations:
 * - 20250430105500-create-tenants-table.ts
 * - 20250430110000-create-default-tenant.ts
 * - 20250430130000-update-existing-tables-to-include-default-tenant.ts
 * - 20250618150000-update-authorizations-to-include-concurrenttransaction.ts
 * - 20250618150800-update-existing-authorization-to-include-realtimeauth.ts
 * - 20250621120000-flatten-authorization.ts
 * - 20250714120500-create-tenant-partner-table.ts
 * - 20250714121000-alter-tenants-table-add-ocpi-fields.ts
 * - 20250715000000-create-async-job-status.ts
 */

const TENANTS_TABLE = `${Tenant.MODEL_NAME}s`;
const TENANT_COLUMN = 'tenantId';

// All tables that need tenant support
const TABLES_REQUIRING_TENANT = [
  'AdditionalInfos',
  'IdTokens',
  'IdTokenInfos',
  'Authorizations',
  'Boots',
  'Certificates',
  'InstalledCertificates',
  'ChangeConfigurations',
  'Evses',
  'Locations',
  'ChargingStations',
  'Transactions',
  'ChargingNeeds',
  'ChargingProfiles',
  'ChargingSchedules',
  'ServerNetworkProfiles',
  'SetNetworkProfiles',
  'ChargingStationNetworkProfiles',
  'ChargingStationSecurityInfos',
  'ChargingStationSequences',
  'Components',
  'Variables',
  'ComponentVariables',
  'CompositeSchedules',
  'Connectors',
  'EventData',
  'IdTokenAdditionalInfos',
  'TransactionEvents',
  'StopTransactions',
  'MeterValues',
  'MessageInfos',
  'OCPPMessages',
  'Reservations',
  'SalesTariffs',
  'SecurityEvents',
  'StartTransactions',
  'StatusNotifications',
  'LatestStatusNotifications',
  'Subscriptions',
  'Tariffs',
  'VariableAttributes',
  'VariableCharacteristics',
  'VariableMonitorings',
  'VariableMonitoringStatuses',
  'VariableStatuses',
  'LocalListAuthorizations',
  'LocalListVersions',
  'LocalListVersionAuthorizations',
  'SendLocalLists',
  'SendLocalListAuthorizations',
];

export = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Starting CitrineOS v1.8.0 consolidated migration...');

      // =====================================
      // 1. CREATE TENANTS TABLE & DEFAULT TENANT
      // =====================================
      console.log('Creating Tenants table...');
      await queryInterface.createTable(
        TENANTS_TABLE,
        {
          id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          url: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          // OCPI fields
          countryCode: {
            type: DataTypes.STRING(2),
            allowNull: true,
          },
          partyId: {
            type: DataTypes.STRING(3),
            allowNull: true,
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
        },
        { transaction },
      );

      console.log('Creating default tenant...');
      const [[existingTenant]] = await queryInterface.sequelize.query(
        `SELECT 1 FROM "${TENANTS_TABLE}" WHERE id = ${DEFAULT_TENANT_ID} LIMIT 1`,
        { transaction },
      );

      if (!existingTenant) {
        await queryInterface.bulkInsert(
          TENANTS_TABLE,
          [
            {
              id: DEFAULT_TENANT_ID,
              name: 'Default Tenant',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction },
        );
      }

      // =====================================
      // 2. CREATE TENANT PARTNER TABLE
      // =====================================
      console.log('Creating TenantPartner table...');
      await queryInterface.createTable(
        'TenantPartners',
        {
          id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          tenantId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: TENANTS_TABLE,
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          partyId: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          countryCode: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          partnerProfile: {
            type: DataTypes.JSONB,
            allowNull: true,
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
        },
        { transaction },
      );

      // =====================================
      // 3. CREATE ASYNC JOB STATUS TABLE
      // =====================================
      console.log('Creating AsyncJobStatus table...');

      // Create enum type for AsyncJobName
      await queryInterface.sequelize.query(
        `
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
      `,
        { transaction },
      );

      await queryInterface.createTable(
        'AsyncJobStatuses',
        {
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
          paginatedParams: {
            type: DataTypes.JSONB,
            allowNull: true,
          },
          totalObjects: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
        },
        { transaction },
      );

      // =====================================
      // 4. ADD TENANT SUPPORT TO EXISTING TABLES
      // =====================================
      console.log('Adding tenant support to existing tables...');

      for (const table of TABLES_REQUIRING_TENANT) {
        try {
          const tableDescription = await queryInterface.describeTable(table);
          if (!tableDescription[TENANT_COLUMN]) {
            console.log(`Adding tenantId to ${table}...`);
            await queryInterface.addColumn(
              table,
              TENANT_COLUMN,
              {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: DEFAULT_TENANT_ID,
                references: {
                  model: TENANTS_TABLE,
                  key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
              },
              { transaction },
            );
          }
        } catch (_error) {
          console.warn(`Table ${table} does not exist, skipping tenant column addition`);
        }
      }

      // =====================================
      // 5. AUTHORIZATION SCHEMA FLATTENING
      // =====================================
      console.log('Performing authorization schema flattening...');

      // First, preserve existing data in temp tables
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS "IdTokens_temp"', { transaction });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS "IdTokenInfos_temp"', {
        transaction,
      });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS "AdditionalInfos_temp"', {
        transaction,
      });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Authorizations_temp"', {
        transaction,
      });

      await queryInterface.sequelize.query(`CREATE TABLE "IdTokens_temp" AS TABLE "IdTokens";`, {
        transaction,
      });
      await queryInterface.sequelize.query(
        `CREATE TABLE "IdTokenInfos_temp" AS TABLE "IdTokenInfos";`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `CREATE TABLE "AdditionalInfos_temp" AS TABLE "AdditionalInfos";`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `CREATE TABLE "Authorizations_temp" AS TABLE "Authorizations";`,
        { transaction },
      );

      // Check if columns exist before adding them
      const authTableDescription = await queryInterface.describeTable('Authorizations');

      // Add new flattened columns to Authorizations
      const flattenedColumns = {
        idToken: { type: 'VARCHAR(255)', allowNull: true },
        type: { type: 'VARCHAR(255)', allowNull: true },
        status: { type: 'VARCHAR(255)', allowNull: true },
        cacheExpiryDateTime: { type: 'TIMESTAMP WITH TIME ZONE', allowNull: true },
        chargingPriority: { type: 'INTEGER', allowNull: true },
        language1: { type: 'VARCHAR(255)', allowNull: true },
        language2: { type: 'VARCHAR(255)', allowNull: true },
        groupIdToken: { type: 'VARCHAR(255)', allowNull: true },
        groupIdTokenType: { type: 'VARCHAR(255)', allowNull: true },
        personalMessage: { type: 'TEXT', allowNull: true },
        concurrentTransaction: { type: 'BOOLEAN', allowNull: true, defaultValue: false },
        realTimeAuth: { type: 'BOOLEAN', allowNull: true, defaultValue: false },
      };

      for (const [columnName, columnDef] of Object.entries(flattenedColumns)) {
        if (!authTableDescription[columnName]) {
          console.log(`Adding ${columnName} to Authorizations...`);
          await queryInterface.addColumn('Authorizations', columnName, columnDef, { transaction });
        }
      }

      // Migrate data to flattened structure
      console.log('Migrating authorization data to flattened structure...');
      await queryInterface.sequelize.query(
        `
        UPDATE "Authorizations" a
        SET 
          "idToken" = it."idToken",
          "type" = it."type",
          "status" = iti."status",
          "cacheExpiryDateTime" = iti."cacheExpiryDateTime",
          "chargingPriority" = iti."chargingPriority",
          "language1" = iti."language1",
          "language2" = iti."language2",
          "groupIdToken" = iti."groupIdToken",
          "groupIdTokenType" = iti."groupIdTokenType",
          "personalMessage" = iti."personalMessage"
        FROM "IdTokens" it
        LEFT JOIN "IdTokenInfos" iti ON a."idTokenInfoId" = iti."id"
        WHERE a."idTokenId" = it."id";
      `,
        { transaction },
      );

      // =====================================
      // 6. CLEANUP TEMP TABLES
      // =====================================
      console.log('Cleaning up temporary tables...');
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS "IdTokens_temp"', { transaction });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS "IdTokenInfos_temp"', {
        transaction,
      });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS "AdditionalInfos_temp"', {
        transaction,
      });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Authorizations_temp"', {
        transaction,
      });

      await transaction.commit();
      console.log('CitrineOS v1.8.0 consolidated migration completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed, rolling back:', error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Rolling back CitrineOS v1.8.0 consolidated migration...');

      // Drop AsyncJobStatuses table
      await queryInterface.dropTable('AsyncJobStatuses', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_AsyncJobStatuses_jobName"', {
        transaction,
      });

      // Drop TenantPartners table
      await queryInterface.dropTable('TenantPartners', { transaction });

      // Remove tenant columns from all tables
      for (const table of TABLES_REQUIRING_TENANT) {
        try {
          const tableDescription = await queryInterface.describeTable(table);
          if (tableDescription[TENANT_COLUMN]) {
            await queryInterface.removeColumn(table, TENANT_COLUMN, { transaction });
          }
        } catch (_error) {
          console.warn(`Table ${table} does not exist, skipping tenant column removal`);
        }
      }

      // Remove flattened authorization columns
      const flattenedColumns = [
        'idToken',
        'type',
        'status',
        'cacheExpiryDateTime',
        'chargingPriority',
        'language1',
        'language2',
        'groupIdToken',
        'groupIdTokenType',
        'personalMessage',
        'concurrentTransaction',
        'realTimeAuth',
      ];

      try {
        const authTableDescription = await queryInterface.describeTable('Authorizations');
        for (const columnName of flattenedColumns) {
          if (authTableDescription[columnName]) {
            await queryInterface.removeColumn('Authorizations', columnName, { transaction });
          }
        }
      } catch (_error) {
        console.warn('Authorizations table does not exist, skipping column removal');
      }

      // Drop Tenants table
      await queryInterface.dropTable(TENANTS_TABLE, { transaction });

      await transaction.commit();
      console.log('CitrineOS v1.8.0 consolidated migration rollback completed!');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration rollback failed:', error);
      throw error;
    }
  },
};
