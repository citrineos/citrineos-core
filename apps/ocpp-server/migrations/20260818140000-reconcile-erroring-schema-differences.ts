import { DataTypes, QueryInterface } from 'sequelize';
import { DEFAULT_TENANT_ID } from '@citrineos/base';

/**
 * Resolves the following errors when starting up CitrineOS due to missing columns:
 *
 * 1. Column "AsyncJobStatuses"."tenantId" is declared by model AsyncJobStatus but does not exist
 *    - Resolved by adding the tenantId column to AsyncJobStatuses
 * 2. Column "ChargingStationNetworkProfiles"."ocppConnectionName" is VARCHAR(36), narrower than
 * the declared VARCHAR(255); values the model permits will be rejected
 *    - Resolved by changing the ocppConnectionName column from VARCHAR(36) to VARCHAR(255)
 * 3. Column "Evses"."ocppConnectionName" is VARCHAR(36), narrower than the declared VARCHAR(255);
 * values the model permits will be rejected
 *    - Resolved by changing the ocppConnectionName column from VARCHAR(36) to VARCHAR(255)
 * 4. Column "MeterValues"."sampledValue" has type JSON but the model declares JSONB
 *    - Resolved by changing the ocppConnectionName column from VARCHAR(36) to VARCHAR(255)
 * 5. Column "StatusNotifications"."ocppConnectionName" is VARCHAR(36), narrower than the declared
 * VARCHAR(255); values the model permits will be rejected
 *    - Resolved by changing the ocppConnectionName column from VARCHAR(36) to VARCHAR(255)
 * 6. Column "LatestStatusNotifications"."ocppConnectionName" is VARCHAR(36), narrower than the
 * declared VARCHAR(255); values the model permits will be rejected
 *    - Resolved by changing the ocppConnectionName column from VARCHAR(36) to VARCHAR(255)
 * 7. Column "Tariffs"."tariffAltText" has type VARCHAR(255) but the model declares JSONB
 *    - Resolved by changing the tariffAltText column from VARCHAR(255) to JSONB
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // AsyncJobStatuses
      await queryInterface.addColumn(
        'AsyncJobStatuses',
        'tenantId',
        {
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
        { transaction },
      );

      // ChargingStationNetworkProfiles
      await queryInterface.changeColumn(
        'ChargingStationNetworkProfiles',
        'ocppConnectionName',
        {
          type: 'VARCHAR(255)',
        },
        { transaction },
      );

      // Evses
      await queryInterface.changeColumn(
        'Evses',
        'ocppConnectionName',
        {
          type: 'VARCHAR(255)',
        },
        { transaction },
      );

      // MeterValues
      await queryInterface.changeColumn(
        'MeterValues',
        'sampledValue',
        {
          type: DataTypes.JSONB,
        },
        { transaction },
      );

      // StatusNotifications
      await queryInterface.changeColumn(
        'StatusNotifications',
        'ocppConnectionName',
        {
          type: 'VARCHAR(255)',
        },
        { transaction },
      );

      // LatestStatusNotifications
      await queryInterface.changeColumn(
        'LatestStatusNotifications',
        'ocppConnectionName',
        {
          type: 'VARCHAR(255)',
        },
        { transaction },
      );

      // Tariffs
      await queryInterface.sequelize.query(
        `ALTER TABLE "Tariffs"
           ALTER COLUMN "tariffAltText" TYPE JSONB
           USING NULLIF(BTRIM("tariffAltText"), '')::jsonb;`,
        { transaction },
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // AsyncJobStatuses
      await queryInterface.removeColumn('AsyncJobStatuses', 'tenantId', { transaction });

      // ChargingStationNetworkProfiles
      await queryInterface.changeColumn(
        'ChargingStationNetworkProfiles',
        'ocppConnectionName',
        {
          type: 'VARCHAR(36)',
        },
        { transaction },
      );

      // Evses
      await queryInterface.changeColumn(
        'Evses',
        'ocppConnectionName',
        {
          type: 'VARCHAR(36)',
        },
        { transaction },
      );

      // MeterValues
      await queryInterface.changeColumn(
        'MeterValues',
        'sampledValue',
        {
          type: DataTypes.JSON,
        },
        { transaction },
      );

      // StatusNotifications
      await queryInterface.changeColumn(
        'StatusNotifications',
        'ocppConnectionName',
        {
          type: 'VARCHAR(36)',
        },
        { transaction },
      );

      // LatestStatusNotifications
      await queryInterface.changeColumn(
        'LatestStatusNotifications',
        'ocppConnectionName',
        {
          type: 'VARCHAR(36)',
        },
        { transaction },
      );

      // Tariffs
      await queryInterface.sequelize.query(
        `ALTER TABLE "Tariffs"
                 ALTER COLUMN "tariffAltText" TYPE VARCHAR(255)
                 USING "tariffAltText"::text;`,
        { transaction },
      );
    });
  },
};
