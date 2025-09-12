// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

const TABLE_NAME = 'AsyncJobStatuses';

export = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable(TABLE_NAME, {
      jobId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      jobName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tenantPartnerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'TenantPartners',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      finishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      stoppedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      stopScheduled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isFailed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      paginationParams: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      totalObjects: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable(TABLE_NAME);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_AsyncJobStatuses_jobName";
    `);
  },
};
