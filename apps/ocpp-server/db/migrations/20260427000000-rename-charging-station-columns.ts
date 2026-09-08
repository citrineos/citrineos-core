// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface, QueryTypes } from 'sequelize';

const primaryKeyTables = [
  'Evses',
  'Connectors',
  'Transactions',
  'ChargingStationNetworkProfiles',
  'ChargingStationSequences',
  'StatusNotifications',
  'LatestStatusNotifications',
  'VariableAttributes',
  'SetNetworkProfiles',
  'OCPPMessages',
  'InstalledCertificates',
  'ChargingStationSecurityInfos',
  'VariableMonitorings',
  'EventData',
  'InstallCertificateAttempts',
  'DeleteCertificateAttempts',
];

const ocppConnectionTables = [
  'ChangeConfigurations',
  'ChargingProfiles',
  'ChargingSchedules',
  'CompositeSchedules',
  'LocalListVersions',
  'SendLocalLists',
  'MessageInfos',
  'Reservations',
  'SecurityEvents',
  'Subscriptions',
  'StartTransactions',
  'StopTransactions',
  'TransactionEvents',
];

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    const renameConstraint = async (table: string, oldName: string, newName: string) => {
      const rows = await queryInterface.sequelize.query(
        `SELECT COUNT(*) AS count FROM information_schema.table_constraints
           WHERE table_schema = 'public' AND table_name = :table AND constraint_name = :name`,
        { replacements: { table, name: oldName }, type: QueryTypes.SELECT },
      );
      if ((rows as any)[0].count > 0) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${table}" RENAME CONSTRAINT "${oldName}" TO "${newName}"`,
          { type: QueryTypes.RAW },
        );
      }
    };

    const renameIndex = async (oldName: string, newName: string) => {
      const rows = await queryInterface.sequelize.query(
        `SELECT COUNT(*) AS count FROM pg_indexes
           WHERE schemaname = 'public' AND indexname = :name`,
        { replacements: { name: oldName }, type: QueryTypes.SELECT },
      );
      if ((rows as any)[0].count > 0) {
        await queryInterface.sequelize.query(`ALTER INDEX "${oldName}" RENAME TO "${newName}"`, {
          type: QueryTypes.RAW,
        });
      }
    };

    const renameColumn = async (table: string, oldName: string, newName: string) => {
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
           IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = '${newName}') THEN
             ALTER TABLE "${table}" RENAME COLUMN "${oldName}" TO "${newName}";
           END IF;
         END $$;`,
        { type: QueryTypes.RAW },
      );
    };

    // Drop all triggers that reference old column names
    for (const tableName of primaryKeyTables) {
      const triggerName = `trigger_populate_${tableName.toLowerCase()}_station_pk_id`;
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS "${triggerName}" ON "${tableName}"`,
        { type: QueryTypes.RAW },
      );
    }
    await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS populate_station_pk_id()`);

    // Rename columns
    await renameColumn('ChargingStations', 'id', 'ocppConnectionName');
    await renameColumn('ChargingStations', 'pkId', 'id');
    await queryInterface.sequelize.query(
      `ALTER SEQUENCE IF EXISTS "ChargingStations_pkId_seq" RENAME TO "ChargingStations_id_seq"`,
      { type: QueryTypes.RAW },
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "ChargingStations" ALTER COLUMN "id" SET DEFAULT nextval('"ChargingStations_id_seq"')`,
      { type: QueryTypes.RAW },
    );

    // Child tables: "stationId" (string) → "ocppConnectionName", then "stationPkId" (int FK and PK for ChargingStation) → "stationId"
    for (const tableName of primaryKeyTables) {
      await renameColumn(tableName, 'stationId', 'ocppConnectionName');
      await renameColumn(tableName, 'stationPkId', 'stationId');
    }

    // Tables with only the string station identifier (no int FK): "stationId" → "ocppConnectionName"
    for (const tableName of ocppConnectionTables) {
      await renameColumn(tableName, 'stationId', 'ocppConnectionName');
    }

    // Rename constraints and indexes
    await renameConstraint(
      'ChargingStations',
      'ChargingStations_id_tenantId_key',
      'ChargingStations_stationName_tenantId_key',
    );

    const fkRenames: [string, string, string][] = [
      ['Evses', 'Evses_stationPkId_fkey', 'Evses_stationId_fkey'],
      ['Connectors', 'Connectors_stationPkId_fkey', 'Connectors_stationId_fkey'],
      ['Transactions', 'Transactions_stationPkId_fkey', 'Transactions_stationId_fkey'],
      [
        'ChargingStationNetworkProfiles',
        'ChargingStationNetworkProfiles_stationPkId_fkey',
        'ChargingStationNetworkProfiles_stationId_fkey',
      ],
      [
        'ChargingStationSequences',
        'ChargingStationSequences_stationPkId_fkey',
        'ChargingStationSequences_stationId_fkey',
      ],
      [
        'StatusNotifications',
        'StatusNotifications_stationPkId_fkey',
        'StatusNotifications_stationId_fkey',
      ],
      [
        'LatestStatusNotifications',
        'LatestStatusNotifications_stationPkId_fkey',
        'LatestStatusNotifications_stationId_fkey',
      ],
      [
        'VariableAttributes',
        'VariableAttributes_stationPkId_fkey',
        'VariableAttributes_stationId_fkey',
      ],
      [
        'SetNetworkProfiles',
        'SetNetworkProfiles_stationPkId_fkey',
        'SetNetworkProfiles_stationId_fkey',
      ],
      ['OCPPMessages', 'OCPPMessages_stationPkId_fkey', 'OCPPMessages_stationId_fkey'],
      [
        'InstalledCertificates',
        'InstalledCertificates_stationPkId_fkey',
        'InstalledCertificates_stationId_fkey',
      ],
      ['EventData', 'EventData_stationPkId_fkey', 'EventData_stationId_fkey'],
      [
        'VariableMonitorings',
        'VariableMonitorings_stationPkId_fkey',
        'VariableMonitorings_stationId_fkey',
      ],
      [
        'InstallCertificateAttempts',
        'InstallCertificateAttempts_stationPkId_fkey',
        'InstallCertificateAttempts_stationId_fkey',
      ],
      [
        'DeleteCertificateAttempts',
        'DeleteCertificateAttempts_stationPkId_fkey',
        'DeleteCertificateAttempts_stationId_fkey',
      ],
      [
        'ChargingStationSecurityInfos',
        'ChargingStationSecurityInfos_stationPkId_fkey',
        'ChargingStationSecurityInfos_stationId_fkey',
      ],
    ];
    for (const [table, oldName, newName] of fkRenames) {
      await renameConstraint(table, oldName, newName);
    }

    // Unique constraints where stationPkId was the int FK column
    await renameConstraint('Evses', 'stationPkId_evseTypeId', 'stationId_evseTypeId');
    await renameConstraint('Connectors', 'stationPkId_connectorId', 'stationId_connectorId');
    await renameConstraint('Transactions', 'stationPkId_transactionId', 'stationId_transactionId');
    await renameConstraint(
      'ChargingStationNetworkProfiles',
      'stationPkId_configurationSlot',
      'stationId_configurationSlot',
    );
    await renameConstraint(
      'ChargingStationNetworkProfiles',
      'CSNP_stationPkId_websocketServerConfigId_key',
      'CSNP_stationId_websocketServerConfigId_key',
    );
    await renameConstraint('ChargingStationSequences', 'stationPkId_type', 'stationId_type');
    await renameConstraint(
      'VariableAttributes',
      'stationPkId_type_variableId_componentId',
      'stationId_type_variableId_componentId',
    );

    await renameConstraint(
      'SetNetworkProfiles',
      'stationPkId_correlationId',
      'stationId_correlationId',
    );

    await renameConstraint(
      'ChargingStationSecurityInfos',
      'ChargingStationSecurityInfos_stationId_tenantId',
      'ChargingStationSecurityInfos_stationName_tenantId',
    );
    await renameConstraint(
      'EventData',
      'EventData_stationId_tenantId_eventId',
      'EventData_stationName_tenantId_eventId',
    );
    await renameConstraint(
      'EventData',
      'EventData_stationId_eventId',
      'EventData_stationName_eventId',
    );
    await renameConstraint(
      'VariableMonitorings',
      'VariableMonitorings_stationId_tenantId_id',
      'VariableMonitorings_stationName_tenantId_id',
    );

    await renameIndex('variable_attributes_stationPkId', 'variable_attributes_stationId');
    await renameIndex('variable_attributes_stationPkId_type', 'variable_attributes_stationId_type');
    await renameIndex(
      'variable_attributes_stationPkId_variableId',
      'variable_attributes_stationId_variableId',
    );
    await renameIndex(
      'variable_attributes_stationPkId_componentId',
      'variable_attributes_stationId_componentId',
    );
    await renameIndex(
      'variable_attributes_stationPkId_type_variableId',
      'variable_attributes_stationId_type_variableId',
    );
    await renameIndex(
      'variable_attributes_stationPkId_type_componentId',
      'variable_attributes_stationId_type_componentId',
    );
    await renameIndex(
      'variable_attributes_stationPkId_variableId_componentId',
      'variable_attributes_stationId_variableId_componentId',
    );

    // Recreate trigger function with new column names
    await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION populate_station_id()
        RETURNS TRIGGER AS $$
        BEGIN
          SELECT "id" INTO NEW."stationId"
          FROM "ChargingStations"
          WHERE "ocppConnectionName" = NEW."ocppConnectionName" AND "tenantId" = NEW."tenantId";

          IF NEW."stationId" IS NULL THEN
            RAISE EXCEPTION 'No ChargingStation found with ocppConnectionName=% and tenantId=%',
                           NEW."ocppConnectionName", NEW."tenantId";
          END IF;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

    for (const tableName of primaryKeyTables) {
      const triggerName = `trigger_populate_${tableName.toLowerCase()}_station_id`;
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS "${triggerName}" ON "${tableName}"`,
      );
      await queryInterface.sequelize.query(`
          CREATE TRIGGER "${triggerName}"
          BEFORE INSERT OR UPDATE ON "${tableName}"
          FOR EACH ROW
          WHEN (NEW."stationId" IS NULL)
          EXECUTE FUNCTION populate_station_id()
        `);
    }

    console.log('Migration 20260427000000-rename-charging-station-columns completed successfully.');
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const qSelect = <T = any>(sql: string, replacements?: Record<string, any>): Promise<T[]> =>
        queryInterface.sequelize.query(sql, {
          transaction,
          replacements,
          type: QueryTypes.SELECT,
        }) as Promise<T[]>;

      const renameConstraint = async (table: string, oldName: string, newName: string) => {
        const [row] = await qSelect<{ count: string }>(
          `SELECT COUNT(*) AS count FROM information_schema.table_constraints
           WHERE table_schema = 'public' AND table_name = :table AND constraint_name = :name`,
          { table, name: oldName },
        );
        if (parseInt((row as any).count, 10) > 0) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${table}" RENAME CONSTRAINT "${oldName}" TO "${newName}"`,
          );
        }
      };

      const renameIndex = async (oldName: string, newName: string) => {
        const [row] = await qSelect<{ count: string }>(
          `SELECT COUNT(*) AS count FROM pg_indexes
           WHERE schemaname = 'public' AND indexname = :name`,
          { name: oldName },
        );
        if (parseInt((row as any).count, 10) > 0) {
          await queryInterface.sequelize.query(`ALTER INDEX "${oldName}" RENAME TO "${newName}"`);
        }
      };

      const renameColumn = async (table: string, oldName: string, newName: string) => {
        await queryInterface.sequelize.query(
          `DO $$ BEGIN
             IF EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = '${oldName}') THEN
               ALTER TABLE "${table}" RENAME COLUMN "${oldName}" TO "${newName}";
             END IF;
           END $$;`,
          { transaction, type: QueryTypes.RAW },
        );
      };

      const primaryKeyTables = [
        'Evses',
        'Connectors',
        'Transactions',
        'ChargingStationNetworkProfiles',
        'ChargingStationSequences',
        'StatusNotifications',
        'LatestStatusNotifications',
        'VariableAttributes',
        'SetNetworkProfiles',
        'OCPPMessages',
        'InstalledCertificates',
        'ChargingStationSecurityInfos',
        'VariableMonitorings',
        'EventData',
        'InstallCertificateAttempts',
        'DeleteCertificateAttempts',
      ];

      // Drop triggers with new names
      for (const tableName of primaryKeyTables) {
        const triggerName = `trigger_populate_${tableName.toLowerCase()}_station_id`;
        await queryInterface.sequelize.query(
          `DROP TRIGGER IF EXISTS "${triggerName}" ON "${tableName}"`,
        );
      }
      await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS populate_station_id()`);

      // Rename columns back
      await renameColumn('ChargingStations', 'id', 'pkId');
      await renameColumn('ChargingStations', 'ocppConnectionName', 'id');
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE IF EXISTS "ChargingStations_id_seq" RENAME TO "ChargingStations_pkId_seq"`,
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "ChargingStations" ALTER COLUMN "pkId" SET DEFAULT nextval('"ChargingStations_pkId_seq"')`,
      );

      for (const tableName of primaryKeyTables) {
        await renameColumn(tableName, 'stationId', 'stationPkId');
        await renameColumn(tableName, 'ocppConnectionName', 'stationId');
      }

      // Tables with only the string station identifier: "ocppConnectionName" → "stationId"
      const ocppConnectionTables = [
        'ChangeConfigurations',
        'ChargingProfiles',
        'ChargingSchedules',
        'CompositeSchedules',
        'LocalListVersions',
        'SendLocalLists',
        'MessageInfos',
        'Reservations',
        'SecurityEvents',
        'Subscriptions',
        'StartTransactions',
        'StopTransactions',
        'TransactionEvents',
      ];
      for (const tableName of ocppConnectionTables) {
        await renameColumn(tableName, 'ocppConnectionName', 'stationId');
      }

      // Rename constraints and indexes back

      await renameConstraint(
        'ChargingStations',
        'ChargingStations_stationName_tenantId_key',
        'ChargingStations_id_tenantId_key',
      );

      const fkRenames: [string, string, string][] = [
        ['Evses', 'Evses_stationId_fkey', 'Evses_stationPkId_fkey'],
        ['Connectors', 'Connectors_stationId_fkey', 'Connectors_stationPkId_fkey'],
        ['Transactions', 'Transactions_stationId_fkey', 'Transactions_stationPkId_fkey'],
        [
          'ChargingStationNetworkProfiles',
          'ChargingStationNetworkProfiles_stationId_fkey',
          'ChargingStationNetworkProfiles_stationPkId_fkey',
        ],
        [
          'ChargingStationSequences',
          'ChargingStationSequences_stationId_fkey',
          'ChargingStationSequences_stationPkId_fkey',
        ],
        [
          'StatusNotifications',
          'StatusNotifications_stationId_fkey',
          'StatusNotifications_stationPkId_fkey',
        ],
        [
          'LatestStatusNotifications',
          'LatestStatusNotifications_stationId_fkey',
          'LatestStatusNotifications_stationPkId_fkey',
        ],
        [
          'VariableAttributes',
          'VariableAttributes_stationId_fkey',
          'VariableAttributes_stationPkId_fkey',
        ],
        [
          'SetNetworkProfiles',
          'SetNetworkProfiles_stationId_fkey',
          'SetNetworkProfiles_stationPkId_fkey',
        ],
        ['OCPPMessages', 'OCPPMessages_stationId_fkey', 'OCPPMessages_stationPkId_fkey'],
        [
          'InstalledCertificates',
          'InstalledCertificates_stationId_fkey',
          'InstalledCertificates_stationPkId_fkey',
        ],
        ['EventData', 'EventData_stationId_fkey', 'EventData_stationPkId_fkey'],
        [
          'VariableMonitorings',
          'VariableMonitorings_stationId_fkey',
          'VariableMonitorings_stationPkId_fkey',
        ],
        [
          'InstallCertificateAttempts',
          'InstallCertificateAttempts_stationId_fkey',
          'InstallCertificateAttempts_stationPkId_fkey',
        ],
        [
          'DeleteCertificateAttempts',
          'DeleteCertificateAttempts_stationId_fkey',
          'DeleteCertificateAttempts_stationPkId_fkey',
        ],
        [
          'ChargingStationSecurityInfos',
          'ChargingStationSecurityInfos_stationId_fkey',
          'ChargingStationSecurityInfos_stationPkId_fkey',
        ],
      ];
      for (const [table, oldName, newName] of fkRenames) {
        await renameConstraint(table, oldName, newName);
      }

      await renameConstraint('Evses', 'stationId_evseTypeId', 'stationPkId_evseTypeId');
      await renameConstraint('Connectors', 'stationId_connectorId', 'stationPkId_connectorId');
      await renameConstraint(
        'Transactions',
        'stationId_transactionId',
        'stationPkId_transactionId',
      );
      await renameConstraint(
        'ChargingStationNetworkProfiles',
        'stationId_configurationSlot',
        'stationPkId_configurationSlot',
      );
      await renameConstraint(
        'ChargingStationNetworkProfiles',
        'CSNP_stationId_websocketServerConfigId_key',
        'CSNP_stationPkId_websocketServerConfigId_key',
      );
      await renameConstraint('ChargingStationSequences', 'stationId_type', 'stationPkId_type');
      await renameConstraint(
        'VariableAttributes',
        'stationId_type_variableId_componentId',
        'stationPkId_type_variableId_componentId',
      );
      await renameConstraint(
        'SetNetworkProfiles',
        'stationId_correlationId',
        'stationPkId_correlationId',
      );
      await renameConstraint(
        'ChargingStationSecurityInfos',
        'ChargingStationSecurityInfos_stationName_tenantId',
        'ChargingStationSecurityInfos_stationId_tenantId',
      );
      await renameConstraint(
        'EventData',
        'EventData_stationName_tenantId_eventId',
        'EventData_stationId_tenantId_eventId',
      );
      await renameConstraint(
        'EventData',
        'EventData_stationName_eventId',
        'EventData_stationId_eventId',
      );
      await renameConstraint(
        'VariableMonitorings',
        'VariableMonitorings_stationName_tenantId_id',
        'VariableMonitorings_stationId_tenantId_id',
      );

      await renameIndex('variable_attributes_stationId', 'variable_attributes_stationPkId');
      await renameIndex(
        'variable_attributes_stationId_type',
        'variable_attributes_stationPkId_type',
      );
      await renameIndex(
        'variable_attributes_stationId_variableId',
        'variable_attributes_stationPkId_variableId',
      );
      await renameIndex(
        'variable_attributes_stationId_componentId',
        'variable_attributes_stationPkId_componentId',
      );
      await renameIndex(
        'variable_attributes_stationId_type_variableId',
        'variable_attributes_stationPkId_type_variableId',
      );
      await renameIndex(
        'variable_attributes_stationId_type_componentId',
        'variable_attributes_stationPkId_type_componentId',
      );
      await renameIndex(
        'variable_attributes_stationId_variableId_componentId',
        'variable_attributes_stationPkId_variableId_componentId',
      );

      // Restore original trigger function
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION populate_station_pk_id()
        RETURNS TRIGGER AS $$
        BEGIN
          SELECT "pkId" INTO NEW."stationPkId"
          FROM "ChargingStations"
          WHERE "id" = NEW."stationId" AND "tenantId" = NEW."tenantId";

          IF NEW."stationPkId" IS NULL THEN
            RAISE EXCEPTION 'No ChargingStation found with stationId=% and tenantId=%',
                           NEW."stationId", NEW."tenantId";
          END IF;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      for (const tableName of primaryKeyTables) {
        const triggerName = `trigger_populate_${tableName.toLowerCase()}_station_pk_id`;
        await queryInterface.sequelize.query(
          `DROP TRIGGER IF EXISTS "${triggerName}" ON "${tableName}"`,
        );
        await queryInterface.sequelize.query(`
          CREATE TRIGGER "${triggerName}"
          BEFORE INSERT OR UPDATE ON "${tableName}"
          FOR EACH ROW
          WHEN (NEW."stationPkId" IS NULL)
          EXECUTE FUNCTION populate_station_pk_id()
        `);
      }

      console.log(
        'Migration 20260427000000-rename-charging-station-columns rolled back successfully.',
      );
    });
  },
};
