// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Migration to add state and requestMessageId self-referencing foreign key to OCPPMessages table.
 * This enables linking response messages to their corresponding request messages.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add new state column
  await queryInterface.addColumn('OCPPMessages', 'state', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  // Add new requestMessageId column
  await queryInterface.addColumn('OCPPMessages', 'requestMessageId', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'OCPPMessages',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  // Add index on requestMessageId for efficient queries
  await queryInterface.addIndex('OCPPMessages', ['requestMessageId'], {
    name: 'idx_ocpp_messages_request_message_id',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove index
  await queryInterface.removeIndex('OCPPMessages', 'idx_ocpp_messages_request_message_id');

  // Remove requestMessageId column
  await queryInterface.removeColumn('OCPPMessages', 'requestMessageId');

  // Remove state column
  await queryInterface.removeColumn('OCPPMessages', 'state');
}
