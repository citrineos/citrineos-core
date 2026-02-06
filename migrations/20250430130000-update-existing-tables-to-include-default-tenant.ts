// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

const TABLES = [
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

const TENANT_COLUMN = 'tenantId';
const TENANTS_TABLE = `Tenants`;

export default {
  up: async (queryInterface: QueryInterface) => {
    const migrationName = '20250430130000-update-existing-tables-to-include-default-tenant';

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

    for (const table of TABLES) {
      const tableDescription = await queryInterface.describeTable(table);
      if (!tableDescription[TENANT_COLUMN]) {
        await queryInterface.addColumn(table, TENANT_COLUMN, {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: DEFAULT_TENANT_ID,
          references: {
            model: TENANTS_TABLE,
            key: 'id',
          },
          onUpdate: 'CASCADE', // update tenantId if the tenant primary key is updated (should never happen)
          onDelete: 'RESTRICT', // ensure tenant row cannot be deleted if there are existing records using it
        });
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    for (const table of TABLES) {
      const tableDescription = await queryInterface.describeTable(table);
      if (tableDescription[TENANT_COLUMN]) {
        await queryInterface.removeColumn(table, TENANT_COLUMN);
      }
    }
  },
};
