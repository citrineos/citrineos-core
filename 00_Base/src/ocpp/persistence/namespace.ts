// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * Persisted DataTypes and their namespaces
 */

export enum Namespace {
  BootConfig = 'Boot',
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
  ChargingStation = 'ChargingStation',
  ChargingStationSecurityInfo = 'ChargingStationSecurityInfo',
  ComponentType = 'Component',
  CompositeSchedule = 'CompositeSchedule',
  EVSEType = 'Evse',
  EventDataType = 'EventData',
  FileURL = 'FileURL',
  IdTokenInfoType = 'IdTokenInfo',
  IdTokenType = 'IdToken',
  LatestStatusNotification = 'LatestStatusNotification',
  LocalListAuthorization = 'LocalListAuthorization',
  LocalListVersion = 'LocalListVersion',
  Location = 'Location',
  MeterValueType = 'MeterValue',
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
}
