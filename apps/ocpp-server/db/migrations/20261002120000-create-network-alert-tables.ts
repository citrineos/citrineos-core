// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DataTypes, Op, QueryInterface } from 'sequelize';

const timestamps = {
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
};

const tenantId = {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: 'Tenants',
    key: 'id',
  },
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
};

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'NetworkAlerts',
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          type: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          severity: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          status: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          stationId: {
            type: DataTypes.INTEGER,
            references: {
              model: 'ChargingStations',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          evseId: {
            type: DataTypes.INTEGER,
            references: {
              model: 'Evses',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          connectorId: {
            type: DataTypes.INTEGER,
            references: {
              model: 'Connectors',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          firstSeenAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          lastSeenAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          occurrenceCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
          },
          resolvedAt: {
            type: DataTypes.DATE,
          },
          resolvedBy: {
            type: DataTypes.STRING,
          },
          details: {
            type: DataTypes.JSONB,
            allowNull: false,
          },
          tenantId,
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.addIndex('NetworkAlerts', ['stationId'], {
        name: 'network_alerts_station_id',
        transaction,
      });
      await queryInterface.addIndex('NetworkAlerts', ['tenantId', 'stationId', 'type'], {
        name: 'network_alerts_open_lookup',
        where: { status: { [Op.ne]: 'Resolved' } },
        transaction,
      });

      await queryInterface.createTable(
        'NetworkAlertOccurrences',
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          alertId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: 'NetworkAlerts',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          type: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          occurredAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          severity: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          websocketEventId: {
            type: DataTypes.INTEGER,
          },
          statusNotificationId: {
            type: DataTypes.INTEGER,
            references: {
              model: 'StatusNotifications',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          ocppMessageId: {
            type: DataTypes.INTEGER,
          },
          details: {
            type: DataTypes.JSONB,
            allowNull: false,
          },
          tenantId,
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.addIndex('NetworkAlertOccurrences', ['alertId', 'occurredAt'], {
        name: 'network_alert_occurrences_alert_id_occurred_at',
        transaction,
      });
      await queryInterface.addIndex('NetworkAlertOccurrences', ['statusNotificationId'], {
        name: 'network_alert_occurrences_status_notification_id',
        transaction,
      });

      await queryInterface.createTable(
        'NetworkAlertConfigs',
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          type: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          enabled: {
            type: DataTypes.BOOLEAN,
          },
          rules: {
            type: DataTypes.JSONB,
          },
          tenantId,
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.addIndex('NetworkAlertConfigs', ['tenantId', 'type'], {
        name: 'network_alert_configs_tenant_id_type',
        unique: true,
        transaction,
      });
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('NetworkAlertConfigs', { transaction });
      await queryInterface.dropTable('NetworkAlertOccurrences', { transaction });
      await queryInterface.dropTable('NetworkAlerts', { transaction });
    });
  },
};
