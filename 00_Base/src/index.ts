// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Base Library Interfaces
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { OCPP1_6, OCPP2_1 } from './ocpp/model/index.js';
import { OCPP_CallAction } from './ocpp/rpc/message.js';

export { BadRequestError } from './interfaces/api/exceptions/BadRequestError.js';
export { NotFoundError } from './interfaces/api/exceptions/NotFoundError.js';
export {
  AbstractModuleApi,
  ApiAuthenticationResult,
  ApiAuthorizationResult,
  AsDataEndpoint,
  AsMessageEndpoint,
  HttpMethod,
} from './interfaces/api/index.js';
export type { IApiAuthProvider, IModuleApi, UserInfo } from './interfaces/api/index.js';
export type { IAuthorizer } from './interfaces/authorizer/index.js';
export type { ICache } from './interfaces/cache/cache.js';
export {
  CacheNamespace,
  createIdentifier,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
} from './interfaces/cache/types.js';
export type { IWebsocketConnection } from './interfaces/cache/types.js';
export type { IFileAccess, IFileStorage } from './interfaces/files/index.js';
export {
  AbstractMessageHandler,
  AbstractMessageSender,
  EventGroup,
  eventGroupFromString,
  Message,
  MessageOrigin,
  MessageState,
  RetryMessageError,
} from './interfaces/messages/index.js';
export type {
  HandlerProperties,
  IMessage,
  IMessageConfirmation,
  IMessageContext,
  IMessageHandler,
  IMessageSender,
} from './interfaces/messages/index.js';
export {
  AbstractModule,
  AsHandler,
  CircuitBreaker,
  type CircuitBreakerOptions,
  type CircuitBreakerState,
} from './interfaces/modules/index.js';
export type { IModule } from './interfaces/modules/index.js';
export { AbstractMessageRouter, type INetworkConnection } from './interfaces/router/index.js';
export type {
  AuthenticationOptions,
  IAuthenticator,
  IMessageRouter,
} from './interfaces/router/index.js';
export {
  ErrorCode,
  mapToCallAction,
  MessageTypeId,
  OCPP_CallAction,
  OcppError,
  OCPPVersion,
  OCPP_VERSION_LIST,
  OCPP_2_VER_LIST,
} from './ocpp/rpc/message.js';
export type {
  Call,
  CallAction,
  CallError,
  CallResult,
  OCPPVersionType,
} from './ocpp/rpc/message.js';

// Persistence Interfaces

export { CrudRepository } from './interfaces/repository.js';
export type { CrudEvent } from './interfaces/repository.js';
export { TenantContextManager } from './interfaces/tenant.js';
export * from './ocpp/persistence/index.js';

// Configuration Types

export { BOOT_STATUS } from './config/BootConfig.js';
export type { BootConfig } from './config/BootConfig.js';
export { loadBootstrapConfig } from './config/bootstrap.config.js';
export type { BootstrapConfig } from './config/bootstrap.config.js';
export { ConfigStoreFactory } from './config/ConfigStore.js';
export type { ConfigStore } from './config/ConfigStore.js';
export { DEFAULT_TENANT_ID, defineConfig } from './config/defineConfig.js';
export { SignedMeterValuesConfig } from './config/signedMeterValuesConfig.js';
export {
  RbacRulesSchema,
  systemConfigSchema,
  HUBJECT_DEFAULT_BASEURL,
  HUBJECT_DEFAULT_TOKENURL,
  HUBJECT_DEFAULT_CLIENTID,
  HUBJECT_DEFAULT_CLIENTSECRET,
  HUBJECT_DEFAULT_AUTH_TOKEN,
} from './config/types.js';
export type { RbacRules, SystemConfig, WebsocketServerConfig } from './config/types.js';

// Utils

export { MeterValueUtils } from './util/MeterValueUtils.js';
export { RequestBuilder } from './util/request.js';

export const LOG_LEVEL_OCPP = 10;

// OCPP 2.0.1 Interfaces

export * from './ocpp/model/index.js';

export type { UpdateChargingStationPasswordRequest } from './ocpp/model/UpdateChargingStationPasswordRequest.js';

export interface OcppRequest {}

export interface OcppResponse {}

