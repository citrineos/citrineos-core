// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Sequelize Persistence Models
export { Boot } from './model/Boot.js';
export {
  VariableAttribute,
  VariableCharacteristics,
  Component,
  EvseType,
  Variable,
  VariableStatus,
} from './model/DeviceModel/index.js';
export {
  Authorization,
  LocalListAuthorization,
  LocalListVersion,
  SendLocalList,
  LocalListVersionAuthorization,
  SendLocalListAuthorization,
} from './model/Authorization/index.js';
export {
  StartTransaction,
  StopTransaction,
  Transaction,
  TransactionEvent,
  MeterValue,
} from './model/TransactionEvent/index.js';
export { SecurityEvent } from './model/SecurityEvent.js';
export {
  VariableMonitoring,
  EventData,
  VariableMonitoringStatus,
} from './model/VariableMonitoring/index.js';
export {
  ChargingStation,
  Evse,
  ChargingStationNetworkProfile,
  LatestStatusNotification,
  Location,
  ServerNetworkProfile,
  SetNetworkProfile,
  StatusNotification,
  Connector,
} from './model/Location/index.js';
export { ChargingStationSequence } from './model/ChargingStationSequence/index.js';
export { MessageInfo } from './model/MessageInfo/index.js';
export { Tariff } from './model/Tariff/index.js';
export { Subscription } from './model/Subscription/index.js';
export {
  Certificate,
  SignatureAlgorithmEnumType,
  CountryNameEnumType,
  InstalledCertificate,
} from './model/Certificate/index.js';
export {
  ChargingProfile,
  ChargingNeeds,
  ChargingSchedule,
  CompositeSchedule,
  SalesTariff,
} from './model/ChargingProfile/index.js';
export { OCPPMessage } from './model/OCPPMessage.js';
export { Reservation } from './model/Reservation.js';
export { ChargingStationSecurityInfo } from './model/ChargingStationSecurityInfo.js';
export { ChangeConfiguration } from './model/ChangeConfiguration.js';
export { Tenant } from './model/Tenant.js';
export { TenantPartner } from './model/TenantPartner.js';
export type { PaginatedParams } from './model/AsyncJob/index.js';
export {
  AsyncJobStatus,
  AsyncJobStatusDTO,
  AsyncJobRequest,
  AsyncJobName,
  AsyncJobAction,
} from './model/AsyncJob/index.js';

// Sequelize Repositories
export { SequelizeRepository } from './repository/Base.js';
export { SequelizeAuthorizationRepository } from './repository/Authorization.js';
export { SequelizeBootRepository } from './repository/Boot.js';
export { SequelizeDeviceModelRepository } from './repository/DeviceModel.js';
export { SequelizeLocalAuthListRepository } from './repository/LocalAuthList.js';
export { SequelizeLocationRepository } from './repository/Location.js';
export { SequelizeTransactionEventRepository } from './repository/TransactionEvent.js';
export { SequelizeSecurityEventRepository } from './repository/SecurityEvent.js';
export { SequelizeVariableMonitoringRepository } from './repository/VariableMonitoring.js';
export { SequelizeMessageInfoRepository } from './repository/MessageInfo.js';
export { SequelizeTariffRepository } from './repository/Tariff.js';
export { SequelizeSubscriptionRepository } from './repository/Subscription.js';
export { SequelizeCertificateRepository } from './repository/Certificate.js';
export { SequelizeInstalledCertificateRepository } from './repository/InstalledCertificate.js';
export { SequelizeChargingProfileRepository } from './repository/ChargingProfile.js';
export { SequelizeOCPPMessageRepository } from './repository/OCPPMessage.js';
export { SequelizeReservationRepository } from './repository/Reservation.js';
export { SequelizeChargingStationSecurityInfoRepository } from './repository/ChargingStationSecurityInfo.js';
export { SequelizeChargingStationSequenceRepository } from './repository/ChargingStationSequence.js';
export { SequelizeChangeConfigurationRepository } from './repository/ChangeConfiguration.js';
export { SequelizeTenantRepository } from './repository/Tenant.js';
export { SequelizeAsyncJobStatusRepository } from './repository/AsyncJobStatus.js';
export { SequelizeServerNetworkProfileRepository } from './repository/ServerNetworkProfile.js';

// Sequelize Utilities
export { DefaultSequelizeInstance } from './util.js';

// Sequelize Mappers
export * as OCPP2_0_1_Mapper from './mapper/2.0.1/index.js';
export * as OCPP1_6_Mapper from './mapper/1.6/index.js';
