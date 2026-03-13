// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration to add latestOcppMessageTimestamp.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add new latestOcppMessageTimestamp column
  await queryInterface.addColumn('ChargingStations', 'latestOcppMessageTimestamp', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  // Add index on latestOcppMessageTimestamp for efficient staleness queries
  await queryInterface.addIndex('ChargingStations', ['latestOcppMessageTimestamp'], {
    name: 'idx_charging_stations_latest_ocpp_message_timestamp',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove index
  await queryInterface.removeIndex(
    'ChargingStations',
    'idx_charging_stations_latest_ocpp_message_timestamp',
  );

  // Remove latestOcppMessageTimestamp column
  await queryInterface.removeColumn('ChargingStations', 'latestOcppMessageTimestamp');
}
