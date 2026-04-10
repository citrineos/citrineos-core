// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPMessage } from './OCPPMessage.js';
import { Boot } from './Boot.js';
import { Tenant } from './Tenant.js';
import { Certificate } from './Certificate/Certificate.js';
import { InstalledCertificate } from './Certificate/InstalledCertificate.js';
import { ChangeConfiguration } from './ChangeConfiguration.js';
import { ChargingNeeds } from './ChargingProfile/ChargingNeeds.js';
import { ChargingProfile } from './ChargingProfile/ChargingProfile.js';
import { ChargingSchedule } from './ChargingProfile/ChargingSchedule.js';
import { CompositeSchedule } from './ChargingProfile/CompositeSchedule.js';
import { SalesTariff } from './ChargingProfile/SalesTariff.js';
import { Tariff } from './Tariff/Tariffs.js';
import { ChargingStation } from './Location/ChargingStation.js';
import { ChargingStationNetworkProfile } from './Location/ChargingStationNetworkProfile.js';
import { Connector } from './Location/Connector.js';
import { Evse } from './Location/Evse.js';
import { Location } from './Location/Location.js';
import { LatestStatusNotification } from './Location/LatestStatusNotification.js';
import { ServerNetworkProfile } from './Location/ServerNetworkProfile.js';
import { SetNetworkProfile } from './Location/SetNetworkProfile.js';
import { StatusNotification } from './Location/StatusNotification.js';
import {
  Component,
  ComponentVariable,
  EvseType,
  Variable,
  VariableAttribute,
  VariableCharacteristics,
  VariableStatus,
} from './DeviceModel/index.js';
import { VariableMonitoring } from './VariableMonitoring/VariableMonitoring.js';
import { VariableMonitoringStatus } from './VariableMonitoring/VariableMonitoringStatus.js';
import { Authorization } from './Authorization/Authorization.js';
import { LocalListAuthorization } from './Authorization/LocalListAuthorization.js';
import { LocalListVersion } from './Authorization/LocalListVersion.js';
import { LocalListVersionAuthorization } from './Authorization/LocalListVersionAuthorization.js';
import { SendLocalList } from './Authorization/SendLocalList.js';
import { SendLocalListAuthorization } from './Authorization/SendLocalListAuthorization.js';
import { TenantPartner } from './TenantPartner.js';
import { AsyncJobStatus } from './AsyncJob/AsyncJobStatus.js';
import { Reservation } from './Reservation.js';
import { SecurityEvent } from './SecurityEvent.js';
import { Subscription } from './Subscription/Subscription.js';
import { MessageInfo } from './MessageInfo/MessageInfo.js';
import { Transaction } from './TransactionEvent/Transaction.js';
import { TransactionEvent } from './TransactionEvent/TransactionEvent.js';
import { StartTransaction } from './TransactionEvent/StartTransaction.js';
import { StopTransaction } from './TransactionEvent/StopTransaction.js';
import { MeterValue } from './TransactionEvent/MeterValue.js';
import { EventData } from './VariableMonitoring/EventData.js';
import { ChargingStationSecurityInfo } from './ChargingStationSecurityInfo.js';
import { ChargingStationSequence } from './ChargingStationSequence/ChargingStationSequence.js';
import { DeleteCertificateAttempt } from './Certificate/DeleteCertificateAttempt.js';
import { InstallCertificateAttempt } from './Certificate/InstallCertificateAttempt.js';

