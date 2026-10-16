// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export {
  DrizzleAsyncJobStatusRepository,
  toAsyncJobStatusDto,
} from '../../repositories/drizzle/async-job-status.js';
export {
  asyncJobStatusTable,
  tenantAsyncJobStatusTable,
  AsyncJobStatusEntitySchema,
  AsyncJobStatusEntityInsertSchema,
  type AsyncJobStatusEntity,
  type AsyncJobStatusEntityInsert,
} from './schema/async-job-status.js';
export {
  DrizzleAuthorizationRepository,
  toAuthorizationDto,
} from '../../repositories/drizzle/authorization.js';
export {
  DrizzleRepository,
  DrizzleTenantScopedRepository,
  type CitrineTable,
  type DrizzleExecutor,
  type DrizzleRepositoryDependencies,
  type DrizzleWriteContext,
  type TenantScopedTable,
} from '../../repositories/drizzle/base.js';
export { DrizzleBootRepository, toBootDto } from '../../repositories/drizzle/boot.js';
export {
  DrizzleCertificateRepository,
  toCertificateDto,
} from '../../repositories/drizzle/certificate.js';
export {
  DrizzleChangeConfigurationRepository,
  toChangeConfigurationDto,
} from '../../repositories/drizzle/change-configuration.js';
export {
  DrizzleChargingStationSecurityInfoRepository,
  toChargingStationSecurityInfoDto,
} from '../../repositories/drizzle/charging-station-security-info.js';
export {
  DrizzleChargingStationNetworkProfileRepository,
  toChargingStationNetworkProfileDto,
  toChargingStationNetworkProfileRow,
  type ChargingStationNetworkProfileRow,
} from '../../repositories/drizzle/charging-station-network-profile.js';
export {
  chargingStationNetworkProfileTable,
  tenantChargingStationNetworkProfileTable,
  ChargingStationNetworkProfileEntitySchema,
  ChargingStationNetworkProfileEntityInsertSchema,
  type ChargingStationNetworkProfileEntity,
  type ChargingStationNetworkProfileEntityInsert,
} from './schema/charging-station-network-profile.js';
export {
  DrizzleChargingStationSequenceRepository,
  toChargingStationSequenceDto,
} from '../../repositories/drizzle/charging-station-sequence.js';
export {
  DrizzleChargingStationRepository,
  toChargingStationDto,
} from '../../repositories/drizzle/charging-station.js';
export {
  DrizzleComponentRepository,
  toComponentDto,
} from '../../repositories/drizzle/component.js';
export {
  DrizzleConnectorRepository,
  toConnectorDto,
} from '../../repositories/drizzle/connector.js';
export {
  DrizzleDeleteCertificateAttemptRepository,
  toDeleteCertificateAttemptDto,
} from '../../repositories/drizzle/delete-certificate-attempt.js';
export { DrizzleEvseRepository, toEvseDto } from '../../repositories/drizzle/evse.js';
export {
  DrizzleInstallCertificateAttemptRepository,
  toInstallCertificateAttemptDto,
} from '../../repositories/drizzle/install-certificate-attempt.js';
export {
  DrizzleInstalledCertificateRepository,
  toInstalledCertificateDto,
} from '../../repositories/drizzle/installed-certificate.js';
export { DrizzleLocationRepository, toLocationDto } from '../../repositories/drizzle/location.js';
export {
  DrizzleMeterValueRepository,
  toMeterValueDto,
} from '../../repositories/drizzle/meter-value.js';
export {
  meterValueTable,
  tenantMeterValueTable,
  MeterValueEntitySchema,
  MeterValueEntityInsertSchema,
  type MeterValueEntity,
  type MeterValueEntityInsert,
} from './schema/meter-value.js';
export {
  DrizzleMessageInfoRepository,
  toMessageInfoDto,
} from '../../repositories/drizzle/message-info.js';
export {
  DrizzleNetworkAlertConfigRepository,
  toNetworkAlertConfigDto,
} from '../../repositories/drizzle/network-alert-config.js';
export {
  DrizzleNetworkAlertRepository,
  toNetworkAlertDto,
  toNetworkAlertOccurrenceDto,
} from '../../repositories/drizzle/network-alert.js';
export {
  DrizzleReservationRepository,
  toReservationDto,
} from '../../repositories/drizzle/reservation.js';
export {
  DrizzleSecurityEventRepository,
  toSecurityEventDto,
} from '../../repositories/drizzle/security-event.js';
export {
  DrizzleServerNetworkProfileRepository,
  toServerNetworkProfileDto,
} from '../../repositories/drizzle/server-network-profile.js';
export {
  DrizzleSetNetworkProfileRepository,
  toSetNetworkProfileDto,
} from '../../repositories/drizzle/set-network-profile.js';
export {
  DrizzleStatusNotificationRepository,
  toStatusNotificationDto,
} from '../../repositories/drizzle/status-notification.js';
export {
  DrizzleSubscriptionRepository,
  toSubscriptionDto,
} from '../../repositories/drizzle/subscription.js';
export { DrizzleTariffRepository, toTariffDto } from '../../repositories/drizzle/tariff.js';
export { DrizzleTenantRepository, toTenantDto } from '../../repositories/drizzle/tenant.js';
export {
  DrizzleTransactionRepository,
  toTransactionDto,
} from '../../repositories/drizzle/transaction.js';
export {
  DrizzleTransactionEventRepository,
  toTransactionEventDto,
} from '../../repositories/drizzle/transaction-event.js';
export {
  DrizzleVariableAttributeRepository,
  toVariableAttributeDto,
} from '../../repositories/drizzle/variable-attribute.js';
export {
  DrizzleVariableCharacteristicsRepository,
  toVariableCharacteristicsDto,
} from '../../repositories/drizzle/variable-characteristics.js';
export {
  DrizzleWebsocketEventRepository,
  toWebsocketEventDto,
} from '../../repositories/drizzle/websocket-event.js';
export { registeredTableNames, registeredTables, type RegisteredTable } from './schema-registry.js';
export {
  AuthorizationEntityInsertSchema,
  AuthorizationEntitySchema,
  authorizationTable,
  tenantAuthorizationTable,
  type AuthorizationEntity,
  type AuthorizationEntityInsert,
} from './schema/authorization.js';
export {
  BootEntityInsertSchema,
  BootEntitySchema,
  bootTable,
  tenantBootTable,
  type BootEntity,
  type BootEntityInsert,
} from './schema/boot.js';
export {
  CertificateEntityInsertSchema,
  CertificateEntitySchema,
  certificateTable,
  tenantCertificateTable,
  type CertificateEntity,
  type CertificateEntityInsert,
} from './schema/certificate.js';
export {
  ChangeConfigurationEntityInsertSchema,
  ChangeConfigurationEntitySchema,
  changeConfigurationTable,
  tenantChangeConfigurationTable,
  type ChangeConfigurationEntity,
  type ChangeConfigurationEntityInsert,
} from './schema/change-configuration.js';
export {
  ChargingStationSecurityInfoEntityInsertSchema,
  ChargingStationSecurityInfoEntitySchema,
  chargingStationSecurityInfoTable,
  tenantChargingStationSecurityInfoTable,
  type ChargingStationSecurityInfoEntity,
  type ChargingStationSecurityInfoEntityInsert,
} from './schema/charging-station-security-info.js';
export {
  ChargingStationSequenceEntityInsertSchema,
  ChargingStationSequenceEntitySchema,
  chargingStationSequenceTable,
  tenantChargingStationSequenceTable,
  type ChargingStationSequenceEntity,
  type ChargingStationSequenceEntityInsert,
} from './schema/charging-station-sequence.js';
export {
  ChargingStationEntityInsertSchema,
  ChargingStationEntitySchema,
  chargingStationTable,
  tenantChargingStationTable,
  type ChargingStationEntity,
  type ChargingStationEntityInsert,
} from './schema/charging-station.js';
export { citext } from './schema/column-types.js';
export {
  ConnectorEntityInsertSchema,
  ConnectorEntitySchema,
  connectorTable,
  tenantConnectorTable,
  type ConnectorEntity,
  type ConnectorEntityInsert,
} from './schema/connector.js';
export {
  DeleteCertificateAttemptEntityInsertSchema,
  DeleteCertificateAttemptEntitySchema,
  deleteCertificateAttemptTable,
  tenantDeleteCertificateAttemptTable,
  type DeleteCertificateAttemptEntity,
  type DeleteCertificateAttemptEntityInsert,
} from './schema/delete-certificate-attempt.js';
export {
  EvseEntityInsertSchema,
  EvseEntitySchema,
  evseTable,
  tenantEvseTable,
  type EvseEntity,
  type EvseEntityInsert,
} from './schema/evse.js';
export * as drizzleSchema from './schema/index.js';
export {
  InstallCertificateAttemptEntityInsertSchema,
  InstallCertificateAttemptEntitySchema,
  installCertificateAttemptTable,
  tenantInstallCertificateAttemptTable,
  type InstallCertificateAttemptEntity,
  type InstallCertificateAttemptEntityInsert,
} from './schema/install-certificate-attempt.js';
export {
  InstalledCertificateEntityInsertSchema,
  InstalledCertificateEntitySchema,
  installedCertificateTable,
  tenantInstalledCertificateTable,
  type InstalledCertificateEntity,
  type InstalledCertificateEntityInsert,
} from './schema/installed-certificate.js';
export {
  LocationEntityInsertSchema,
  LocationEntitySchema,
  locationTable,
  tenantLocationTable,
  type LocationEntity,
  type LocationEntityInsert,
} from './schema/location.js';
export {
  MessageInfoEntityInsertSchema,
  MessageInfoEntitySchema,
  messageInfoTable,
  tenantMessageInfoTable,
  type MessageInfoEntity,
  type MessageInfoEntityInsert,
} from './schema/message-info.js';
export {
  ReservationEntityInsertSchema,
  ReservationEntitySchema,
  reservationTable,
  tenantReservationTable,
  type ReservationEntity,
  type ReservationEntityInsert,
} from './schema/reservation.js';
export {
  SecurityEventEntityInsertSchema,
  SecurityEventEntitySchema,
  securityEventTable,
  tenantSecurityEventTable,
  type SecurityEventEntity,
  type SecurityEventEntityInsert,
} from './schema/security-event.js';
export {
  ServerNetworkProfileEntityInsertSchema,
  ServerNetworkProfileEntitySchema,
  serverNetworkProfileTable,
  tenantServerNetworkProfileTable,
  type ServerNetworkProfileEntity,
  type ServerNetworkProfileEntityInsert,
} from './schema/server-network-profile.js';
export {
  SetNetworkProfileEntityInsertSchema,
  SetNetworkProfileEntitySchema,
  setNetworkProfileTable,
  tenantSetNetworkProfileTable,
  type SetNetworkProfileEntity,
  type SetNetworkProfileEntityInsert,
} from './schema/set-network-profile.js';
export {
  StatusNotificationEntityInsertSchema,
  StatusNotificationEntitySchema,
  statusNotificationTable,
  tenantStatusNotificationTable,
  type StatusNotificationEntity,
  type StatusNotificationEntityInsert,
} from './schema/status-notification.js';
export {
  SubscriptionEntityInsertSchema,
  SubscriptionEntitySchema,
  subscriptionTable,
  tenantSubscriptionTable,
  type SubscriptionEntity,
  type SubscriptionEntityInsert,
} from './schema/subscription.js';
export {
  TariffEntityInsertSchema,
  TariffEntitySchema,
  tariffTable,
  tenantTariffTable,
  type TariffEntity,
  type TariffEntityInsert,
} from './schema/tariff.js';
export {
  TenantEntityInsertSchema,
  TenantEntitySchema,
  tenantTable,
  tenantTenantTable,
  type TenantEntity,
  type TenantEntityInsert,
} from './schema/tenant.js';
export {
  tenantVariableAttributeTable,
  VariableAttributeEntityInsertSchema,
  VariableAttributeEntitySchema,
  variableAttributeTable,
  type VariableAttributeEntity,
  type VariableAttributeEntityInsert,
} from './schema/variable-attribute.js';
export {
  tenantVariableCharacteristicsTable,
  VariableCharacteristicsEntityInsertSchema,
  VariableCharacteristicsEntitySchema,
  variableCharacteristicsTable,
  type VariableCharacteristicsEntity,
  type VariableCharacteristicsEntityInsert,
} from './schema/variable-characteristics.js';
export {
  WebsocketEventEntityInsertSchema,
  WebsocketEventEntitySchema,
  websocketEventTable,
  type WebsocketEventEntity,
  type WebsocketEventEntityInsert,
} from './schema/websocket-event.js';
export { DefaultDrizzleInstance } from './util.js';
