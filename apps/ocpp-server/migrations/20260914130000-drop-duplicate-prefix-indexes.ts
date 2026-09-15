// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { QueryInterface } from 'sequelize';

export const DUPLICATE_PREFIX_INDEXES: ReadonlyArray<{
  name: string;
  table: string;
  columns: string[];
}> = [
  {
    name: 'meter_values_transaction_database_id',
    table: 'MeterValues',
    columns: ['transactionDatabaseId'],
  },
  {
    name: 'meter_values_transaction_event_id',
    table: 'MeterValues',
    columns: ['transactionEventId'],
  },
  {
    name: 'transaction_events_transaction_database_id',
    table: 'TransactionEvents',
    columns: ['transactionDatabaseId'],
  },
  {
    name: 'event_data_station_id',
    table: 'EventData',
    columns: ['ocppConnectionName'],
  },
];

const quoted = (columns: string[]) => columns.map((column) => `"${column}"`).join(', ');

export async function up(queryInterface: QueryInterface): Promise<void> {
  for (const index of DUPLICATE_PREFIX_INDEXES) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${index.name}"`);
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const index of DUPLICATE_PREFIX_INDEXES) {
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "${index.name}" ON "${index.table}" (${quoted(index.columns)})`,
    );
  }
}
