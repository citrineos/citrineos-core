// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { QueryInterface } from 'sequelize';

/**
 * Indexes for the lookups the message handlers run on every transaction event, meter value and
 * status notification. Postgres does not index a foreign key column on its own, and the initial
 * migration indexed the station name on most tables but nothing on MeterValues, TransactionEvents
 * or Transactions beyond their keys - so each of these was a sequential scan of a table that only
 * grows.
 *
 * Every index here has a query behind it; the reference is the repository method or handler that
 * runs it. tenantId leads where the base repository adds it to every where clause.
 */
export const HOT_PATH_INDEXES: ReadonlyArray<{ name: string; table: string; columns: string[] }> = [
  // TransactionEvent.ts getActiveTransactionByStationIdAndEvseId / getEvseIdsWithActiveTransactionByStationId /
  // deactivateActiveTransactionsByStationIdAndEvseId, ChargingProfile.ts createChargingNeeds:
  // where { tenantId, ocppConnectionName, isActive }
  {
    name: 'transactions_tenant_id_ocpp_connection_name_is_active',
    table: 'Transactions',
    columns: ['tenantId', 'ocppConnectionName', 'isActive'],
  },
  // TransactionEvent.ts readTransactionByStationIdAndTransactionId / updateTransactionByStationIdAndTransactionId,
  // StopTransactionRequestOcpp16Handler: where { tenantId, ocppConnectionName, transactionId }. The unique
  // index is on (stationId, transactionId); these read by the name column.
  {
    name: 'transactions_tenant_id_ocpp_connection_name_transaction_id',
    table: 'Transactions',
    columns: ['tenantId', 'ocppConnectionName', 'transactionId'],
  },
  // TransactionEvent.ts readAllActiveTransactionsByAuthorizationId - the concurrent-transaction check on
  // every Authorize and every TransactionEvent(Started); the OCPI Sessions and CDRs join.
  {
    name: 'transactions_authorization_id',
    table: 'Transactions',
    columns: ['authorizationId'],
  },
  // TransactionEvent.ts getTransactions / getTransactionsCount, OCPI SessionsService / CdrsService:
  // where { tenantId, updatedAt >= dateFrom, updatedAt < dateTo }
  {
    name: 'transactions_tenant_id_updated_at',
    table: 'Transactions',
    columns: ['tenantId', 'updatedAt'],
  },
  // TransactionEvent.ts readAllMeterValuesByTransactionDataBaseId, and the MeterValue include on every
  // Transaction read (findByTransactionId, getActiveTransactionByStationIdAndEvseId, getTransactions).
  {
    name: 'meter_values_transaction_database_id',
    table: 'MeterValues',
    columns: ['transactionDatabaseId'],
  },
  // The MeterValue include on a TransactionEvent read.
  {
    name: 'meter_values_transaction_event_id',
    table: 'MeterValues',
    columns: ['transactionEventId'],
  },
  // The TransactionEvent include on every Transaction read.
  {
    name: 'transaction_events_transaction_database_id',
    table: 'TransactionEvents',
    columns: ['transactionDatabaseId'],
  },
  // Location.ts addStatusNotificationToChargingStation: where { tenantId, ocppConnectionName } on every
  // StatusNotification.
  {
    name: 'latest_status_notifications_tenant_id_ocpp_connection_name',
    table: 'LatestStatusNotifications',
    columns: ['tenantId', 'ocppConnectionName'],
  },
  // Location.ts readChargingStationByStationId includes Evse -> Connector, and runs on every
  // StatusNotification and every 2.x transaction event.
  {
    name: 'connectors_evse_id',
    table: 'Connectors',
    columns: ['evseId'],
  },
  // ChargingProfile.ts, SetChargingProfileEndpoint and TransactionEventRequestOcpp2Handler (E17):
  // where { transactionDatabaseId, chargingProfilePurpose, isActive }
  {
    name: 'charging_profiles_transaction_database_id',
    table: 'ChargingProfiles',
    columns: ['transactionDatabaseId'],
  },
  // ChargingProfile.ts: where { chargingProfileDatabaseId }, and the ChargingSchedule include.
  {
    name: 'charging_schedules_charging_profile_database_id',
    table: 'ChargingSchedules',
    columns: ['chargingProfileDatabaseId'],
  },
  // ChargingProfile.ts: where { evseId, transactionDatabaseId }
  {
    name: 'charging_needs_transaction_database_id',
    table: 'ChargingNeeds',
    columns: ['transactionDatabaseId'],
  },
  // OCPI SessionsService / CdrsService join Authorization -> TenantPartner to filter by the party.
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
