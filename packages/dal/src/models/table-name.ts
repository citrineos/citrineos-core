// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
export const TableName = {
  // Already migrated to Drizzle
  SecurityEvents: 'SecurityEvents',
  Subscriptions: 'Subscriptions',
  ServerNetworkProfiles: 'ServerNetworkProfiles',
  Tenants: 'Tenants',

  // Async jobs
  AsyncJobStatuses: 'AsyncJobStatuses',

  // Authorization
  Authorizations: 'Authorizations',
  LocalListAuthorizations: 'LocalListAuthorizations',
  LocalListVersions: 'LocalListVersions',
  LocalListVersionAuthorizations: 'LocalListVersionAuthorizations',
  SendLocalLists: 'SendLocalLists',
  SendLocalListAuthorizations: 'SendLocalListAuthorizations',

  // Boot
  Boots: 'Boots',

  // Certificates
  Certificates: 'Certificates',
  InstalledCertificates: 'InstalledCertificates',
  DeleteCertificateAttempts: 'DeleteCertificateAttempts',
  InstallCertificateAttempts: 'InstallCertificateAttempts',

  // Configuration
  ChangeConfigurations: 'ChangeConfigurations',

  // Charging profile
  ChargingNeeds: 'ChargingNeeds',
  ChargingProfiles: 'ChargingProfiles',
  ChargingSchedules: 'ChargingSchedules',
  CompositeSchedules: 'CompositeSchedules',
  SalesTariffs: 'SalesTariffs',

  // Charging station
  ChargingStations: 'ChargingStations',
  ChargingStationSecurityInfos: 'ChargingStationSecurityInfos',
  ChargingStationSequences: 'ChargingStationSequences',
  ChargingStationNetworkProfiles: 'ChargingStationNetworkProfiles',

  // Device model
  Components: 'Components',
  ComponentVariables: 'ComponentVariables',
  EvseTypes: 'EvseTypes',
  Variables: 'Variables',
  VariableAttributes: 'VariableAttributes',
  VariableCharacteristics: 'VariableCharacteristics',
  VariableStatuses: 'VariableStatuses',

  // Location
  Connectors: 'Connectors',
  Evses: 'Evses',
  LatestStatusNotifications: 'LatestStatusNotifications',
  Locations: 'Locations',
  SetNetworkProfiles: 'SetNetworkProfiles',
  StatusNotifications: 'StatusNotifications',

  // Messaging
  MessageInfos: 'MessageInfos',
  OCPPMessages: 'OCPPMessages',

  // Reservation
  Reservations: 'Reservations',

  // Tariff
  Tariffs: 'Tariffs',

  // Transaction
  MeterValues: 'MeterValues',
  StartTransactions: 'StartTransactions',
  StopTransactions: 'StopTransactions',
  Transactions: 'Transactions',
  TransactionEvents: 'TransactionEvents',

  // Tenant
  TenantPartners: 'TenantPartners',

  // Variable monitoring
  EventData: 'EventData',
  VariableMonitorings: 'VariableMonitorings',
  VariableMonitoringStatuses: 'VariableMonitoringStatuses',
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];