export const OCPP1_6_CALL_SCHEMA_RECORD: Record<string, object> = {
  [OCPP_CallAction.Authorize]: OCPP1_6.AuthorizeRequestSchema,
  [OCPP_CallAction.BootNotification]: OCPP1_6.BootNotificationRequestSchema,
  [OCPP_CallAction.DataTransfer]: OCPP1_6.DataTransferRequestSchema,
  [OCPP_CallAction.DiagnosticsStatusNotification]:
    OCPP1_6.DiagnosticsStatusNotificationRequestSchema,
  [OCPP_CallAction.FirmwareStatusNotification]: OCPP1_6.FirmwareStatusNotificationRequestSchema,
  [OCPP_CallAction.Heartbeat]: OCPP1_6.HeartbeatRequestSchema,
  [OCPP_CallAction.MeterValues]: OCPP1_6.MeterValuesRequestSchema,
  [OCPP_CallAction.StartTransaction]: OCPP1_6.StartTransactionRequestSchema,
  [OCPP_CallAction.StatusNotification]: OCPP1_6.StatusNotificationRequestSchema,
  [OCPP_CallAction.StopTransaction]: OCPP1_6.StopTransactionRequestSchema,
};

// Action requests supported by OCPP 2.0.1
export const OCPP2_0_1_CALL_SCHEMA_RECORD: Record<string, object> = {
  [OCPP_CallAction.Authorize]: OCPP2_1.AuthorizeRequestSchema,
  [OCPP_CallAction.BootNotification]: OCPP2_1.BootNotificationRequestSchema,
  [OCPP_CallAction.ClearedChargingLimit]: OCPP2_1.ClearedChargingLimitRequestSchema,
  [OCPP_CallAction.DataTransfer]: OCPP2_1.DataTransferRequestSchema,
  [OCPP_CallAction.FirmwareStatusNotification]: OCPP2_1.FirmwareStatusNotificationRequestSchema,
  [OCPP_CallAction.Get15118EVCertificate]: OCPP2_1.Get15118EVCertificateRequestSchema,
  [OCPP_CallAction.GetCertificateStatus]: OCPP2_1.GetCertificateStatusRequestSchema,
  [OCPP_CallAction.Heartbeat]: OCPP2_1.HeartbeatRequestSchema,
  [OCPP_CallAction.LogStatusNotification]: OCPP2_1.LogStatusNotificationRequestSchema,
  [OCPP_CallAction.MeterValues]: OCPP2_1.MeterValuesRequestSchema,
  [OCPP_CallAction.NotifyChargingLimit]: OCPP2_1.NotifyChargingLimitRequestSchema,
  [OCPP_CallAction.NotifyCustomerInformation]: OCPP2_1.NotifyCustomerInformationRequestSchema,
  [OCPP_CallAction.NotifyDisplayMessages]: OCPP2_1.NotifyDisplayMessagesRequestSchema,
  [OCPP_CallAction.NotifyEVChargingNeeds]: OCPP2_1.NotifyEVChargingNeedsRequestSchema,
  [OCPP_CallAction.NotifyEVChargingSchedule]: OCPP2_1.NotifyEVChargingScheduleRequestSchema,
  [OCPP_CallAction.NotifyEvent]: OCPP2_1.NotifyEventRequestSchema,
  [OCPP_CallAction.NotifyMonitoringReport]: OCPP2_1.NotifyMonitoringReportRequestSchema,
  [OCPP_CallAction.NotifyReport]: OCPP2_1.NotifyReportRequestSchema,
  [OCPP_CallAction.PublishFirmwareStatusNotification]:
    OCPP2_1.PublishFirmwareStatusNotificationRequestSchema,
  [OCPP_CallAction.ReportChargingProfiles]: OCPP2_1.ReportChargingProfilesRequestSchema,
  [OCPP_CallAction.ReservationStatusUpdate]: OCPP2_1.ReservationStatusUpdateRequestSchema,
  [OCPP_CallAction.SecurityEventNotification]: OCPP2_1.SecurityEventNotificationRequestSchema,
  [OCPP_CallAction.SignCertificate]: OCPP2_1.SignCertificateRequestSchema,
  [OCPP_CallAction.StatusNotification]: OCPP2_1.StatusNotificationRequestSchema,
  [OCPP_CallAction.TransactionEvent]: OCPP2_1.TransactionEventRequestSchema,
};

