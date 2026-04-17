// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Core module exports
import { Transaction as SequelizeTransaction } from 'sequelize';

export { SequelizeTransaction };

// Sequelize Persistence Models
export { Boot } from '@dal/layers/sequelize/model/Boot.js';
export { BootTable } from '@dal/layers/sequelize/model/BootTable.js';
export { Component } from '@dal/layers/sequelize/model/DeviceModel/Component.js';
export { ComponentVariable } from '@dal/layers/sequelize/model/DeviceModel/ComponentVariable.js';
export { EvseType } from '@dal/layers/sequelize/model/DeviceModel/EvseType.js';
export { Variable } from '@dal/layers/sequelize/model/DeviceModel/Variable.js';
export { VariableAttribute } from '@dal/layers/sequelize/model/DeviceModel/VariableAttribute.js';
export { VariableAttributeTable } from '@dal/layers/sequelize/model/DeviceModel/VariableAttributeTable.js';
export { VariableCharacteristics } from '@dal/layers/sequelize/model/DeviceModel/VariableCharacteristics.js';
export { VariableStatus } from '@dal/layers/sequelize/model/DeviceModel/VariableStatus.js';
export { Authorization } from '@dal/layers/sequelize/model/Authorization/Authorization.js';
export { LocalListVersion } from '@dal/layers/sequelize/model/Authorization/LocalListVersion.js';
export { SendLocalList } from '@dal/layers/sequelize/model/Authorization/SendLocalList.js';
export { LocalListAuthorization } from '@dal/layers/sequelize/model/Authorization/LocalListAuthorization.js';
export { LocalListVersionAuthorization } from '@dal/layers/sequelize/model/Authorization/LocalListVersionAuthorization.js';
export { SendLocalListAuthorization } from '@dal/layers/sequelize/model/Authorization/SendLocalListAuthorization.js';

export { TransactionEvent } from '@dal/layers/sequelize/model/TransactionEvent/TransactionEvent.js';
export { Transaction } from '@dal/layers/sequelize/model/TransactionEvent/Transaction.js';
export { MeterValue } from '@dal/layers/sequelize/model/TransactionEvent/MeterValue.js';
export { StartTransaction } from '@dal/layers/sequelize/model/TransactionEvent/StartTransaction.js';
export { StopTransaction } from '@dal/layers/sequelize/model/TransactionEvent/StopTransaction.js';

export { SecurityEvent } from '@dal/layers/sequelize/model/SecurityEvent.js';
export { EventData } from '@dal/layers/sequelize/model/VariableMonitoring/EventData.js';
export { VariableMonitoring } from '@dal/layers/sequelize/model/VariableMonitoring/VariableMonitoring.js';
export { VariableMonitoringStatus } from '@dal/layers/sequelize/model/VariableMonitoring/VariableMonitoringStatus.js';

export { Location } from '@dal/layers/sequelize/model/Location/Location.js';
export { ChargingStation } from '@dal/layers/sequelize/model/Location/ChargingStation.js';
export { Evse } from '@dal/layers/sequelize/model/Location/Evse.js';
export { ChargingStationNetworkProfile } from '@dal/layers/sequelize/model/Location/ChargingStationNetworkProfile.js';
export { LatestStatusNotification } from '@dal/layers/sequelize/model/Location/LatestStatusNotification.js';
export { StatusNotification } from '@dal/layers/sequelize/model/Location/StatusNotification.js';
export { ServerNetworkProfile } from '@dal/layers/sequelize/model/Location/ServerNetworkProfile.js';
export { SetNetworkProfile } from '@dal/layers/sequelize/model/Location/SetNetworkProfile.js';
export { Connector } from '@dal/layers/sequelize/model/Location/Connector.js';

