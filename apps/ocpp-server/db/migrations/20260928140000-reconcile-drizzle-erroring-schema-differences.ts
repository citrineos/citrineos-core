// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DataTypes, QueryInterface } from 'sequelize';
import { DataType } from 'sequelize-typescript';

/**
 * Resolves the following errors when starting up CitrineOS due to mismatches between the Drizzle
 * models and database schema:
 *
 * 1. Column "Connectors"."evseId" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to Connectors.evseId
 * 2. Index "evseId_evseTypeConnectorId" on "Connectors" (unique index on (evseId, evseTypeConnectorId)) is declared by
 *    the drizzle schema but does not exist
 *    - Resolved by adding the evseId_evseTypeConnectorId index to Connectors.
 * 3. Column "Locations"."coordinates" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to Locations.coordinates
 * 4. Column "OCPPMessages"."timestamp" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to OCPPMessages.timestamp
 * 5. Column "SecurityEvents"."timestamp" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to SecurityEvents.timestamp
 * 6. Column "ServerNetworkProfiles"."host" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to ServerNetworkProfiles.host
 * 7. Column "ServerNetworkProfiles"."port" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to ServerNetworkProfiles.port
 * 8. Column "ServerNetworkProfiles"."pingInterval" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to ServerNetworkProfiles.pingInterval
 * 9. Column "ServerNetworkProfiles"."protocols" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to ServerNetworkProfiles.protocols
 * 10. Column "ServerNetworkProfiles"."messageTimeout" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to ServerNetworkProfiles.messageTimeout
 * 11. Column "ServerNetworkProfiles"."securityProfile" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to ServerNetworkProfiles.securityProfile
 * 12. Column "ServerNetworkProfiles"."allowUnknownChargingStations" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to ServerNetworkProfiles.allowUnknownChargingStations
 * 13. Column "StartTransactions"."transactionDatabaseId" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to StartTransactions.transactionDatabaseId
 * 14. Column "StartTransactions"."connectorDatabaseId" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to StartTransactions.connectorDatabaseId
 * 15. Column "StartTransactions"."timestamp" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to StartTransactions.timestamp
 * 16. Column "StartTransactions"."meterStart" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to StartTransactions.meterStart
 * 17. Column "StopTransactions"."transactionDatabaseId" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to StopTransactions.transactionDatabaseId
 * 18. Column "StopTransactions"."meterStop" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to StopTransactions.meterStop
 * 19. Column "StopTransactions"."timestamp" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to StopTransactions.timestamp
 * 20. Column "Subscriptions"."ocppConnectionName" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to Subscriptions.ocppConnectionName
 * 21. Column "Subscriptions"."onConnect" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to Subscriptions.onConnect
 * 22. Column "Subscriptions"."onClose" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to Subscriptions.onClose
 * 23. Column "Subscriptions"."onMessage" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to Subscriptions.onMessage
 * 24. Column "Subscriptions"."sentMessage" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to Subscriptions.sentMessage
 * 25. Column "Subscriptions"."url" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to Subscriptions.url
 * 26. Column "TransactionEvents"."ocppConnectionName" is nullable but the drizzle schema declares it NOT NULL a value the database does not guarantee
 *    - Resolved by adding NOT NULL to TransactionEvents.ocppConnectionName
 * 27. Column "TransactionEvents"."eventType" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to TransactionEvents.eventType
 * 28. Column "TransactionEvents"."timestamp" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to TransactionEvents.timestamp
 * 29. Column "TransactionEvents"."triggerReason" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to TransactionEvents.triggerReason
 * 30. Column "TransactionEvents"."seqNo" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to TransactionEvents.seqNo
 * 31. Column "Transactions"."transactionId" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to Transactions.transactionId
 * 32. Column "Transactions"."isActive" is nullable but the drizzle schema declares it NOT NULL
 *    - Resolved by adding NOT NULL to Transactions.isActive
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Connectors
      await queryInterface.changeColumn(
        'Connectors',
        'evseId',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addConstraint('Connectors', {
        fields: ['evseId', 'evseTypeConnectorId'],
        type: 'unique',
        name: 'evseId_evseTypeConnectorId',
        transaction,
      });

      // Locations
      await queryInterface.changeColumn(
        'Locations',
        'coordinates',
        {
          type: DataType.GEOMETRY('POINT'),
          allowNull: false,
        },
        { transaction },
      );

      // MeterValues
      await queryInterface.changeColumn(
        'MeterValues',
        'sampledValue',
        {
          type: DataType.JSONB,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'MeterValues',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: false,
        },
        { transaction },
      );

      // OCPP Messages
      await queryInterface.changeColumn(
        'OCPPMessages',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: false,
        },
        { transaction },
      );

      // SecurityEvents
      await queryInterface.changeColumn(
        'SecurityEvents',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: false,
        },
        { transaction },
      );

      // ServerNetworkProfiles
      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'host',
        {
          type: DataType.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'port',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'pingInterval',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'protocols',
        {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'messageTimeout',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'securityProfile',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'allowUnknownChargingStations',
        {
          type: DataType.BOOLEAN,
          allowNull: false,
        },
        { transaction },
      );

      // StartTransactions
      await queryInterface.changeColumn(
        'StartTransactions',
        'transactionDatabaseId',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'StartTransactions',
        'connectorDatabaseId',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'StartTransactions',
        'meterStart',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'StartTransactions',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: false,
        },
        { transaction },
      );

      // StopTransactions
      await queryInterface.changeColumn(
        'StopTransactions',
        'transactionDatabaseId',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'StopTransactions',
        'meterStop',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'StopTransactions',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: false,
        },
        { transaction },
      );

      // Subscriptions
      await queryInterface.changeColumn(
        'Subscriptions',
        'ocppConnectionName',
        {
          type: DataType.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Subscriptions',
        'onConnect',
        {
          type: DataType.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Subscriptions',
        'onClose',
        {
          type: DataType.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Subscriptions',
        'onMessage',
        {
          type: DataType.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Subscriptions',
        'sentMessage',
        {
          type: DataType.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Subscriptions',
        'url',
        {
          type: DataType.STRING,
          allowNull: false,
        },
        { transaction },
      );

      // TransactionEvents
      await queryInterface.changeColumn(
        'TransactionEvents',
        'ocppConnectionName',
        {
          type: DataType.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'TransactionEvents',
        'eventType',
        {
          type: DataType.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'TransactionEvents',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'TransactionEvents',
        'triggerReason',
        {
          type: DataType.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'TransactionEvents',
        'seqNo',
        {
          type: DataType.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      // Transactions
      await queryInterface.changeColumn(
        'Transactions',
        'transactionId',
        {
          type: DataType.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Transactions',
        'isActive',
        {
          type: DataType.BOOLEAN,
          allowNull: false,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Connectors
      await queryInterface.changeColumn(
        'Connectors',
        'evseId',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.removeConstraint('Connectors', 'evseId_evseTypeConnectorId', {
        transaction,
      });

      // Locations
      await queryInterface.changeColumn(
        'Locations',
        'coordinates',
        {
          type: DataType.GEOMETRY('POINT'),
          allowNull: true,
        },
        { transaction },
      );

      // MeterValues
      await queryInterface.changeColumn(
        'MeterValues',
        'sampledValue',
        {
          type: DataType.JSONB,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'MeterValues',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: true,
        },
        { transaction },
      );

      // OCPP Messages
      await queryInterface.changeColumn(
        'OCPPMessages',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: true,
        },
        { transaction },
      );

      // SecurityEvents
      await queryInterface.changeColumn(
        'SecurityEvents',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: true,
        },
        { transaction },
      );

      // ServerNetworkProfiles
      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'host',
        {
          type: DataType.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'port',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'pingInterval',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'protocols',
        {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'messageTimeout',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'securityProfile',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'ServerNetworkProfiles',
        'allowUnknownChargingStations',
        {
          type: DataType.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );

      // StartTransactions
      await queryInterface.changeColumn(
        'StartTransactions',
        'transactionDatabaseId',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'StartTransactions',
        'connectorDatabaseId',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'StartTransactions',
        'meterStart',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'StartTransactions',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: true,
        },
        { transaction },
      );

      // StopTransactions
      await queryInterface.changeColumn(
        'StopTransactions',
        'transactionDatabaseId',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'StopTransactions',
        'meterStop',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'StopTransactions',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: true,
        },
        { transaction },
      );

      // Subscriptions
      await queryInterface.changeColumn(
        'Subscriptions',
        'ocppConnectionName',
        {
          type: DataType.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Subscriptions',
        'onConnect',
        {
          type: DataType.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Subscriptions',
        'onClose',
        {
          type: DataType.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Subscriptions',
        'onMessage',
        {
          type: DataType.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Subscriptions',
        'sentMessage',
        {
          type: DataType.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Subscriptions',
        'url',
        {
          type: DataType.STRING,
          allowNull: true,
        },
        { transaction },
      );

      // TransactionEvents
      await queryInterface.changeColumn(
        'TransactionEvents',
        'ocppConnectionName',
        {
          type: DataType.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'TransactionEvents',
        'eventType',
        {
          type: DataType.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'TransactionEvents',
        'timestamp',
        {
          type: DataType.DATE,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'TransactionEvents',
        'triggerReason',
        {
          type: DataType.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'TransactionEvents',
        'seqNo',
        {
          type: DataType.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      // Transactions
      await queryInterface.changeColumn(
        'Transactions',
        'transactionId',
        {
          type: DataType.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Transactions',
        'isActive',
        {
          type: DataType.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );
    });
  },
};
