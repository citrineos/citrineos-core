// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = 'DataTransferData';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable(TABLE, {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      stationId: { type: DataTypes.STRING, allowNull: true },
      ocppMessageId: { type: DataTypes.STRING, allowNull: true },
      direction: { type: DataTypes.STRING, allowNull: false },
      ocppVersion: { type: DataTypes.STRING, allowNull: true },
      vendorId: { type: DataTypes.STRING(255), allowNull: false },
      messageId: { type: DataTypes.STRING(50), allowNull: true },
      dataRaw: { type: DataTypes.TEXT, allowNull: true },
      dataParsed: { type: DataTypes.JSONB, allowNull: true },
      dataEncoding: { type: DataTypes.STRING, allowNull: false },
      parser: { type: DataTypes.STRING, allowNull: true },
      responseStatus: { type: DataTypes.STRING, allowNull: false },
      responseData: { type: DataTypes.TEXT, allowNull: true },
      transactionDbId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Transactions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      vid: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.addIndex(TABLE, ['vendorId', 'messageId'], {
      name: 'data_transfer_vendor_message_idx',
    });
    await queryInterface.addIndex(TABLE, ['stationId', 'createdAt'], {
      name: 'data_transfer_station_time_idx',
    });
    await queryInterface.addIndex(TABLE, ['transactionDbId'], {
      name: 'data_transfer_transaction_idx',
    });
    await queryInterface.addIndex(TABLE, ['vid'], {
      name: 'data_transfer_vid_idx',
    });
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS data_transfer_parsed_gin_idx ON "DataTransferData" USING GIN ("dataParsed");',
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable(TABLE);
  },
};