// Action requests supported by OCPP 2.1
export const OCPP2_1_CALL_SCHEMA_RECORD: Record<string, object> = {
  ...OCPP2_0_1_CALL_SCHEMA_RECORD,
  [OCPP_CallAction.AdjustPeriodicEventStream]: OCPP2_1.AdjustPeriodicEventStreamRequestSchema,
  [OCPP_CallAction.AFRRSignal]: OCPP2_1.AFRRSignalRequestSchema,
  [OCPP_CallAction.BatterySwap]: OCPP2_1.BatterySwapRequestSchema,
  [OCPP_CallAction.ChangeTransactionTariff]: OCPP2_1.ChangeTransactionTariffRequestSchema,
  [OCPP_CallAction.ClearDERControl]: OCPP2_1.ClearDERControlRequestSchema,
  [OCPP_CallAction.ClearTariffs]: OCPP2_1.ClearTariffsRequestSchema,
  [OCPP_CallAction.ClosePeriodicEventStream]: OCPP2_1.ClosePeriodicEventStreamRequestSchema,
  [OCPP_CallAction.GetCertificateChainStatus]: OCPP2_1.GetCertificateChainStatusRequestSchema,
  [OCPP_CallAction.GetDERControl]: OCPP2_1.GetDERControlRequestSchema,
  [OCPP_CallAction.GetPeriodicEventStream]: OCPP2_1.GetPeriodicEventStreamRequestSchema,
  [OCPP_CallAction.GetTariffs]: OCPP2_1.GetTariffsRequestSchema,
  [OCPP_CallAction.NotifyAllowedEnergyTransfer]: OCPP2_1.NotifyAllowedEnergyTransferRequestSchema,
  [OCPP_CallAction.NotifyDERAlarm]: OCPP2_1.NotifyDERAlarmRequestSchema,
  [OCPP_CallAction.NotifyDERStartStop]: OCPP2_1.NotifyDERStartStopRequestSchema,
  [OCPP_CallAction.NotifyPeriodicEventStream]: OCPP2_1.NotifyPeriodicEventStreamSchema,
  [OCPP_CallAction.NotifyPriorityCharging]: OCPP2_1.NotifyPriorityChargingRequestSchema,
  [OCPP_CallAction.NotifySettlement]: OCPP2_1.NotifySettlementRequestSchema,
  [OCPP_CallAction.NotifyWebPaymentStarted]: OCPP2_1.NotifyWebPaymentStartedRequestSchema,
  [OCPP_CallAction.OpenPeriodicEventStream]: OCPP2_1.OpenPeriodicEventStreamRequestSchema,
  [OCPP_CallAction.PullDynamicScheduleUpdate]: OCPP2_1.PullDynamicScheduleUpdateRequestSchema,
  [OCPP_CallAction.ReportDERControl]: OCPP2_1.ReportDERControlRequestSchema,
  [OCPP_CallAction.RequestBatterySwap]: OCPP2_1.RequestBatterySwapRequestSchema,
  [OCPP_CallAction.SetDERControl]: OCPP2_1.SetDERControlRequestSchema,
  [OCPP_CallAction.SetDefaultTariff]: OCPP2_1.SetDefaultTariffRequestSchema,
  [OCPP_CallAction.UpdateDynamicSchedule]: OCPP2_1.UpdateDynamicScheduleRequestSchema,
  [OCPP_CallAction.UsePriorityCharging]: OCPP2_1.UsePriorityChargingRequestSchema,
  [OCPP_CallAction.VatNumberValidation]: OCPP2_1.VatNumberValidationRequestSchema,
  //Overwritten in 2.1
  [OCPP_CallAction.Authorize]: OCPP2_1.AuthorizeResponseSchema,
};

