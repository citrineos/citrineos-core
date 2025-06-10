// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

// Sequelize Persistence Models
export { Boot } from './model/Boot';
export {
  VariableAttribute,
  VariableCharacteristics,
  Component,
  Evse,
  Variable,
  VariableStatus,
} from './model/DeviceModel';
export {
  Authorization,
  IdToken,
  IdTokenInfo,
  AdditionalInfo,
  LocalListAuthorization,
  LocalListVersion,
  SendLocalList,
  LocalListVersionAuthorization,
  SendLocalListAuthorization,
} from './model/Authorization';
export {
  StartTransaction,
  StopTransaction,
  Transaction,
  TransactionEvent,
  MeterValue,
} from './model/TransactionEvent';
export { SecurityEvent } from './model/SecurityEvent';
export {
  VariableMonitoring,
  EventData,
  VariableMonitoringStatus,
} from './model/VariableMonitoring';
export {
  ChargingStation,
  ChargingStationNetworkProfile,
  Location,
  ServerNetworkProfile,
  SetNetworkProfile,
  StatusNotification,
  Connector,
} from './model/Location';
export { ChargingStationSequence } from './model/ChargingStationSequence';
export { MessageInfo } from './model/MessageInfo';
export { Tariff } from './model/Tariff';
export { Subscription } from './model/Subscription';
export {
  Certificate,
  SignatureAlgorithmEnumType,
  CountryNameEnumType,
  InstalledCertificate,
} from './model/Certificate';
export {
  ChargingProfile,
  ChargingNeeds,
  ChargingSchedule,
  CompositeSchedule,
  SalesTariff,
} from './model/ChargingProfile';
export { OCPPMessage } from './model/OCPPMessage';
export { Reservation } from './model/Reservation';
export { ChargingStationSecurityInfo } from './model/ChargingStationSecurityInfo';
export { ChangeConfiguration } from './model/ChangeConfiguration';
export { Tenant } from './model/Tenant';

// Sequelize Repositories
export { SequelizeRepository } from './repository/Base';
export { SequelizeAuthorizationRepository } from './repository/Authorization';
export { SequelizeBootRepository } from './repository/Boot';
export { SequelizeDeviceModelRepository } from './repository/DeviceModel';
export { SequelizeLocalAuthListRepository } from './repository/LocalAuthList';
export { SequelizeLocationRepository } from './repository/Location';
export { SequelizeTransactionEventRepository } from './repository/TransactionEvent';
export { SequelizeSecurityEventRepository } from './repository/SecurityEvent';
export { SequelizeVariableMonitoringRepository } from './repository/VariableMonitoring';
export { SequelizeMessageInfoRepository } from './repository/MessageInfo';
export { SequelizeTariffRepository } from './repository/Tariff';
export { SequelizeSubscriptionRepository } from './repository/Subscription';
export { SequelizeCertificateRepository } from './repository/Certificate';
export { SequelizeInstalledCertificateRepository } from './repository/InstalledCertificate';
export { SequelizeChargingProfileRepository } from './repository/ChargingProfile';
export { SequelizeOCPPMessageRepository } from './repository/OCPPMessage';
export { SequelizeReservationRepository } from './repository/Reservation';
export { SequelizeChargingStationSecurityInfoRepository } from './repository/ChargingStationSecurityInfo';
export { SequelizeChargingStationSequenceRepository } from './repository/ChargingStationSequence';
export { SequelizeChangeConfigurationRepository } from './repository/ChangeConfiguration';
export { SequelizeTenantRepository } from './repository/Tenant';

// Sequelize Utilities
export { DefaultSequelizeInstance } from './util';

// Sequelize Mappers
export * as OCPP2_0_1_Mapper from './mapper/2.0.1';
export * as OCPP1_6_Mapper from './mapper/1.6';
