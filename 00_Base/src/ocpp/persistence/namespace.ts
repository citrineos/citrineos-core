// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * Persisted DataTypes and their namespaces
 */

export enum Namespace {
  BootConfig = 'Boot',
  ChargingStation = 'ChargingStation',
  IdToken = 'IdToken',
  IdTokenInfo = 'IdTokenInfo', // IdTokenInfoType in OCPP2.0.1, IdTagInfo in OCPP1.6
  MeterValue = 'MeterValue',
  StatusNotificationRequest = 'StatusNotification',
}

export enum OCPP2_0_1_Namespace {
  AdditionalInfoType = 'AdditionalInfo',
  AuthorizationData = 'Authorization',
  AuthorizationRestrictions = 'AuthorizationRestrictions',
  Certificate = 'Certificate',
  InstalledCertificate = 'InstalledCertificate',
  CertificateChain = 'CertificateChain',
  ChargingNeeds = 'ChargingNeeds',
  ChargingProfile = 'ChargingProfile',
  ChargingSchedule = 'ChargingSchedule',
  ChargingStationSecurityInfo = 'ChargingStationSecurityInfo',
  ComponentType = 'Component',
  CompositeSchedule = 'CompositeSchedule',
  EVSEType = 'Evse',
  EventDataType = 'EventData',
  FileURL = 'FileURL',
  LatestStatusNotification = 'LatestStatusNotification',
  LocalListAuthorization = 'LocalListAuthorization',
  LocalListVersion = 'LocalListVersion',
  Location = 'Location',
  MessageInfoType = 'MessageInfo',
  PasswordType = 'Password',
  ReserveNowRequest = 'Reservation',
  RootCertificate = 'RootCertificate',
  SalesTariff = 'SalesTariff',
  SecurityEventNotificationRequest = 'SecurityEvent',
  SendLocalListRequest = 'SendLocalList',
  ServerNetworkProfile = 'ServerNetworkProfile',
  Subscription = 'Subscription',
  SystemConfig = 'SystemConfig',
  TlsCertificates = 'TlsCertificates',
  TransactionEventRequest = 'TransactionEvent',
  TransactionType = 'Transaction',
  Tariff = 'Tariff',
  VariableAttributeType = 'VariableAttribute',
  VariableCharacteristicsType = 'VariableCharacteristics',
  VariableMonitoringType = 'VariableMonitoring',
  VariableMonitoringStatus = 'VariableMonitoringStatus',
  VariableStatus = 'VariableStatus',
  VariableType = 'Variable',
}

export enum OCPP1_6_Namespace {
  ChangeConfiguration = 'ChangeConfiguration',
  Connector = 'Connector',
}
