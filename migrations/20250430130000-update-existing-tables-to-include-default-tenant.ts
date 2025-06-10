'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { Tenant } from '@citrineos/data';

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
const TENANTS_TABLE = `${Tenant.MODEL_NAME}s`;

export = {
  up: async (queryInterface: QueryInterface) => {
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
