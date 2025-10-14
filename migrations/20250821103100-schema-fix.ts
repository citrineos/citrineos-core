// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
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
    await queryInterface.createTable('EvseTypes', {
      databaseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      id: {
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

    // 2. Add all missing columns
    await queryInterface.renameColumn('ChargingNeeds', 'evseDatabaseId', 'evseId');
    await queryInterface.addColumn('Evses', 'stationId', {
      type: DataTypes.STRING(36),
      allowNull: true,
    });
    await queryInterface.addColumn('TransactionEvents', 'idTokenValue', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.removeColumn('Authorizations', 'groupIdTokenId');
    await queryInterface.addColumn('Authorizations', 'tenantPartnerId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Connectors', 'evseId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Tariffs', 'connectorId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'groupAuthorizationId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.removeColumn('LocalListAuthorizations', 'idTokenId');
    await queryInterface.addColumn('LocalListAuthorizations', 'idToken', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.sequelize.query(
      'UPDATE "LocalListAuthorizations" SET "idToken" = \'\' WHERE "idToken" IS NULL;',
    );
    await queryInterface.changeColumn('LocalListAuthorizations', 'idToken', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'idTokenType', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'additionalInfo', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'status', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Accepted',
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'cacheExpiryDateTime', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'chargingPriority', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'language1', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'language2', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'personalMessage', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    await queryInterface.removeColumn('LocalListAuthorizations', 'idTokenInfoId');
    await queryInterface.addColumn('LocalListAuthorizations', 'customData', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'evseTypeId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('TransactionEvents', 'idTokenType', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.removeColumn('TransactionEvents', 'idTokenId');
    await queryInterface.addColumn('Evses', 'evseId', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'physicalReference', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'removed', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    });
    await queryInterface.addColumn('StopTransactions', 'idTokenValue', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('StopTransactions', 'idTokenType', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.removeColumn('StopTransactions', 'idTokenDatabaseId');
    // ChargingStation: Add missing columns
    await queryInterface.addColumn('ChargingStations', 'coordinates', {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: true,
    });
    await queryInterface.addColumn('ChargingStations', 'floorLevel', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('ChargingStations', 'parkingRestrictions', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('ChargingStations', 'capabilities', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Locations', 'publishUpstream', {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    });
    await queryInterface.addColumn('Locations', 'timeZone', {
      type: DataTypes.STRING,
      defaultValue: 'UTC',
    });
    await queryInterface.addColumn('Locations', 'parkingType', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Locations', 'facilities', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Locations', 'openingHours', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    // Tariff: Add missing column
    await queryInterface.addColumn('Tariffs', 'tariffAltText', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('MeterValues', 'customData', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
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
    await queryInterface.addColumn('MeterValues', 'transactionId', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.removeColumn('Transactions', 'evseDatabaseId');
    await queryInterface.addColumn('Transactions', 'locationId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Transactions', 'evseId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Transactions', 'connectorId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Transactions', 'authorizationId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Transactions', 'tariffId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Transactions', 'startTime', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Transactions', 'endTime', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Transactions', 'customData', {
      type: DataTypes.JSONB,
      allowNull: true,
    });

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
    await queryInterface.sequelize.query(
      'ALTER TABLE "Evses" DROP CONSTRAINT IF EXISTS "Evses_pkey";',
    );

    // Populate EvseTypes from existing data before adding foreign keys
    await queryInterface.sequelize.query(`
      INSERT INTO "EvseTypes" ("id", "tenantId", "connectorId", "createdAt", "updatedAt")
      SELECT "id", "tenantId", "connectorId", NOW(), NOW()
      FROM "Evses";
    `);

    // Truncate Evses table after migration
    await queryInterface.sequelize.query('TRUNCATE TABLE "Evses" CASCADE;');

    await queryInterface.removeColumn('Evses', 'databaseId');
    await queryInterface.removeColumn('Evses', 'connectorId');
    await queryInterface.removeColumn('Evses', 'id');
    // Sequelize does not support adding a primary key via addColumn, so we do it in two steps
    await queryInterface.addColumn('Evses', 'id', {
      type: DataTypes.INTEGER,
      autoIncrement: true,
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE "Evses" ADD CONSTRAINT "Evses_pkey" PRIMARY KEY (id);',
    );

    await queryInterface.addColumn('Connectors', 'evseTypeConnectorId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Connectors', 'type', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Connectors', 'format', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Connectors', 'powerType', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Connectors', 'maximumAmperage', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Connectors', 'maximumVoltage', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Connectors', 'maximumPowerWatts', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Connectors', 'termsAndConditionsUrl', {
      type: DataTypes.STRING,
      allowNull: true,
    });
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
      'ALTER TABLE "Components" ADD CONSTRAINT "Components_evseTypeId_fkey" FOREIGN KEY ("evseDatabaseId") REFERENCES "EvseTypes" ("databaseId") ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Reservations" ADD CONSTRAINT "Reservations_evseTypeId_fkey" FOREIGN KEY ("evseId") REFERENCES "EvseTypes" ("databaseId") ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "TransactionEvents" ADD CONSTRAINT "TransactionEvents_evseTypeId_fkey" FOREIGN KEY ("evseId") REFERENCES "EvseTypes" ("databaseId") ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "VariableAttributes" ADD CONSTRAINT "VariableAttributes_evseTypeId_fkey" FOREIGN KEY ("evseDatabaseId") REFERENCES "EvseTypes" ("databaseId") ON UPDATE CASCADE ON DELETE SET NULL;',
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
    await queryInterface.addColumn('LocalListAuthorizations', 'idTokenType', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'additionalInfo', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'status', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Accepted',
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'cacheExpiryDateTime', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'chargingPriority', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'language1', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'language2', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('LocalListAuthorizations', 'personalMessage', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    await queryInterface.removeColumn('LocalListAuthorizations', 'idTokenInfoId');
    await queryInterface.addColumn('LocalListAuthorizations', 'customData', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'evseTypeId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('TransactionEvents', 'idTokenType', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.removeColumn('TransactionEvents', 'idTokenId');
    await queryInterface.addColumn('Evses', 'evseId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'physicalReference', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'removed', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    });
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
    await queryInterface.addColumn('Evses', 'databaseId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
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
