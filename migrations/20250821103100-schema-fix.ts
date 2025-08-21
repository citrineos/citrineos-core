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
    if (!(await columnExists('ChargingNeeds', 'evseId'))) {
      await queryInterface.addColumn('ChargingNeeds', 'evseId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
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
      'ALTER TABLE "Connectors" ADD CONSTRAINT "Connectors_evseId_fkey" FOREIGN KEY ("evseId") REFERENCES "Evses" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Tariffs" ADD CONSTRAINT "Tariffs_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connectors" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariffs" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "Authorizations" ADD CONSTRAINT "Authorizations_groupAuthorizationId_fkey" FOREIGN KEY ("groupAuthorizationId") REFERENCES "Authorizations" (id) ON UPDATE CASCADE ON DELETE SET NULL;',
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
    await queryInterface.removeColumn('ChargingNeeds', 'evseId');
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
    await queryInterface.removeColumn('Evses', 'evseTypeId');
    await queryInterface.removeColumn('TransactionEvents', 'idTokenType');
    await queryInterface.removeColumn('Evses', 'evseId');
    await queryInterface.removeColumn('Evses', 'physicalReference');
    await queryInterface.removeColumn('Evses', 'removed');

    // 3. Drop EvseTypes table
    await queryInterface.dropTable('EvseTypes');

    // 4. Restore Evses table PK/index as needed
    await queryInterface.sequelize.query(
      'ALTER TABLE "Evses" DROP CONSTRAINT IF EXISTS "Evses_pkey";',
    );
  },
};
