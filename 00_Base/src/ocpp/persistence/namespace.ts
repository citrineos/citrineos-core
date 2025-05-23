// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * Persisted DataTypes and their namespaces
 */

export enum Namespace {
  AuthorizationData = 'Authorization',
  BootConfig = 'Boot',
  ChargingProfile = 'ChargingProfile',
  ChargingSchedule = 'ChargingSchedule',
  ChargingStation = 'ChargingStation',
  CompositeSchedule = 'CompositeSchedule',
  IdTokenType = 'IdToken',
  IdTokenInfoType = 'IdTokenInfo',
  MeterValue = 'MeterValue',
  OCPPMessage = 'OCPPMessage',
  ReserveNowRequest = 'Reservation',
  StatusNotificationRequest = 'StatusNotification',
  TransactionType = 'Transaction',
  Websocket = 'Websocket',
}

export enum OCPP2_0_1_Namespace {
  AdditionalInfoType = 'AdditionalInfoType',
  AuthorizationRestrictions = 'AuthorizationRestrictions',
  Certificate = 'Certificate',
  ChargingNeeds = 'ChargingNeeds',
  InstalledCertificate = 'InstalledCertificate',
  CertificateChain = 'CertificateChain',
  ChargingStationSecurityInfo = 'ChargingStationSecurityInfo',
  ComponentType = 'Component',
  EVSEType = 'Evse',
  EventDataType = 'EventData',
  FileURL = 'FileURL',
  LatestStatusNotification = 'LatestStatusNotification',
  LocalListAuthorization = 'LocalListAuthorization',
  LocalListVersion = 'LocalListVersion',
  Location = 'Location',
  MessageInfoType = 'MessageInfo',
  PasswordType = 'Password',
  RootCertificate = 'RootCertificate',
  SalesTariff = 'SalesTariff',
  SecurityEventNotificationRequest = 'SecurityEvent',
  SendLocalListRequest = 'SendLocalList',
  ServerNetworkProfile = 'ServerNetworkProfile',
  Subscription = 'Subscription',
  SystemConfig = 'SystemConfig',
  TlsCertificates = 'TlsCertificates',
  TransactionEventRequest = 'TransactionEvent',
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
  StartTransaction = 'StartTransaction',
  StopTransaction = 'StopTransaction',
}