export { ChargingStationSequence } from '@dal/layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.js';
export { MessageInfo } from '@dal/layers/sequelize/model/MessageInfo/MessageInfo.js';
export { Tariff } from '@dal/layers/sequelize/model/Tariff/Tariffs.js';
export { Subscription } from '@dal/layers/sequelize/model/Subscription/Subscription.js';
export { Certificate } from '@dal/layers/sequelize/model/Certificate/Certificate.js';
export { InstalledCertificate } from '@dal/layers/sequelize/model/Certificate/InstalledCertificate.js';
export { InstallCertificateAttempt } from '@dal/layers/sequelize/model/Certificate/InstallCertificateAttempt.js';
export { DeleteCertificateAttempt } from '@dal/layers/sequelize/model/Certificate/DeleteCertificateAttempt.js';
export {
  SignatureAlgorithmEnumType,
  CountryNameEnumType,
} from '@dal/layers/sequelize/model/Certificate/CertificateTypes.js';
export { ChargingProfile } from '@dal/layers/sequelize/model/ChargingProfile/ChargingProfile.js';
export { ChargingNeeds } from '@dal/layers/sequelize/model/ChargingProfile/ChargingNeeds.js';
export { ChargingSchedule } from '@dal/layers/sequelize/model/ChargingProfile/ChargingSchedule.js';
export { SalesTariff } from '@dal/layers/sequelize/model/ChargingProfile/SalesTariff.js';
export { CompositeSchedule } from '@dal/layers/sequelize/model/ChargingProfile/CompositeSchedule.js';
export { OCPPMessage } from '@dal/layers/sequelize/model/OCPPMessage.js';
export { Reservation } from '@dal/layers/sequelize/model/Reservation.js';
export { ChargingStationSecurityInfo } from '@dal/layers/sequelize/model/ChargingStationSecurityInfo.js';
export { ChangeConfiguration } from '@dal/layers/sequelize/model/ChangeConfiguration.js';
export { Tenant } from '@dal/layers/sequelize/model/Tenant.js';
export { TenantPartner } from '@dal/layers/sequelize/model/TenantPartner.js';
export { BaseModelWithTenant } from '@dal/layers/sequelize/model/BaseModelWithTenant.js';
export {
  AsyncJobStatus,
  AsyncJobStatusDTO,
  AsyncJobRequest,
} from '@dal/layers/sequelize/model/AsyncJob/AsyncJobStatus.js';
export type { PaginatedParams } from '@dal/layers/sequelize/model/AsyncJob/AsyncJobStatus.js';

// Sequelize Repositories
export { SequelizeRepository } from '@dal/layers/sequelize/repository/Base.js';
export { SequelizeAuthorizationRepository } from '@dal/layers/sequelize/repository/Authorization.js';
export { SequelizeBootRepository } from '@dal/layers/sequelize/repository/Boot.js';
export { SequelizeDeviceModelRepository } from '@dal/layers/sequelize/repository/DeviceModel.js';
export { SequelizeLocalAuthListRepository } from '@dal/layers/sequelize/repository/LocalAuthList.js';
export { SequelizeLocationRepository } from '@dal/layers/sequelize/repository/Location.js';
export { SequelizeTransactionEventRepository } from '@dal/layers/sequelize/repository/TransactionEvent.js';
export { SequelizeSecurityEventRepository } from '@dal/layers/sequelize/repository/SecurityEvent.js';
export { SequelizeVariableMonitoringRepository } from '@dal/layers/sequelize/repository/VariableMonitoring.js';
export { SequelizeMessageInfoRepository } from '@dal/layers/sequelize/repository/MessageInfo.js';
export { SequelizeTariffRepository } from '@dal/layers/sequelize/repository/Tariff.js';
export { SequelizeSubscriptionRepository } from '@dal/layers/sequelize/repository/Subscription.js';
export { SequelizeCertificateRepository } from '@dal/layers/sequelize/repository/Certificate.js';
export { SequelizeInstalledCertificateRepository } from '@dal/layers/sequelize/repository/InstalledCertificate.js';
export { SequelizeChargingProfileRepository } from '@dal/layers/sequelize/repository/ChargingProfile.js';
export { SequelizeOCPPMessageRepository } from '@dal/layers/sequelize/repository/OCPPMessage.js';
export { SequelizeReservationRepository } from '@dal/layers/sequelize/repository/Reservation.js';
export { SequelizeChargingStationSecurityInfoRepository } from '@dal/layers/sequelize/repository/ChargingStationSecurityInfo.js';
export { SequelizeChargingStationSequenceRepository } from '@dal/layers/sequelize/repository/ChargingStationSequence.js';
export { SequelizeChangeConfigurationRepository } from '@dal/layers/sequelize/repository/ChangeConfiguration.js';
export { SequelizeTenantRepository } from '@dal/layers/sequelize/repository/Tenant.js';
export { SequelizeAsyncJobStatusRepository } from '@dal/layers/sequelize/repository/AsyncJobStatus.js';
export { SequelizeServerNetworkProfileRepository } from '@dal/layers/sequelize/repository/ServerNetworkProfile.js';
export { SequelizeInstallCertificateAttemptRepository } from '@dal/layers/sequelize/repository/InstallCertificateAttempt.js';
export { SequelizeDeleteCertificateAttemptRepository } from '@dal/layers/sequelize/repository/DeleteCertificateAttempt.js';