export const OCPP1_6_CALL_RESULT_SCHEMA_RECORD: Record<string, object> = {
  [OCPP_CallAction.CancelReservation]: OCPP1_6.CancelReservationResponseSchema,
  [OCPP_CallAction.ChangeAvailability]: OCPP1_6.ChangeAvailabilityResponseSchema,
  [OCPP_CallAction.ChangeConfiguration]: OCPP1_6.ChangeConfigurationResponseSchema,
  [OCPP_CallAction.ClearCache]: OCPP1_6.ClearCacheResponseSchema,
  [OCPP_CallAction.ClearChargingProfile]: OCPP1_6.ClearChargingProfileResponseSchema,
  [OCPP_CallAction.DataTransfer]: OCPP1_6.DataTransferResponseSchema,
  [OCPP_CallAction.GetCompositeSchedule]: OCPP1_6.GetCompositeScheduleResponseSchema,
  [OCPP_CallAction.GetConfiguration]: OCPP1_6.GetConfigurationResponseSchema,
  [OCPP_CallAction.GetDiagnostics]: OCPP1_6.GetDiagnosticsResponseSchema,
  [OCPP_CallAction.GetLocalListVersion]: OCPP1_6.GetLocalListVersionResponseSchema,
  [OCPP_CallAction.RemoteStartTransaction]: OCPP1_6.RemoteStartTransactionResponseSchema,
  [OCPP_CallAction.RemoteStopTransaction]: OCPP1_6.RemoteStopTransactionResponseSchema,
  [OCPP_CallAction.ReserveNow]: OCPP1_6.ReserveNowResponseSchema,
  [OCPP_CallAction.Reset]: OCPP1_6.ResetResponseSchema,
  [OCPP_CallAction.SendLocalList]: OCPP1_6.SendLocalListResponseSchema,
  [OCPP_CallAction.SetChargingProfile]: OCPP1_6.SetChargingProfileResponseSchema,
  [OCPP_CallAction.TriggerMessage]: OCPP1_6.TriggerMessageResponseSchema,
  [OCPP_CallAction.UnlockConnector]: OCPP1_6.UnlockConnectorResponseSchema,
  [OCPP_CallAction.UpdateFirmware]: OCPP1_6.UpdateFirmwareResponseSchema,
};

// Action results supported by OCPP 2.0.1
export const OCPP2_0_1_CALL_RESULT_SCHEMA_RECORD: Record<string, object> = {
  [OCPP_CallAction.CancelReservation]: OCPP2_1.CancelReservationResponseSchema,
  [OCPP_CallAction.CertificateSigned]: OCPP2_1.CertificateSignedResponseSchema,
  [OCPP_CallAction.ChangeAvailability]: OCPP2_1.ChangeAvailabilityResponseSchema,
  [OCPP_CallAction.ClearCache]: OCPP2_1.ClearCacheResponseSchema,
  [OCPP_CallAction.ClearChargingProfile]: OCPP2_1.ClearChargingProfileResponseSchema,
  [OCPP_CallAction.ClearDisplayMessage]: OCPP2_1.ClearDisplayMessageResponseSchema,
  [OCPP_CallAction.ClearVariableMonitoring]: OCPP2_1.ClearVariableMonitoringResponseSchema,
  [OCPP_CallAction.CustomerInformation]: OCPP2_1.CustomerInformationResponseSchema,
  [OCPP_CallAction.CostUpdated]: OCPP2_1.CostUpdatedResponseSchema,
  [OCPP_CallAction.DataTransfer]: OCPP2_1.DataTransferResponseSchema,
  [OCPP_CallAction.DeleteCertificate]: OCPP2_1.DeleteCertificateResponseSchema,
  [OCPP_CallAction.GetBaseReport]: OCPP2_1.GetBaseReportResponseSchema,
  [OCPP_CallAction.GetChargingProfiles]: OCPP2_1.GetChargingProfilesResponseSchema,
  [OCPP_CallAction.GetCompositeSchedule]: OCPP2_1.GetCompositeScheduleResponseSchema,
  [OCPP_CallAction.GetLocalListVersion]: OCPP2_1.GetLocalListVersionResponseSchema,
  [OCPP_CallAction.GetLog]: OCPP2_1.GetLogResponseSchema,
  [OCPP_CallAction.GetMonitoringReport]: OCPP2_1.GetMonitoringReportResponseSchema,
  [OCPP_CallAction.GetReport]: OCPP2_1.GetReportResponseSchema,
  [OCPP_CallAction.GetTransactionStatus]: OCPP2_1.GetTransactionStatusResponseSchema,
  [OCPP_CallAction.InstallCertificate]: OCPP2_1.InstallCertificateResponseSchema,
  [OCPP_CallAction.GetCertificateStatus]: OCPP2_1.GetCertificateStatusResponseSchema,
  [OCPP_CallAction.GetInstalledCertificateIds]: OCPP2_1.GetInstalledCertificateIdsResponseSchema,
  [OCPP_CallAction.GetVariables]: OCPP2_1.GetVariablesResponseSchema,
  [OCPP_CallAction.RequestStartTransaction]: OCPP2_1.RequestStartTransactionResponseSchema,
  [OCPP_CallAction.RequestStopTransaction]: OCPP2_1.RequestStopTransactionResponseSchema,
  [OCPP_CallAction.ReserveNow]: OCPP2_1.ReserveNowResponseSchema,
  [OCPP_CallAction.Reset]: OCPP2_1.ResetResponseSchema,
  [OCPP_CallAction.SendLocalList]: OCPP2_1.SendLocalListResponseSchema,
  [OCPP_CallAction.SetChargingProfile]: OCPP2_1.SetChargingProfileResponseSchema,
  [OCPP_CallAction.SetDisplayMessage]: OCPP2_1.SetDisplayMessageResponseSchema,
  [OCPP_CallAction.SetMonitoringBase]: OCPP2_1.SetMonitoringBaseResponseSchema,
  [OCPP_CallAction.SetMonitoringLevel]: OCPP2_1.SetMonitoringLevelResponseSchema,
  [OCPP_CallAction.SetNetworkProfile]: OCPP2_1.SetNetworkProfileResponseSchema,
  [OCPP_CallAction.SetVariableMonitoring]: OCPP2_1.SetVariableMonitoringResponseSchema,
  [OCPP_CallAction.SetVariables]: OCPP2_1.SetVariablesResponseSchema,
  [OCPP_CallAction.TriggerMessage]: OCPP2_1.TriggerMessageResponseSchema,
  [OCPP_CallAction.UnlockConnector]: OCPP2_1.UnlockConnectorResponseSchema,
  [OCPP_CallAction.UnpublishFirmware]: OCPP2_1.UnpublishFirmwareResponseSchema,
  [OCPP_CallAction.UpdateFirmware]: OCPP2_1.UpdateFirmwareResponseSchema,
};

