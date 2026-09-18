// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { QueryInterface } from 'sequelize';

export const HOT_PATH_INDEXES: ReadonlyArray<{ name: string; table: string; columns: string[] }> = [
  {
    name: 'transactions_tenant_id_ocpp_connection_name_is_active',
    table: 'Transactions',
    columns: ['tenantId', 'ocppConnectionName', 'isActive'],
  },
  {
    name: 'transactions_tenant_id_ocpp_connection_name_transaction_id',
    table: 'Transactions',
    columns: ['tenantId', 'ocppConnectionName', 'transactionId'],
  },
  {
    name: 'transactions_authorization_id',
    table: 'Transactions',
    columns: ['authorizationId'],
  },
  {
    name: 'transactions_tenant_id_updated_at',
    table: 'Transactions',
    columns: ['tenantId', 'updatedAt'],
  },
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
    name: 'latest_status_notifications_tenant_id_ocpp_connection_name',
    table: 'LatestStatusNotifications',
    columns: ['tenantId', 'ocppConnectionName'],
  },
  {
    name: 'connectors_evse_id',
    table: 'Connectors',
    columns: ['evseId'],
  },
  {
    name: 'charging_profiles_transaction_database_id',
    table: 'ChargingProfiles',
    columns: ['transactionDatabaseId'],
  },
  {
    name: 'charging_schedules_charging_profile_database_id',
    table: 'ChargingSchedules',
    columns: ['chargingProfileDatabaseId'],
  },
  {
    name: 'charging_needs_transaction_database_id',
    table: 'ChargingNeeds',
    columns: ['transactionDatabaseId'],
  },
  {
    name: 'authorizations_tenant_partner_id',
    table: 'Authorizations',
    columns: ['tenantPartnerId'],
  },
];

const quoted = (columns: string[]) => columns.map((column) => `"${column}"`).join(', ');

export async function up(queryInterface: QueryInterface): Promise<void> {
  for (const index of HOT_PATH_INDEXES) {
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "${index.name}" ON "${index.table}" (${quoted(index.columns)})`,
    );
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const index of HOT_PATH_INDEXES) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${index.name}"`);
  }
}