// Sequelize Utilities
export { DefaultSequelizeInstance } from '@dal/layers/sequelize/util.js';

// Sequelize Mappers
export * as OCPP2_0_1_Mapper from '@dal/layers/sequelize/mapper/2.0.1/index.js';
export * as OCPP1_6_Mapper from '@dal/layers/sequelize/mapper/1.6/index.js';

export * from '@dal/interfaces/index.js';
export * from 'sequelize-typescript';

export { RepositoryStore } from '@dal/layers/sequelize/repository/RepositoryStore.js';
export { CryptoUtils } from '@dal/util/CryptoUtils.js';

export { UnknownStationFilter } from '@util/networkconnection/authenticator/UnknownStationFilter.js';
export { ConnectedStationFilter } from '@util/networkconnection/authenticator/ConnectedStationFilter.js';
export { NetworkProfileFilter } from '@util/networkconnection/authenticator/NetworkProfileFilter.js';
export { BasicAuthenticationFilter } from '@util/networkconnection/authenticator/BasicAuthenticationFilter.js';

export * from '@util/authorization/index.js';
export * from '@util/authorizer/index.js';
export { MemoryCache } from '@util/cache/memory.js';
export { RedisCache } from '@util/cache/redis.js';
export { S3Storage } from '@util/files/s3Storage.js';
export { GcpCloudStorage } from '@util/files/gcpCloudStorage.js';
export { FtpServer } from '@util/files/ftpServer.js';
export { LocalStorage } from '@util/files/localStorage.js';
export * from '@util/queue/index.js';
export * from '@util/networkconnection/index.js';
export * from '@util/certificate/index.js';

export { initSwagger } from '@util/util/swagger.js';
export { getSizeOfRequest, getBatches, stringToSet } from '@util/util/parser.js';
export {
  validateLanguageTag,
  validateChargingProfileType,
  validateIdToken,
  validateISO15693IdToken,
  validateISO14443IdToken,
  validateIdentifierStringIdToken,
  validateNoAuthorizationIdToken,
  type ValidationResult,
  validateASCIIContent,
  validateHTMLContent,
  validateURIContent,
  validateUTF8Content,
  validateMessageContent,
  validateMessageContentType,
  validatePEMEncodedCSR,
} from '@util/util/validator.js';
export { IdGenerator } from '@util/util/idGenerator.js';
export { isValidPassword, generatePassword } from '@util/security/authentication.js';
export { packageGroupCall } from '@util/util/sendCall.js';
export { SignedMeterValuesUtil } from '@util/security/SignedMeterValuesUtil.js';

// Module exports
export * from '@modules/Certificates/src/index.js';
export * from '@modules/Configuration/src/index.js';
export * from '@modules/EVDriver/src/index.js';
export * from '@modules/Monitoring/src/index.js';
export * from '@modules/OcppRouter/src/index.js';
export * from '@modules/Reporting/src/index.js';
export * from '@modules/SmartCharging/src/index.js';
export * from '@modules/Tenant/src/index.js';
export * from '@modules/Transactions/src/index.js';