// Action results supported by OCPP 2.1
export const OCPP2_1_CALL_RESULT_SCHEMA_RECORD: Record<string, object> = {
  ...OCPP2_0_1_CALL_RESULT_SCHEMA_RECORD,
  [OCPP_CallAction.AdjustPeriodicEventStream]: OCPP2_1.AdjustPeriodicEventStreamResponseSchema,
  [OCPP_CallAction.AFRRSignal]: OCPP2_1.AFRRSignalResponseSchema,
  [OCPP_CallAction.BatterySwap]: OCPP2_1.BatterySwapResponseSchema,
  [OCPP_CallAction.ChangeTransactionTariff]: OCPP2_1.ChangeTransactionTariffResponseSchema,
  [OCPP_CallAction.ClearDERControl]: OCPP2_1.ClearDERControlResponseSchema,
  [OCPP_CallAction.ClearTariffs]: OCPP2_1.ClearTariffsResponseSchema,
  [OCPP_CallAction.ClosePeriodicEventStream]: OCPP2_1.ClosePeriodicEventStreamResponseSchema,
  [OCPP_CallAction.GetCertificateChainStatus]: OCPP2_1.GetCertificateChainStatusResponseSchema,
  [OCPP_CallAction.GetDERControl]: OCPP2_1.GetDERControlResponseSchema,
  [OCPP_CallAction.GetPeriodicEventStream]: OCPP2_1.GetPeriodicEventStreamResponseSchema,
  [OCPP_CallAction.GetTariffs]: OCPP2_1.GetTariffsResponseSchema,
  [OCPP_CallAction.NotifyAllowedEnergyTransfer]: OCPP2_1.NotifyAllowedEnergyTransferResponseSchema,
  [OCPP_CallAction.NotifyDERAlarm]: OCPP2_1.NotifyDERAlarmResponseSchema,
  [OCPP_CallAction.NotifyDERStartStop]: OCPP2_1.NotifyDERStartStopResponseSchema,
  [OCPP_CallAction.NotifyPeriodicEventStream]: OCPP2_1.NotifyPeriodicEventStreamSchema,
  [OCPP_CallAction.NotifyPriorityCharging]: OCPP2_1.NotifyPriorityChargingResponseSchema,
  [OCPP_CallAction.NotifySettlement]: OCPP2_1.NotifySettlementResponseSchema,
  [OCPP_CallAction.NotifyWebPaymentStarted]: OCPP2_1.NotifyWebPaymentStartedResponseSchema,
  [OCPP_CallAction.OpenPeriodicEventStream]: OCPP2_1.OpenPeriodicEventStreamResponseSchema,
  [OCPP_CallAction.PullDynamicScheduleUpdate]: OCPP2_1.PullDynamicScheduleUpdateResponseSchema,
  [OCPP_CallAction.ReportDERControl]: OCPP2_1.ReportDERControlResponseSchema,
  [OCPP_CallAction.RequestBatterySwap]: OCPP2_1.RequestBatterySwapResponseSchema,
  [OCPP_CallAction.SetDERControl]: OCPP2_1.SetDERControlResponseSchema,
  [OCPP_CallAction.SetDefaultTariff]: OCPP2_1.SetDefaultTariffResponseSchema,
  [OCPP_CallAction.UpdateDynamicSchedule]: OCPP2_1.UpdateDynamicScheduleResponseSchema,
  [OCPP_CallAction.UsePriorityCharging]: OCPP2_1.UsePriorityChargingResponseSchema,
  [OCPP_CallAction.VatNumberValidation]: OCPP2_1.VatNumberValidationResponseSchema,
};

