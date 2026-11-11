// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { DataTypes, QueryInterface } from 'sequelize';

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

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'PaymentAccounts',
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          tenantId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
              model: 'Tenants',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },
          stripeAccountId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          scanAndChargeEnabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'Checkouts',
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          publicId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            defaultValue: queryInterface.sequelize.literal('gen_random_uuid()'),
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
          stripeAccountId: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          flow: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          status: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          connectorId: {
            type: DataTypes.INTEGER,
            references: {
              model: 'Connectors',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          tariffId: {
            type: DataTypes.INTEGER,
            references: {
              model: 'Tariffs',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          tariffSnapshot: {
            type: DataTypes.JSONB,
            allowNull: false,
          },
          // No foreign key: "Transactions" is range-partitioned and its retention job detaches
          // old partitions, which Postgres refuses while another table references their rows.
          // A checkout is a payment record and has to outlive that window.
          transactionDatabaseId: {
            type: DataTypes.INTEGER,
          },
          currency: {
            type: DataTypes.CHAR(3),
            allowNull: false,
          },
          authorizedAmount: {
            type: DataTypes.INTEGER,
          },
          capturedAmount: {
            type: DataTypes.INTEGER,
          },
          paymentIntentId: {
            type: DataTypes.STRING,
            unique: true,
          },
          remoteStartStatus: {
            type: DataTypes.STRING,
          },
          qrDisplayMessageId: {
            type: DataTypes.INTEGER,
          },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.addIndex('Checkouts', ['tenantId', 'transactionDatabaseId'], {
        name: 'checkouts_tenant_transaction',
        transaction,
      });
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('Checkouts', { transaction });
      await queryInterface.dropTable('PaymentAccounts', { transaction });
    });
  },
};
