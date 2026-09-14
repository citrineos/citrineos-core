// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Sequelize Persistence Models
export { Boot } from '../../models/boot.js';
export {
  VariableAttribute,
  VariableCharacteristics,
  Component,
  EvseType,
  Variable,
  VariableStatus,
} from '../../models/device-model/index.js';
export {
  Authorization,
  LocalListAuthorization,
  LocalListVersion,
  SendLocalList,
  LocalListVersionAuthorization,
  SendLocalListAuthorization,
} from '../../models/authorization/index.js';
export {
  StartTransaction,
  StopTransaction,
  Transaction,
  TransactionEvent,
  MeterValue,
} from '../../models/transaction-event/index.js';
export { SecurityEvent } from '../../models/security-event.js';
export {
  VariableMonitoring,
  EventData,
  VariableMonitoringStatus,
} from '../../models/variable-monitoring/index.js';
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
} from '../../models/location/index.js';
export { ChargingStationSequence } from '../../models/charging-station-sequence/index.js';
export { MessageInfo } from '../../models/message-info/index.js';
export { Tariff } from '../../models/tariff/index.js';
export { Subscription } from '../../models/subscription/index.js';
export {
  Certificate,
  SignatureAlgorithmEnumType,
  CountryNameEnumType,
  InstalledCertificate,
} from '../../models/certificate/index.js';
export {
  ChargingProfile,
  ChargingNeeds,
  ChargingSchedule,
  CompositeSchedule,
  SalesTariff,
} from '../../models/charging-profile/index.js';
export { OCPPMessage } from '../../models/ocpp-message.js';
export { Reservation } from '../../models/reservation.js';
export { ChargingStationSecurityInfo } from '../../models/charging-station-security-info.js';
export { ChangeConfiguration } from '../../models/change-configuration.js';
export { Tenant } from '../../models/tenant.js';
export { TenantPartner } from '../../models/tenant-partner.js';
export type { PaginatedParams } from '../../models/async-job/index.js';
export {
  AsyncJobStatus,
  AsyncJobStatusDTO,
  AsyncJobRequest,
} from '../../models/async-job/index.js';
export {
  DeleteCertificateAttempt,
  InstallCertificateAttempt,
} from '../../models/certificate/index.js';

// Sequelize Repositories
export {
  SequelizeRepository,
  type SequelizeRepositoryDependencies,
} from '../../repositories/sequelize/base.js';
export { SequelizeAuthorizationRepository } from '../../repositories/sequelize/authorization.js';
export { SequelizeBootRepository } from '../../repositories/sequelize/boot.js';
export { SequelizeComponentRepository } from '../../repositories/sequelize/component.js';
export { SequelizeDeviceModelRepository } from '../../repositories/sequelize/device-model.js';
export { SequelizeLocalAuthListRepository } from '../../repositories/sequelize/local-auth-list.js';
export { SequelizeLocationRepository } from '../../repositories/sequelize/location.js';
export { SequelizeTransactionEventRepository } from '../../repositories/sequelize/transaction-event.js';
export { SequelizeSecurityEventRepository } from '../../repositories/sequelize/security-event.js';
export { SequelizeVariableMonitoringRepository } from '../../repositories/sequelize/variable-monitoring.js';
export { SequelizeMessageInfoRepository } from '../../repositories/sequelize/message-info.js';
export { SequelizeTariffRepository } from '../../repositories/sequelize/tariff.js';
export { SequelizeSubscriptionRepository } from '../../repositories/sequelize/subscription.js';
export { SequelizeCertificateRepository } from '../../repositories/sequelize/certificate.js';
export { SequelizeInstalledCertificateRepository } from '../../repositories/sequelize/installed-certificate.js';
export { SequelizeChargingProfileRepository } from '../../repositories/sequelize/charging-profile.js';
export { SequelizeOCPPMessageRepository } from '../../repositories/sequelize/ocpp-message.js';
export { SequelizeReservationRepository } from '../../repositories/sequelize/reservation.js';
export { SequelizeChargingStationSecurityInfoRepository } from '../../repositories/sequelize/charging-station-security-info.js';
export { SequelizeChargingStationSequenceRepository } from '../../repositories/sequelize/charging-station-sequence.js';
export { SequelizeChangeConfigurationRepository } from '../../repositories/sequelize/change-configuration.js';
export { SequelizeTenantRepository } from '../../repositories/sequelize/tenant.js';
export { SequelizeAsyncJobStatusRepository } from '../../repositories/sequelize/async-job-status.js';
export { SequelizeChargingStationNetworkProfileRepository } from '../../repositories/sequelize/charging-station-network-profile.js';
export { SequelizeServerNetworkProfileRepository } from '../../repositories/sequelize/server-network-profile.js';
export { SequelizeSetNetworkProfileRepository } from '../../repositories/sequelize/set-network-profile.js';
export { SequelizeInstallCertificateAttemptRepository } from '../../repositories/sequelize/install-certificate-attempt.js';
export { SequelizeDeleteCertificateAttemptRepository } from '../../repositories/sequelize/delete-certificate-attempt.js';

// Sequelize Utilities
export { DefaultSequelizeInstance } from './util.js';

// Sequelize Mappers
export * as OCPP2_0_1_Mapper from '../../mappers/2.0.1/index.js';
export * as OCPP1_6_Mapper from '../../mappers/1.6/index.js';
export * as OCPP2_1_Mapper from '../../mappers/2.1/index.js';
