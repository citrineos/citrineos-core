// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Sequelize Persistence Models
export { Boot } from '../../models/Boot.js';
export {
  VariableAttribute,
  VariableCharacteristics,
  Component,
  EvseType,
  Variable,
  VariableStatus,
} from '../../models/DeviceModel/index.js';
export {
  Authorization,
  LocalListAuthorization,
  LocalListVersion,
  SendLocalList,
  LocalListVersionAuthorization,
  SendLocalListAuthorization,
} from '../../models/Authorization/index.js';
export {
  StartTransaction,
  StopTransaction,
  Transaction,
  TransactionEvent,
  MeterValue,
} from '../../models/TransactionEvent/index.js';
export { SecurityEvent } from '../../models/SecurityEvent.js';
export {
  VariableMonitoring,
  EventData,
  VariableMonitoringStatus,
} from '../../models/VariableMonitoring/index.js';
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
} from '../../models/Location/index.js';
export { ChargingStationSequence } from '../../models/ChargingStationSequence/index.js';
export { MessageInfo } from '../../models/MessageInfo/index.js';
export { Tariff } from '../../models/Tariff/index.js';
export { Subscription } from '../../models/Subscription/index.js';
export {
  Certificate,
  SignatureAlgorithmEnumType,
  CountryNameEnumType,
  InstalledCertificate,
} from '../../models/Certificate/index.js';
export {
  ChargingProfile,
  ChargingNeeds,
  ChargingSchedule,
  CompositeSchedule,
  SalesTariff,
} from '../../models/ChargingProfile/index.js';
export { OCPPMessage } from '../../models/OCPPMessage.js';
export { Reservation } from '../../models/Reservation.js';
export { ChargingStationSecurityInfo } from '../../models/ChargingStationSecurityInfo.js';
export { ChangeConfiguration } from '../../models/ChangeConfiguration.js';
export { Tenant } from '../../models/Tenant.js';
export { TenantPartner } from '../../models/TenantPartner.js';
export type { PaginatedParams } from '../../models/AsyncJob/index.js';
export { AsyncJobStatus, AsyncJobStatusDTO, AsyncJobRequest } from '../../models/AsyncJob/index.js';
export {
  DeleteCertificateAttempt,
  InstallCertificateAttempt,
} from '../../models/Certificate/index.js';

// Sequelize Repositories
export {
  SequelizeRepository,
  type SequelizeRepositoryDependencies,
} from '../../repositories/sequelize/Base.js';
export { SequelizeAuthorizationRepository } from '../../repositories/sequelize/Authorization.js';
export { SequelizeBootRepository } from '../../repositories/sequelize/Boot.js';
export { SequelizeComponentRepository } from '../../repositories/sequelize/Component.js';
export { SequelizeDeviceModelRepository } from '../../repositories/sequelize/DeviceModel.js';
export { SequelizeLocalAuthListRepository } from '../../repositories/sequelize/LocalAuthList.js';
export { SequelizeLocationRepository } from '../../repositories/sequelize/Location.js';
export { SequelizeTransactionEventRepository } from '../../repositories/sequelize/TransactionEvent.js';
export { SequelizeSecurityEventRepository } from '../../repositories/sequelize/SecurityEvent.js';
export { SequelizeVariableMonitoringRepository } from '../../repositories/sequelize/VariableMonitoring.js';
export { SequelizeMessageInfoRepository } from '../../repositories/sequelize/MessageInfo.js';
export { SequelizeTariffRepository } from '../../repositories/sequelize/Tariff.js';
export { SequelizeSubscriptionRepository } from '../../repositories/sequelize/Subscription.js';
export { SequelizeCertificateRepository } from '../../repositories/sequelize/Certificate.js';
export { SequelizeInstalledCertificateRepository } from '../../repositories/sequelize/InstalledCertificate.js';
export { SequelizeChargingProfileRepository } from '../../repositories/sequelize/ChargingProfile.js';
export { SequelizeOCPPMessageRepository } from '../../repositories/sequelize/OCPPMessage.js';
export { SequelizeReservationRepository } from '../../repositories/sequelize/Reservation.js';
export { SequelizeChargingStationSecurityInfoRepository } from '../../repositories/sequelize/ChargingStationSecurityInfo.js';
export { SequelizeChargingStationSequenceRepository } from '../../repositories/sequelize/ChargingStationSequence.js';
export { SequelizeChangeConfigurationRepository } from '../../repositories/sequelize/ChangeConfiguration.js';
export { SequelizeTenantRepository } from '../../repositories/sequelize/Tenant.js';
export { SequelizeAsyncJobStatusRepository } from '../../repositories/sequelize/AsyncJobStatus.js';
export { SequelizeChargingStationNetworkProfileRepository } from '../../repositories/sequelize/ChargingStationNetworkProfile.js';
export { SequelizeServerNetworkProfileRepository } from '../../repositories/sequelize/ServerNetworkProfile.js';
export { SequelizeSetNetworkProfileRepository } from '../../repositories/sequelize/SetNetworkProfile.js';
export { SequelizeInstallCertificateAttemptRepository } from '../../repositories/sequelize/InstallCertificateAttempt.js';
export { SequelizeDeleteCertificateAttemptRepository } from '../../repositories/sequelize/DeleteCertificateAttempt.js';

// Sequelize Utilities
export { DefaultSequelizeInstance } from './util.js';

// Sequelize Mappers
export * as OCPP2_0_1_Mapper from '../../mappers/2.0.1/index.js';
export * as OCPP1_6_Mapper from '../../mappers/1.6/index.js';
export * as OCPP2_1_Mapper from '../../mappers/2.1/index.js';
