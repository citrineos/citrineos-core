'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
    const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
      try {
        const tableDescription = await queryInterface.describeTable(tableName);
        return !!tableDescription[columnName];
      } catch (error) {
        return false;
      }
    };

    // Helper to check if a constraint exists (robust for schema/casing)
    const constraintExists = async (
      tableName: string,
      constraintName: string,
    ): Promise<boolean> => {
      const [results] = await queryInterface.sequelize.query(
        `SELECT constraint_name FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = '${tableName}' AND constraint_name = '${constraintName}';`,
      );
      return results.length > 0;
    };

    // 1. Create EvseTypes table
    if (!(await columnExists('EvseTypes', 'id'))) {
      await queryInterface.createTable('EvseTypes', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        databaseId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        connectorId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
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
    }

    // 2. Add all missing columns
    if (await columnExists('ChargingNeeds', 'evseDatabaseId')) {
      await queryInterface.renameColumn('ChargingNeeds', 'evseDatabaseId', 'evseId');
    }
    if (!(await columnExists('Evses', 'stationId'))) {
      await queryInterface.addColumn('Evses', 'stationId', {
        type: DataTypes.STRING(36),
        allowNull: true,
      });
    }
    if (!(await columnExists('TransactionEvents', 'idTokenValue'))) {
      await queryInterface.addColumn('TransactionEvents', 'idTokenValue', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('Transactions', 'evseId'))) {
      await queryInterface.addColumn('Transactions', 'evseId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (await columnExists('Authorizations', 'groupIdTokenId')) {
      await queryInterface.removeColumn('Authorizations', 'groupIdTokenId');
    }
    if (!(await columnExists('Authorizations', 'tenantPartnerId'))) {
      await queryInterface.addColumn('Authorizations', 'tenantPartnerId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'evseId'))) {
      await queryInterface.addColumn('Connectors', 'evseId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Tariffs', 'connectorId'))) {
      await queryInterface.addColumn('Tariffs', 'connectorId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Transactions', 'tariffId'))) {
      await queryInterface.addColumn('Transactions', 'tariffId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Transactions', 'authorizationId'))) {
      await queryInterface.addColumn('Transactions', 'authorizationId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Transactions', 'connectorId'))) {
      await queryInterface.addColumn('Transactions', 'connectorId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Transactions', 'locationId'))) {
      await queryInterface.addColumn('Transactions', 'locationId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('LocalListAuthorizations', 'groupAuthorizationId'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'groupAuthorizationId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (await columnExists('LocalListAuthorizations', 'idTokenId')) {
      await queryInterface.removeColumn('LocalListAuthorizations', 'idTokenId');
    }
    if (!(await columnExists('LocalListAuthorizations', 'idToken'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'idToken', {
        type: DataTypes.STRING,
        allowNull: false,
      });
    }
    if (!(await columnExists('LocalListAuthorizations', 'idTokenType'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'idTokenType', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('LocalListAuthorizations', 'additionalInfo'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'additionalInfo', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }
    if (!(await columnExists('LocalListAuthorizations', 'status'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'status', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Accepted',
      });
    }
    if (!(await columnExists('LocalListAuthorizations', 'cacheExpiryDateTime'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'cacheExpiryDateTime', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
    if (!(await columnExists('LocalListAuthorizations', 'chargingPriority'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'chargingPriority', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('LocalListAuthorizations', 'language1'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'language1', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('LocalListAuthorizations', 'language2'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'language2', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('LocalListAuthorizations', 'personalMessage'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'personalMessage', {
        type: DataTypes.JSON,
        allowNull: true,
      });
    }
    if (await columnExists('LocalListAuthorizations', 'idTokenInfoId')) {
      await queryInterface.removeColumn('LocalListAuthorizations', 'idTokenInfoId');
    }
    if (!(await columnExists('LocalListAuthorizations', 'customData'))) {
      await queryInterface.addColumn('LocalListAuthorizations', 'customData', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }
    if (!(await columnExists('Evses', 'evseTypeId'))) {
      await queryInterface.addColumn('Evses', 'evseTypeId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('TransactionEvents', 'idTokenType'))) {
      await queryInterface.addColumn('TransactionEvents', 'idTokenType', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (await columnExists('TransactionEvents', 'idTokenId')) {
      await queryInterface.removeColumn('TransactionEvents', 'idTokenId');
    }
    if (!(await columnExists('Evses', 'evseId'))) {
      await queryInterface.addColumn('Evses', 'evseId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Evses', 'physicalReference'))) {
      await queryInterface.addColumn('Evses', 'physicalReference', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('Evses', 'removed'))) {
      await queryInterface.addColumn('Evses', 'removed', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      });
    }
    if (!(await columnExists('StopTransactions', 'idTokenValue'))) {
      await queryInterface.addColumn('StopTransactions', 'idTokenValue', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('StopTransactions', 'idTokenType'))) {
      await queryInterface.addColumn('StopTransactions', 'idTokenType', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (await columnExists('StopTransactions', 'idTokenDatabaseId')) {
      await queryInterface.removeColumn('StopTransactions', 'idTokenDatabaseId');
    }
    // ChargingStation: Add missing columns
    if (!(await columnExists('ChargingStations', 'coordinates'))) {
      await queryInterface.addColumn('ChargingStations', 'coordinates', {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: true,
      });
    }
    if (!(await columnExists('ChargingStations', 'floorLevel'))) {
      await queryInterface.addColumn('ChargingStations', 'floorLevel', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('ChargingStations', 'parkingRestrictions'))) {
      await queryInterface.addColumn('ChargingStations', 'parkingRestrictions', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }
    if (!(await columnExists('ChargingStations', 'capabilities'))) {
      await queryInterface.addColumn('ChargingStations', 'capabilities', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }
    if (!(await columnExists('Locations', 'publishUpstream'))) {
      await queryInterface.addColumn('Locations', 'publishUpstream', {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      });
    }
    if (!(await columnExists('Locations', 'timeZone'))) {
      await queryInterface.addColumn('Locations', 'timeZone', {
        type: DataTypes.STRING,
        defaultValue: 'UTC',
      });
    }
    if (!(await columnExists('Locations', 'parkingType'))) {
      await queryInterface.addColumn('Locations', 'parkingType', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('Locations', 'facilities'))) {
      await queryInterface.addColumn('Locations', 'facilities', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }
    if (!(await columnExists('Locations', 'openingHours'))) {
      await queryInterface.addColumn('Locations', 'openingHours', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }
    // Tariff: Add missing column
    if (!(await columnExists('Tariffs', 'tariffAltText'))) {
      await queryInterface.addColumn('Tariffs', 'tariffAltText', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }

    if (!(await columnExists('MeterValues', 'customData'))) {
      await queryInterface.addColumn('MeterValues', 'customData', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }
    if (!(await columnExists('MeterValues', 'tariffId'))) {
      await queryInterface.addColumn('MeterValues', 'tariffId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Tariffs',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
    if (!(await columnExists('MeterValues', 'transactionId'))) {
      await queryInterface.addColumn('MeterValues', 'transactionId', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }

    if (await columnExists('Transactions', 'evseDatabaseId')) {
      await queryInterface.removeColumn('Transactions', 'evseDatabaseId');
    }
    if (!(await columnExists('Transactions', 'locationId'))) {
      await queryInterface.addColumn('Transactions', 'locationId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
    if (!(await columnExists('Transactions', 'evseId'))) {
      await queryInterface.addColumn('Transactions', 'evseId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Evses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
    if (!(await columnExists('Transactions', 'connectorId'))) {
      await queryInterface.addColumn('Transactions', 'connectorId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Connectors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
    if (!(await columnExists('Transactions', 'authorizationId'))) {
      await queryInterface.addColumn('Transactions', 'authorizationId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Authorizations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
    if (!(await columnExists('Transactions', 'tariffId'))) {
      await queryInterface.addColumn('Transactions', 'tariffId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Tariffs',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
    if (!(await columnExists('Transactions', 'startTime'))) {
      await queryInterface.addColumn('Transactions', 'startTime', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
    if (!(await columnExists('Transactions', 'endTime'))) {
      await queryInterface.addColumn('Transactions', 'endTime', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
    if (!(await columnExists('Transactions', 'customData'))) {
      await queryInterface.addColumn('Transactions', 'customData', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }

    // 3. Drop dependent foreign key constraints
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" DROP CONSTRAINT IF EXISTS "Transactions_evseDatabaseId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "ChargingNeeds" DROP CONSTRAINT IF EXISTS "ChargingNeeds_evseDatabaseId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Components" DROP CONSTRAINT IF EXISTS "Components_evseDatabaseId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "TransactionEvents" DROP CONSTRAINT IF EXISTS "TransactionEvents_evseId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Reservations" DROP CONSTRAINT IF EXISTS "Reservations_evseId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "VariableAttributes" DROP CONSTRAINT IF EXISTS "VariableAttributes_evseDatabaseId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Components" DROP CONSTRAINT IF EXISTS "Components_evseTypeId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Reservations" DROP CONSTRAINT IF EXISTS "Reservations_evseTypeId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "TransactionEvents" DROP CONSTRAINT IF EXISTS "TransactionEvents_evseTypeId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "VariableAttributes" DROP CONSTRAINT IF EXISTS "VariableAttributes_evseTypeId_fkey";',
    );

    // 4. Fix the Evses table
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS evses_id;');
    await queryInterface.sequelize.query(
      'ALTER TABLE "Evses" DROP CONSTRAINT IF EXISTS "Evses_id_connectorId_key";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Evses" DROP CONSTRAINT IF EXISTS "Evses_pkey";',
    );
    await queryInterface.changeColumn('Evses', 'id', { type: DataTypes.INTEGER, allowNull: false });
    await queryInterface.addConstraint('Evses', {
      fields: ['id'],
      type: 'primary key',
      name: 'Evses_pkey',
    });

    // Connector: Add missing columns
    if (!(await columnExists('Connectors', 'connectorId'))) {
      await queryInterface.addColumn('Connectors', 'connectorId', {
        type: DataTypes.INTEGER,
        allowNull: false,
      });
    }
    if (!(await columnExists('Connectors', 'evseTypeConnectorId'))) {
      await queryInterface.addColumn('Connectors', 'evseTypeConnectorId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'status'))) {
      await queryInterface.addColumn('Connectors', 'status', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Unknown',
      });
    }
    if (!(await columnExists('Connectors', 'type'))) {
      await queryInterface.addColumn('Connectors', 'type', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'format'))) {
      await queryInterface.addColumn('Connectors', 'format', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'errorCode'))) {
      await queryInterface.addColumn('Connectors', 'errorCode', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NoError',
      });
    }
    if (!(await columnExists('Connectors', 'powerType'))) {
      await queryInterface.addColumn('Connectors', 'powerType', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'maximumAmperage'))) {
      await queryInterface.addColumn('Connectors', 'maximumAmperage', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'maximumVoltage'))) {
      await queryInterface.addColumn('Connectors', 'maximumVoltage', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'maximumPowerWatts'))) {
      await queryInterface.addColumn('Connectors', 'maximumPowerWatts', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'timestamp'))) {
      await queryInterface.addColumn('Connectors', 'timestamp', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'info'))) {
      await queryInterface.addColumn('Connectors', 'info', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'vendorId'))) {
      await queryInterface.addColumn('Connectors', 'vendorId', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'vendorErrorCode'))) {
      await queryInterface.addColumn('Connectors', 'vendorErrorCode', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!(await columnExists('Connectors', 'termsAndConditionsUrl'))) {
      await queryInterface.addColumn('Connectors', 'termsAndConditionsUrl', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    // Foreign key constraints for relationships (add only if not exists, drop if exists first)
    if (await constraintExists('Connectors', 'Connectors_evseId_fkey')) {
      await queryInterface.sequelize.query(
        'ALTER TABLE "Connectors" DROP CONSTRAINT IF EXISTS "Connectors_evseId_fkey";',
      );
    }
    if (!(await constraintExists('Connectors', 'Connectors_evseId_fkey'))) {
      await queryInterface.sequelize.query(
        'ALTER TABLE "Connectors" ADD CONSTRAINT "Connectors_evseId_fkey" FOREIGN KEY ("evseId") REFERENCES "Evses" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
      );
    }
    if (!(await constraintExists('Connectors', 'Connectors_stationId_fkey'))) {
      await queryInterface.sequelize.query(
        'ALTER TABLE "Connectors" ADD CONSTRAINT "Connectors_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "ChargingStations" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
      );
    }
    if (!(await constraintExists('ChargingStations', 'ChargingStations_locationId_fkey'))) {
      await queryInterface.sequelize.query(
        'ALTER TABLE "ChargingStations" ADD CONSTRAINT "ChargingStations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Locations" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
      );
    }
    if (!(await constraintExists('Authorizations', 'Authorizations_groupAuthorizationId_fkey'))) {
      await queryInterface.sequelize.query(
        'ALTER TABLE "Authorizations" ADD CONSTRAINT "Authorizations_groupAuthorizationId_fkey" FOREIGN KEY ("groupAuthorizationId") REFERENCES "Authorizations" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
      );
    }
    if (!(await constraintExists('ChargingNeeds', 'ChargingNeeds_transactionDatabaseId_fkey'))) {
      await queryInterface.sequelize.query(
        'ALTER TABLE "ChargingNeeds" ADD CONSTRAINT "ChargingNeeds_transactionDatabaseId_fkey" FOREIGN KEY ("transactionDatabaseId") REFERENCES "Transactions" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
      );
    }

    //  Rename partnerProfile to partnerProfileOCPI in TenantPartners ---
    const tenantPartnersTable = 'TenantPartners';
    const oldColumn = 'partnerProfile';
    const newColumn = 'partnerProfileOCPI';
    const tenantPartnersDesc = await queryInterface.describeTable(tenantPartnersTable);
    if (tenantPartnersDesc[oldColumn] && !tenantPartnersDesc[newColumn]) {
      await queryInterface.renameColumn(tenantPartnersTable, oldColumn, newColumn);
    }

    // 5. Re-create all foreign key constraints
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_evseId_fkey" FOREIGN KEY ("evseId") REFERENCES "Evses" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "ChargingNeeds" ADD CONSTRAINT "ChargingNeeds_evseId_fkey" FOREIGN KEY ("evseId") REFERENCES "Evses" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Authorizations" ADD CONSTRAINT "Authorizations_tenantPartnerId_fkey" FOREIGN KEY ("tenantPartnerId") REFERENCES "TenantPartners" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Evses" ADD CONSTRAINT "Evses_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "ChargingStations" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Tariffs" ADD CONSTRAINT "Tariffs_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connectors" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariffs" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_authorizationId_fkey" FOREIGN KEY ("authorizationId") REFERENCES "Authorizations" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connectors" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Locations" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "LocalListAuthorizations" ADD CONSTRAINT "LocalListAuthorizations_groupAuthorizationId_fkey" FOREIGN KEY ("groupAuthorizationId") REFERENCES "Authorizations" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Components" ADD CONSTRAINT "Components_evseTypeId_fkey" FOREIGN KEY ("evseDatabaseId") REFERENCES "EvseTypes" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Reservations" ADD CONSTRAINT "Reservations_evseTypeId_fkey" FOREIGN KEY ("evseId") REFERENCES "EvseTypes" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "TransactionEvents" ADD CONSTRAINT "TransactionEvents_evseTypeId_fkey" FOREIGN KEY ("evseId") REFERENCES "EvseTypes" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "VariableAttributes" ADD CONSTRAINT "VariableAttributes_evseTypeId_fkey" FOREIGN KEY ("evseDatabaseId") REFERENCES "EvseTypes" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
  },

  down: async (queryInterface: QueryInterface) => {
    // 1. Drop all foreign key constraints added in up
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" DROP CONSTRAINT IF EXISTS "Transactions_evseId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" DROP CONSTRAINT IF EXISTS "Transactions_tariffId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" DROP CONSTRAINT IF EXISTS "Transactions_authorizationId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" DROP CONSTRAINT IF EXISTS "Transactions_connectorId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" DROP CONSTRAINT IF EXISTS "Transactions_locationId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "ChargingNeeds" DROP CONSTRAINT IF EXISTS "ChargingNeeds_evseId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Authorizations" DROP CONSTRAINT IF EXISTS "Authorizations_tenantPartnerId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Authorizations" DROP CONSTRAINT IF EXISTS "Authorizations_groupAuthorizationId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Evses" DROP CONSTRAINT IF EXISTS "Evses_stationId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Connectors" DROP CONSTRAINT IF EXISTS "Connectors_evseId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Tariffs" DROP CONSTRAINT IF EXISTS "Tariffs_connectorId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "LocalListAuthorizations" DROP CONSTRAINT IF EXISTS "LocalListAuthorizations_groupAuthorizationId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Components" DROP CONSTRAINT IF EXISTS "Components_evseTypeId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Reservations" DROP CONSTRAINT IF EXISTS "Reservations_evseTypeId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "TransactionEvents" DROP CONSTRAINT IF EXISTS "TransactionEvents_evseTypeId_fkey";',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "VariableAttributes" DROP CONSTRAINT IF EXISTS "VariableAttributes_evseTypeId_fkey";',
    );

    // 2. Remove all columns added in up
    await queryInterface.renameColumn('ChargingNeeds', 'evseId', 'evseDatabaseId');
    await queryInterface.removeColumn('Evses', 'stationId');
    await queryInterface.removeColumn('TransactionEvents', 'idTokenValue');
    await queryInterface.removeColumn('Transactions', 'evseId');
    await queryInterface.removeColumn('Authorizations', 'tenantPartnerId');
    await queryInterface.removeColumn('Connectors', 'evseId');
    await queryInterface.removeColumn('Tariffs', 'connectorId');
    await queryInterface.removeColumn('Transactions', 'tariffId');
    await queryInterface.removeColumn('Transactions', 'authorizationId');
    await queryInterface.removeColumn('Transactions', 'connectorId');
    await queryInterface.removeColumn('Transactions', 'locationId');
    await queryInterface.removeColumn('LocalListAuthorizations', 'groupAuthorizationId');
    await queryInterface.addColumn('LocalListAuthorizations', 'idTokenId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'IdTokens',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.removeColumn('LocalListAuthorizations', 'idToken');
    await queryInterface.removeColumn('LocalListAuthorizations', 'idTokenType');
    await queryInterface.removeColumn('LocalListAuthorizations', 'additionalInfo');
    await queryInterface.removeColumn('LocalListAuthorizations', 'status');
    await queryInterface.removeColumn('LocalListAuthorizations', 'cacheExpiryDateTime');
    await queryInterface.removeColumn('LocalListAuthorizations', 'chargingPriority');
    await queryInterface.removeColumn('LocalListAuthorizations', 'language1');
    await queryInterface.removeColumn('LocalListAuthorizations', 'language2');
    await queryInterface.removeColumn('LocalListAuthorizations', 'personalMessage');
    await queryInterface.addColumn('LocalListAuthorizations', 'idTokenInfoId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'IdTokenInfos',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.removeColumn('LocalListAuthorizations', 'customData');
    await queryInterface.removeColumn('Evses', 'evseTypeId');
    await queryInterface.removeColumn('TransactionEvents', 'idTokenType');
    await queryInterface.addColumn('TransactionEvents', 'idTokenId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'IdTokens',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.removeColumn('Evses', 'evseId');
    await queryInterface.removeColumn('Evses', 'physicalReference');
    await queryInterface.removeColumn('Evses', 'removed');
    // ChargingStation: Remove columns
    await queryInterface.removeColumn('ChargingStations', 'coordinates');
    await queryInterface.removeColumn('ChargingStations', 'floorLevel');
    await queryInterface.removeColumn('ChargingStations', 'parkingRestrictions');
    await queryInterface.removeColumn('ChargingStations', 'capabilities');
    // Tariff: Remove column
    await queryInterface.removeColumn('Tariffs', 'tariffAltText');

    // 3. Drop EvseTypes table
    await queryInterface.dropTable('EvseTypes');

    // 4. Restore Evses table PK/index as needed
    await queryInterface.sequelize.query(
      'ALTER TABLE "Evses" DROP CONSTRAINT IF EXISTS "Evses_pkey";',
    );

    // Revert partnerProfileOCPI to partnerProfile in TenantPartners ---
    const tenantPartnersTable = 'TenantPartners';
    const oldColumn = 'partnerProfile';
    const newColumn = 'partnerProfileOCPI';
    const tenantPartnersDesc = await queryInterface.describeTable(tenantPartnersTable);
    if (tenantPartnersDesc[newColumn] && !tenantPartnersDesc[oldColumn]) {
      await queryInterface.renameColumn(tenantPartnersTable, newColumn, oldColumn);
    }
  },
};