export { assert, deepDirectionalEqual, notNull } from './assertion/assertion.js';
export { AuthorizationSecurity } from './interfaces/api/AuthorizationSecurity.js';
export { UnauthorizedError } from './interfaces/api/exception/UnauthorizedError.js';
export { UnauthorizedException } from './interfaces/api/exceptions/unauthorized.exception.js';
export { HttpHeader } from './interfaces/api/http.header.js';
export { HttpStatus } from './interfaces/api/http.status.js';
export * from './interfaces/dto/async.job.dto.js';
export * from './interfaces/dto/authorization.dto.js';
export * from './interfaces/dto/boot.dto.js';
export * from './interfaces/dto/certificate.dto.js';
export * from './interfaces/dto/charging.profile.dto.js';
export * from './interfaces/dto/charging.schedule.dto.js';
export * from './interfaces/dto/charging.station.dto.js';
export * from './interfaces/dto/charging.station.network.profile.dto.js';
export * from './interfaces/dto/charging.station.sequence.dto.js';
export * from './interfaces/dto/component.dto.js';
export * from './interfaces/dto/connector.dto.js';
export * from './interfaces/dto/event.data.dto.js';
export * from './interfaces/dto/evse.dto.js';
export * from './interfaces/dto/evse.type.dto.js';
export * from './interfaces/dto/installed.certificate.dto.js';
export * from './interfaces/dto/latest.status.notification.dto.js';
export * from './interfaces/dto/location.dto.js';
export * from './interfaces/dto/message.info.dto.js';
export * from './interfaces/dto/meter.value.dto.js';
export * from './interfaces/dto/ocpp.message.dto.js';
export * from './interfaces/dto/reservation.dto.js';
export * from './interfaces/dto/sales.tariff.dto.js';
export * from './interfaces/dto/server.network.profile.dto.js';
export * from './interfaces/dto/set.network.profile.dto.js';
export * from './interfaces/dto/start.transaction.dto.js';
export * from './interfaces/dto/status.notification.dto.js';
export * from './interfaces/dto/stop.transaction.dto.js';
export * from './interfaces/dto/subscription.dto.js';
export * from './interfaces/dto/tariff.dto.js';
export * from './interfaces/dto/tenant.dto.js';
export * from './interfaces/dto/tenant.partner.dto.js';
export * from './interfaces/dto/transaction.dto.js';
export * from './interfaces/dto/transaction.event.dto.js';
export * from './interfaces/dto/types/authorization.js';
export * from './interfaces/dto/types/base.dto.js';
export * from './interfaces/dto/types/enums.js';
export * from './interfaces/dto/types/hours.js';
export * from './interfaces/dto/types/location.js';
export * from './interfaces/dto/types/ocpi.registration.js';
export * from './interfaces/dto/types/sales.tariff.js';
export * from './interfaces/dto/types/sampled.value.dto.js';
export * from './interfaces/dto/variable.attribute.dto.js';
export * from './interfaces/dto/variable.characteristics.dto.js';
export * from './interfaces/dto/variable.dto.js';
export * from './interfaces/dto/variable.monitoring.dto.js';
export * from './interfaces/dto/variable.monitoring.status.dto.js';
export * from './interfaces/dto/variable.status.dto.js';
export { Currency } from './money/Currency.js';
export type { CurrencyCode } from './money/Currency.js';
export { Money } from './money/Money.js';
export { addFormats, Ajv };
export declare type Constructable<T> = new (...args: any[]) => T;