export function defineAssociations() {
  // Tenant associations
  Tenant.hasMany(TenantPartner, { foreignKey: 'tenantId' });
  TenantPartner.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Authorization, { foreignKey: 'tenantId' });
  Authorization.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Boot, { foreignKey: 'tenantId' });
  Boot.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Certificate, { foreignKey: 'tenantId' });
  Certificate.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(InstalledCertificate, { foreignKey: 'tenantId' });
  InstalledCertificate.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(ChangeConfiguration, { foreignKey: 'tenantId' });
  ChangeConfiguration.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(ChargingNeeds, { foreignKey: 'tenantId' });
  ChargingNeeds.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(ChargingProfile, { foreignKey: 'tenantId' });
  ChargingProfile.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(ChargingSchedule, { foreignKey: 'tenantId' });
  ChargingSchedule.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(CompositeSchedule, { foreignKey: 'tenantId' });
  CompositeSchedule.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(SalesTariff, { foreignKey: 'tenantId' });
  SalesTariff.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Tariff, { foreignKey: 'tenantId' });
  Tariff.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(ChargingStation, { foreignKey: 'tenantId' });
  ChargingStation.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(ChargingStationNetworkProfile, { foreignKey: 'tenantId' });
  ChargingStationNetworkProfile.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Connector, { foreignKey: 'tenantId' });
  Connector.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Evse, { foreignKey: 'tenantId' });
  Evse.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Location, { foreignKey: 'tenantId' });
  Location.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(LatestStatusNotification, { foreignKey: 'tenantId' });
  LatestStatusNotification.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(ServerNetworkProfile, { foreignKey: 'tenantId' });
  ServerNetworkProfile.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(SetNetworkProfile, { foreignKey: 'tenantId' });
  SetNetworkProfile.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(StatusNotification, { foreignKey: 'tenantId' });
  StatusNotification.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Component, { foreignKey: 'tenantId' });
  Component.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(ComponentVariable, { foreignKey: 'tenantId' });
  ComponentVariable.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(EvseType, { foreignKey: 'tenantId' });
  EvseType.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Variable, { foreignKey: 'tenantId' });
  Variable.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(VariableAttribute, { foreignKey: 'tenantId' });
  VariableAttribute.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(VariableCharacteristics, { foreignKey: 'tenantId' });
  VariableCharacteristics.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(VariableMonitoring, { foreignKey: 'tenantId' });
  VariableMonitoring.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(VariableMonitoringStatus, { foreignKey: 'tenantId' });
  VariableMonitoringStatus.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(VariableStatus, { foreignKey: 'tenantId' });
  VariableStatus.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(LocalListAuthorization, { foreignKey: 'tenantId' });
  LocalListAuthorization.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(LocalListVersion, { foreignKey: 'tenantId' });
  LocalListVersion.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(LocalListVersionAuthorization, { foreignKey: 'tenantId' });
  LocalListVersionAuthorization.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(SendLocalList, { foreignKey: 'tenantId' });
  SendLocalList.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(SendLocalListAuthorization, { foreignKey: 'tenantId' });
  SendLocalListAuthorization.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Reservation, { foreignKey: 'tenantId' });
  Reservation.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(SecurityEvent, { foreignKey: 'tenantId' });
  SecurityEvent.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Subscription, { foreignKey: 'tenantId' });
  Subscription.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(MessageInfo, { foreignKey: 'tenantId' });
  MessageInfo.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(Transaction, { foreignKey: 'tenantId' });
  Transaction.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(TransactionEvent, { foreignKey: 'tenantId' });
  TransactionEvent.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(StartTransaction, { foreignKey: 'tenantId' });
  StartTransaction.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(StopTransaction, { foreignKey: 'tenantId' });
  StopTransaction.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(MeterValue, { foreignKey: 'tenantId' });
  MeterValue.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(EventData, { foreignKey: 'tenantId' });
  EventData.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(ChargingStationSecurityInfo, { foreignKey: 'tenantId' });
  ChargingStationSecurityInfo.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(ChargingStationSequence, { foreignKey: 'tenantId' });
  ChargingStationSequence.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(DeleteCertificateAttempt, { foreignKey: 'tenantId' });
  DeleteCertificateAttempt.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(InstallCertificateAttempt, { foreignKey: 'tenantId' });
  InstallCertificateAttempt.belongsTo(Tenant, { foreignKey: 'tenantId' });

  Tenant.hasMany(OCPPMessage, { foreignKey: 'tenantId' });
  OCPPMessage.belongsTo(Tenant, { foreignKey: 'tenantId' });

  // Remove duplicate tenant associations (they're already defined above)

  // Authorization associations
  Authorization.belongsTo(TenantPartner, {
    foreignKey: 'tenantPartnerId',
    as: 'authTenantPartnerAuthorization',
  });
  TenantPartner.hasMany(Authorization, {
    foreignKey: 'tenantPartnerId',
    as: 'tenantPartnerAuthorizations',
  });

  Authorization.belongsTo(Authorization, {
    foreignKey: 'groupAuthorizationId',
    as: 'groupAuthorization',
  });
  Authorization.hasMany(Authorization, {
    foreignKey: 'groupAuthorizationId',
    as: 'groupAuthorizations',
  });

  // LocalListAuthorization associations
  LocalListAuthorization.belongsTo(Authorization, {
    foreignKey: 'groupAuthorizationId',
    as: 'groupAuth',
  });
  LocalListAuthorization.belongsTo(Authorization, {
    foreignKey: 'authorizationId',
    as: 'authorization',
  });

  LocalListAuthorization.belongsToMany(SendLocalList, { through: SendLocalListAuthorization });
  SendLocalList.belongsToMany(LocalListAuthorization, { through: SendLocalListAuthorization });

  LocalListVersion.belongsToMany(LocalListAuthorization, {
    through: LocalListVersionAuthorization,
  });
  LocalListAuthorization.belongsToMany(LocalListVersion, {
    through: LocalListVersionAuthorization,
  });

  // Certificate associations
  InstalledCertificate.belongsTo(Certificate, { foreignKey: 'certificateId' });
  Certificate.hasMany(InstalledCertificate, { foreignKey: 'certificateId' });

  // ChargingProfile associations
  ChargingProfile.hasMany(ChargingSchedule, { foreignKey: 'chargingProfileDatabaseId' });
  ChargingSchedule.belongsTo(ChargingProfile, { foreignKey: 'chargingProfileDatabaseId' });

  ChargingSchedule.belongsTo(SalesTariff, { foreignKey: 'salesTariffId' });
  SalesTariff.hasMany(ChargingSchedule, { foreignKey: 'salesTariffId' });

  SalesTariff.belongsTo(ChargingSchedule, { foreignKey: 'chargingScheduleDatabaseId' });
  ChargingSchedule.hasMany(SalesTariff, { foreignKey: 'chargingScheduleDatabaseId' });

  ChargingProfile.belongsTo(Transaction, { foreignKey: 'transactionDatabaseId' });

  // ChargingNeeds associations
  ChargingNeeds.belongsTo(Evse, { foreignKey: 'evseId' });
  Evse.hasMany(ChargingNeeds, { foreignKey: 'evseId' });

  ChargingNeeds.belongsTo(Transaction, { foreignKey: 'transactionDatabaseId' });
  Transaction.hasMany(ChargingNeeds, { foreignKey: 'transactionDatabaseId' });

  ChargingStation.hasMany(ChargingStationSecurityInfo, { foreignKey: 'stationPkId' });
  ChargingStationSecurityInfo.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  // CompositeSchedule associations
  CompositeSchedule.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  CompositeSchedule.belongsTo(Evse, { foreignKey: 'evseId' });
  ChargingStation.hasMany(CompositeSchedule, { foreignKey: 'stationPkId' });
  Evse.hasMany(CompositeSchedule, { foreignKey: 'evseId' });

  // ChargingStation associations
  ChargingStation.hasMany(ChangeConfiguration, { foreignKey: 'stationPkId' });
  ChangeConfiguration.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(SendLocalList, { foreignKey: 'stationPkId' });
  SendLocalList.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(SecurityEvent, { foreignKey: 'stationPkId' });
  SecurityEvent.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(Subscription, { foreignKey: 'stationPkId' });
  Subscription.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(MessageInfo, { foreignKey: 'stationPkId' });
  MessageInfo.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(OCPPMessage, { foreignKey: 'stationPkId' });
  OCPPMessage.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(LocalListVersion, { foreignKey: 'stationPkId' });
  LocalListVersion.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(ChargingProfile, { foreignKey: 'stationPkId' });
  ChargingProfile.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(ChargingSchedule, { foreignKey: 'stationPkId' });
  ChargingSchedule.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(CompositeSchedule, { foreignKey: 'stationPkId' });
  CompositeSchedule.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(Tariff, { foreignKey: 'stationPkId' });
  Tariff.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(VariableMonitoring, { foreignKey: 'stationPkId' });
  VariableMonitoring.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(EventData, { foreignKey: 'stationPkId' });
  EventData.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(StartTransaction, { foreignKey: 'stationPkId' });
  StartTransaction.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(StopTransaction, { foreignKey: 'stationPkId' });
  StopTransaction.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(TransactionEvent, { foreignKey: 'stationPkId' });
  TransactionEvent.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  // Location associations
  Location.hasMany(ChargingStation, { foreignKey: 'locationId' });
  ChargingStation.belongsTo(Location, { foreignKey: 'locationId' });

  ChargingStation.hasMany(Connector, { foreignKey: 'stationPkId' });
  Connector.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  ChargingStation.hasMany(Evse, { foreignKey: 'stationPkId' });
  Evse.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });

  Evse.hasMany(Connector, { foreignKey: 'evseId' });
  Connector.belongsTo(Evse, { foreignKey: 'evseId' });

  // Connector to EvseType associations
  EvseType.hasMany(Connector, { foreignKey: 'evseTypeConnectorId' });
  Connector.belongsTo(EvseType, { foreignKey: 'evseTypeConnectorId' });

  // EvseType to Connector associations
  EvseType.belongsTo(Connector, { foreignKey: 'connectorId' });
  Connector.hasMany(EvseType, { foreignKey: 'connectorId' });

  Connector.hasMany(Tariff, { foreignKey: 'connectorId' });
  Tariff.belongsTo(Connector, { foreignKey: 'connectorId' });

  // ChargingStationNetworkProfile associations
  ChargingStationNetworkProfile.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  ChargingStationNetworkProfile.belongsTo(SetNetworkProfile, { foreignKey: 'setNetworkProfileId' });
  ChargingStationNetworkProfile.belongsTo(ServerNetworkProfile, {
    foreignKey: 'websocketServerConfigId',
  });

  SetNetworkProfile.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  SetNetworkProfile.belongsTo(ServerNetworkProfile, { foreignKey: 'websocketServerConfigId' });

  ServerNetworkProfile.belongsToMany(ChargingStation, { through: ChargingStationNetworkProfile });
  ChargingStation.belongsToMany(ServerNetworkProfile, { through: ChargingStationNetworkProfile });

  // StatusNotification associations
  StatusNotification.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  StatusNotification.belongsTo(Connector, { foreignKey: 'connectorId' });
  LatestStatusNotification.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  LatestStatusNotification.belongsTo(StatusNotification, { foreignKey: 'statusNotificationId' });

  ChargingStation.hasMany(StatusNotification, { foreignKey: 'stationPkId' });
  Connector.hasMany(StatusNotification, { foreignKey: 'connectorId' });

  // DeviceModel associations
  Component.belongsToMany(Variable, { through: ComponentVariable });
  Variable.belongsToMany(Component, { through: ComponentVariable });

  // Component to EvseType associations
  Component.belongsTo(EvseType, { foreignKey: 'evseDatabaseId' });
  EvseType.hasMany(Component, { foreignKey: 'evseDatabaseId' });

  VariableAttribute.belongsTo(Variable, { foreignKey: 'variableId' });
  Variable.hasMany(VariableAttribute, { foreignKey: 'variableId' });

  VariableAttribute.belongsTo(Component, { foreignKey: 'componentId' });
  Component.hasMany(VariableAttribute, { foreignKey: 'componentId' });

  VariableAttribute.belongsTo(EvseType, { foreignKey: 'evseDatabaseId' });
  EvseType.hasMany(VariableAttribute, { foreignKey: 'evseDatabaseId' });

  VariableAttribute.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  ChargingStation.hasMany(VariableAttribute, { foreignKey: 'stationPkId' });

  VariableAttribute.hasMany(VariableStatus, { foreignKey: 'variableAttributeId' });
  VariableStatus.belongsTo(VariableAttribute, { foreignKey: 'variableAttributeId' });

  VariableAttribute.belongsTo(Boot, { foreignKey: 'bootConfigId' });
  Boot.hasMany(VariableAttribute, { foreignKey: 'bootConfigId' });

  VariableCharacteristics.belongsTo(Variable, { foreignKey: 'variableId' });
  Variable.hasOne(VariableCharacteristics, { foreignKey: 'variableId' });

  // VariableMonitoring associations
  VariableMonitoring.belongsTo(Variable, { foreignKey: 'variableId' });
  Variable.hasMany(VariableMonitoring, { foreignKey: 'variableId' });

  VariableMonitoring.belongsTo(Component, { foreignKey: 'componentId' });
  Component.hasMany(VariableMonitoring, { foreignKey: 'componentId' });

  VariableMonitoringStatus.belongsTo(VariableMonitoring, { foreignKey: 'variableMonitoringId' });
  VariableMonitoring.hasMany(VariableMonitoringStatus, { foreignKey: 'variableMonitoringId' });

  // EventData associations
  EventData.belongsTo(Variable, { foreignKey: 'variableId' });
  EventData.belongsTo(Component, { foreignKey: 'componentId' });

  // MessageInfo associations
  MessageInfo.belongsTo(Component, { foreignKey: 'displayComponentId' });
  Component.hasMany(MessageInfo, { foreignKey: 'displayComponentId' });

  // OCPPMessage associations
  OCPPMessage.belongsTo(OCPPMessage, { foreignKey: 'requestMessageId', as: 'requestMessage' });
  OCPPMessage.hasMany(OCPPMessage, { foreignKey: 'requestMessageId', as: 'responseMessages' });

  // TransactionEvent associations
  TransactionEvent.belongsTo(Transaction, { foreignKey: 'transactionDatabaseId' });
  TransactionEvent.belongsTo(EvseType, { foreignKey: 'evseId' });

  // StopTransaction associations
  StopTransaction.belongsTo(Transaction, { foreignKey: 'transactionDatabaseId' });
  StopTransaction.hasMany(MeterValue, { foreignKey: 'stopTransactionDatabaseId' });

  // MeterValue associations
  MeterValue.belongsTo(Transaction, { foreignKey: 'transactionDatabaseId' });
  MeterValue.belongsTo(TransactionEvent, { foreignKey: 'transactionEventDatabaseId' });
  MeterValue.belongsTo(StopTransaction, { foreignKey: 'stopTransactionDatabaseId' });
  MeterValue.belongsTo(Connector, { foreignKey: 'connectorId' });
  MeterValue.belongsTo(Tariff, { foreignKey: 'tariffId' });

  Transaction.hasMany(MeterValue, { foreignKey: 'transactionDatabaseId' });
  TransactionEvent.hasMany(MeterValue, { foreignKey: 'transactionEventDatabaseId' });
  StopTransaction.hasMany(MeterValue, { foreignKey: 'stopTransactionDatabaseId' });
  Connector.hasMany(MeterValue, { foreignKey: 'connectorId' });
  Tariff.hasMany(MeterValue, { foreignKey: 'tariffId' });

  // StartTransaction associations
  StartTransaction.belongsTo(Transaction, { foreignKey: 'transactionDatabaseId' });
  StartTransaction.belongsTo(Connector, { foreignKey: 'connectorDatabaseId' });
  Connector.hasMany(StartTransaction, { foreignKey: 'connectorDatabaseId' });

  // Transaction associations
  Transaction.hasMany(TransactionEvent, { foreignKey: 'transactionDatabaseId' });
  Transaction.hasMany(StartTransaction, { foreignKey: 'transactionDatabaseId' });
  Transaction.hasMany(StopTransaction, { foreignKey: 'transactionDatabaseId' });

  Transaction.belongsTo(Location, { foreignKey: 'locationId' });
  Location.hasMany(Transaction, { foreignKey: 'locationId' });

  Transaction.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  ChargingStation.hasMany(Transaction, { foreignKey: 'stationPkId' });

  Transaction.belongsTo(Connector, { foreignKey: 'connectorId' });
  Connector.hasMany(Transaction, { foreignKey: 'connectorId' });

  Transaction.belongsTo(Evse, { foreignKey: 'evseId' });
  Evse.hasMany(Transaction, { foreignKey: 'evseId' });

  // Transaction additional associations
  Transaction.belongsTo(Authorization, { foreignKey: 'authorizationId' });
  Authorization.hasMany(Transaction, { foreignKey: 'authorizationId' });

  Transaction.belongsTo(Tariff, { foreignKey: 'tariffId' });
  Tariff.hasMany(Transaction, { foreignKey: 'tariffId' });

  // Reservation associations
  Reservation.belongsTo(EvseType, { foreignKey: 'evseId' });
  EvseType.hasMany(Reservation, { foreignKey: 'evseId' });

  // AsyncJobStatus associations
  AsyncJobStatus.belongsTo(TenantPartner, {
    foreignKey: 'tenantPartnerId',
    as: 'asyncJobTenantPartner',
  });
  TenantPartner.hasMany(AsyncJobStatus, { foreignKey: 'tenantPartnerId' });

  // Certificate associations
  DeleteCertificateAttempt.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  ChargingStation.hasMany(DeleteCertificateAttempt, { foreignKey: 'stationPkId' });

  InstallCertificateAttempt.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  InstallCertificateAttempt.belongsTo(Certificate, { foreignKey: 'certificateId' });

  InstalledCertificate.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  ChargingStation.hasMany(InstalledCertificate, { foreignKey: 'stationPkId' });

  // ChargingStationSequence associations
  ChargingStationSequence.belongsTo(ChargingStation, { foreignKey: 'stationPkId' });
  ChargingStation.hasMany(ChargingStationSequence, { foreignKey: 'stationPkId' });
}
