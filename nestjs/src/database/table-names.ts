// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Single source of truth for the Postgres table names used by Drizzle.
 *
 * The legacy server defines these in @citrineos/base `Namespace`. We keep the
 * same casing (`Tenants`, `ChargingStations`, …) so seed scripts, migrations,
 * and parity test queries work against either target unchanged.
 */
export const TableName = {
  Tenants: 'Tenants',
  ChargingStations: 'ChargingStations',
  SecurityEvents: 'SecurityEvents',
  Boots: 'Boots',
  Components: 'Components',
  Variables: 'Variables',
  VariableAttributes: 'VariableAttributes',
  VariableMonitorings: 'VariableMonitorings',
  EventData: 'EventData',
  Authorizations: 'Authorizations',
  Reservations: 'Reservations',
  Transactions: 'Transactions',
  TransactionEvents: 'TransactionEvents',
  MeterValues: 'MeterValues',
  ChargingProfiles: 'ChargingProfiles',
  ChargingNeeds: 'ChargingNeeds',
  CompositeSchedules: 'CompositeSchedules',
  MessageInfos: 'MessageInfos',
  InstalledCertificates: 'InstalledCertificates',
  OcppMessages: 'OCPPMessages',
  LocalAuthListVersions: 'LocalListVersions',
  Tariffs: 'Tariffs',
  SalesTariffs: 'SalesTariffs',
  StatusNotifications: 'StatusNotifications',
  Connectors: 'Connectors',
  LatestStatusNotifications: 'LatestStatusNotifications',
  Locations: 'Locations',
  Evses: 'Evses',
  ChargingStationSecurityInfos: 'ChargingStationSecurityInfos',
  RemoteCommands: 'RemoteCommands',
  Subscriptions: 'Subscriptions',
  MeterValueSignatures: 'MeterValueSignatures',
  FileStorageEntries: 'FileStorageEntries',
  OcppLog: 'OcppLog',
  AuthorizationRestrictions: 'AuthorizationRestrictions',
  TenantUserRoles: 'TenantUserRoles',
  TenantPartners: 'TenantPartners',
  OcppFirmwareUpdate: 'OcppFirmwareUpdate',
  // F2 Phase B Wave 1 — entity backfill
  ChangeConfigurations: 'ChangeConfigurations',
  ChargingStationSequences: 'ChargingStationSequences',
  VariableCharacteristics: 'VariableCharacteristics',
  ServerNetworkProfiles: 'ServerNetworkProfiles',
  SetNetworkProfiles: 'SetNetworkProfiles',
  ChargingStationNetworkProfiles: 'ChargingStationNetworkProfiles',
  ChargingSchedules: 'ChargingSchedules',
  Certificates: 'Certificates',
  // F2 Phase B Wave 2 — cert dispatch attempts + local-list family + status snapshots
  DeleteCertificateAttempts: 'DeleteCertificateAttempts',
  InstallCertificateAttempts: 'InstallCertificateAttempts',
  SendLocalLists: 'SendLocalLists',
  LocalListAuthorizations: 'LocalListAuthorizations',
  SendLocalListAuthorizations: 'SendLocalListAuthorizations',
  LocalListVersionAuthorizations: 'LocalListVersionAuthorizations',
  EvseTypes: 'EvseTypes',
  VariableStatuses: 'VariableStatuses',
  VariableMonitoringStatuses: 'VariableMonitoringStatuses',
  // F2 Phase B Wave 3 — junction + 1.6 history + async job tracking
  ComponentVariables: 'ComponentVariables',
  StartTransactions: 'StartTransactions',
  StopTransactions: 'StopTransactions',
  AsyncJobStatuses: 'AsyncJobStatuses',
} as const;

export type TableNameKey = keyof typeof TableName;
