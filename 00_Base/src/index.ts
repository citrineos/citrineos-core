// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Base Library Interfaces
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { OCPP1_6, OCPP2_0_1 } from './ocpp/model/index.js';
import type { CallAction } from './ocpp/rpc/message.js';
import { OCPP1_6_CallAction, OCPP2_0_1_CallAction } from './ocpp/rpc/message.js';

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
  OCPP1_6_CallAction,
  OCPP2_0_1_CallAction,
  OcppError,
  OCPPVersion,
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
export { RbacRulesSchema, systemConfigSchema } from './config/types.js';
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

export const OCPP1_6_CALL_SCHEMA_MAP: Map<CallAction, object> = new Map<OCPP1_6_CallAction, object>(
  [
    [OCPP1_6_CallAction.Authorize, OCPP1_6.AuthorizeRequestSchema],
    [OCPP1_6_CallAction.BootNotification, OCPP1_6.BootNotificationRequestSchema],
    [OCPP1_6_CallAction.DataTransfer, OCPP1_6.DataTransferRequestSchema],
    [
      OCPP1_6_CallAction.DiagnosticsStatusNotification,
      OCPP1_6.DiagnosticsStatusNotificationRequestSchema,
    ],
    [
      OCPP1_6_CallAction.FirmwareStatusNotification,
      OCPP1_6.FirmwareStatusNotificationRequestSchema,
    ],
    [OCPP1_6_CallAction.Heartbeat, OCPP1_6.HeartbeatRequestSchema],
    [OCPP1_6_CallAction.MeterValues, OCPP1_6.MeterValuesRequestSchema],
    [OCPP1_6_CallAction.StartTransaction, OCPP1_6.StartTransactionRequestSchema],
    [OCPP1_6_CallAction.StatusNotification, OCPP1_6.StatusNotificationRequestSchema],
    [OCPP1_6_CallAction.StopTransaction, OCPP1_6.StopTransactionRequestSchema],
  ],
);

export const OCPP2_0_1_CALL_SCHEMA_MAP: Map<CallAction, object> = new Map<
  OCPP2_0_1_CallAction,
  object
>([
  [OCPP2_0_1_CallAction.Authorize, OCPP2_0_1.AuthorizeRequestSchema],
  [OCPP2_0_1_CallAction.BootNotification, OCPP2_0_1.BootNotificationRequestSchema],
  [OCPP2_0_1_CallAction.ClearedChargingLimit, OCPP2_0_1.ClearedChargingLimitRequestSchema],
  [OCPP2_0_1_CallAction.DataTransfer, OCPP2_0_1.DataTransferRequestSchema],
  [
    OCPP2_0_1_CallAction.FirmwareStatusNotification,
    OCPP2_0_1.FirmwareStatusNotificationRequestSchema,
  ],
  [OCPP2_0_1_CallAction.Get15118EVCertificate, OCPP2_0_1.Get15118EVCertificateRequestSchema],
  [OCPP2_0_1_CallAction.GetCertificateStatus, OCPP2_0_1.GetCertificateStatusRequestSchema],
  [OCPP2_0_1_CallAction.Heartbeat, OCPP2_0_1.HeartbeatRequestSchema],
  [OCPP2_0_1_CallAction.LogStatusNotification, OCPP2_0_1.LogStatusNotificationRequestSchema],
  [OCPP2_0_1_CallAction.MeterValues, OCPP2_0_1.MeterValuesRequestSchema],
  [OCPP2_0_1_CallAction.NotifyChargingLimit, OCPP2_0_1.NotifyChargingLimitRequestSchema],
  [
    OCPP2_0_1_CallAction.NotifyCustomerInformation,
    OCPP2_0_1.NotifyCustomerInformationRequestSchema,
  ],
  [OCPP2_0_1_CallAction.NotifyDisplayMessages, OCPP2_0_1.NotifyDisplayMessagesRequestSchema],
  [OCPP2_0_1_CallAction.NotifyEVChargingNeeds, OCPP2_0_1.NotifyEVChargingNeedsRequestSchema],
  [OCPP2_0_1_CallAction.NotifyEVChargingSchedule, OCPP2_0_1.NotifyEVChargingScheduleRequestSchema],
  [OCPP2_0_1_CallAction.NotifyEvent, OCPP2_0_1.NotifyEventRequestSchema],
  [OCPP2_0_1_CallAction.NotifyMonitoringReport, OCPP2_0_1.NotifyMonitoringReportRequestSchema],
  [OCPP2_0_1_CallAction.NotifyReport, OCPP2_0_1.NotifyReportRequestSchema],
  [
    OCPP2_0_1_CallAction.PublishFirmwareStatusNotification,
    OCPP2_0_1.PublishFirmwareStatusNotificationRequestSchema,
  ],
  [OCPP2_0_1_CallAction.ReportChargingProfiles, OCPP2_0_1.ReportChargingProfilesRequestSchema],
  [OCPP2_0_1_CallAction.ReservationStatusUpdate, OCPP2_0_1.ReservationStatusUpdateRequestSchema],
  [
    OCPP2_0_1_CallAction.SecurityEventNotification,
    OCPP2_0_1.SecurityEventNotificationRequestSchema,
  ],
  [OCPP2_0_1_CallAction.SignCertificate, OCPP2_0_1.SignCertificateRequestSchema],
  [OCPP2_0_1_CallAction.StatusNotification, OCPP2_0_1.StatusNotificationRequestSchema],
  [OCPP2_0_1_CallAction.TransactionEvent, OCPP2_0_1.TransactionEventRequestSchema],
]);

export const OCPP1_6_CALL_RESULT_SCHEMA_MAP: Map<CallAction, object> = new Map<
  OCPP1_6_CallAction,
  object
>([
  [OCPP1_6_CallAction.CancelReservation, OCPP1_6.CancelReservationResponseSchema],
  [OCPP1_6_CallAction.ChangeAvailability, OCPP1_6.ChangeAvailabilityResponseSchema],
  [OCPP1_6_CallAction.ChangeConfiguration, OCPP1_6.ChangeConfigurationResponseSchema],
  [OCPP1_6_CallAction.ClearCache, OCPP1_6.ClearCacheResponseSchema],
  [OCPP1_6_CallAction.ClearChargingProfile, OCPP1_6.ClearChargingProfileResponseSchema],
  [OCPP1_6_CallAction.DataTransfer, OCPP1_6.DataTransferResponseSchema],
  [OCPP1_6_CallAction.GetCompositeSchedule, OCPP1_6.GetCompositeScheduleResponseSchema],
  [OCPP1_6_CallAction.GetConfiguration, OCPP1_6.GetConfigurationResponseSchema],
  [OCPP1_6_CallAction.GetDiagnostics, OCPP1_6.GetDiagnosticsResponseSchema],
  [OCPP1_6_CallAction.GetLocalListVersion, OCPP1_6.GetLocalListVersionResponseSchema],
  [OCPP1_6_CallAction.RemoteStartTransaction, OCPP1_6.RemoteStartTransactionResponseSchema],
  [OCPP1_6_CallAction.RemoteStopTransaction, OCPP1_6.RemoteStopTransactionResponseSchema],
  [OCPP1_6_CallAction.ReserveNow, OCPP1_6.ReserveNowResponseSchema],
  [OCPP1_6_CallAction.Reset, OCPP1_6.ResetResponseSchema],
  [OCPP1_6_CallAction.SendLocalList, OCPP1_6.SendLocalListResponseSchema],
  [OCPP1_6_CallAction.SetChargingProfile, OCPP1_6.SetChargingProfileResponseSchema],
  [OCPP1_6_CallAction.TriggerMessage, OCPP1_6.TriggerMessageResponseSchema],
  [OCPP1_6_CallAction.UnlockConnector, OCPP1_6.UnlockConnectorResponseSchema],
  [OCPP1_6_CallAction.UpdateFirmware, OCPP1_6.UpdateFirmwareResponseSchema],
]);

export const OCPP2_0_1_CALL_RESULT_SCHEMA_MAP: Map<CallAction, object> = new Map<
  CallAction,
  object
>([
  [OCPP2_0_1_CallAction.CancelReservation, OCPP2_0_1.CancelReservationResponseSchema],
  [OCPP2_0_1_CallAction.CertificateSigned, OCPP2_0_1.CertificateSignedResponseSchema],
  [OCPP2_0_1_CallAction.ChangeAvailability, OCPP2_0_1.ChangeAvailabilityResponseSchema],
  [OCPP2_0_1_CallAction.ClearCache, OCPP2_0_1.ClearCacheResponseSchema],
  [OCPP2_0_1_CallAction.ClearChargingProfile, OCPP2_0_1.ClearChargingProfileResponseSchema],
  [OCPP2_0_1_CallAction.ClearDisplayMessage, OCPP2_0_1.ClearDisplayMessageResponseSchema],
  [OCPP2_0_1_CallAction.ClearVariableMonitoring, OCPP2_0_1.ClearVariableMonitoringResponseSchema],
  [OCPP2_0_1_CallAction.CustomerInformation, OCPP2_0_1.CustomerInformationResponseSchema],
  [OCPP2_0_1_CallAction.CostUpdated, OCPP2_0_1.CostUpdatedResponseSchema],
  [OCPP2_0_1_CallAction.DataTransfer, OCPP2_0_1.DataTransferResponseSchema],
  [OCPP2_0_1_CallAction.DeleteCertificate, OCPP2_0_1.DeleteCertificateResponseSchema],
  [OCPP2_0_1_CallAction.GetBaseReport, OCPP2_0_1.GetBaseReportResponseSchema],
  [OCPP2_0_1_CallAction.GetChargingProfiles, OCPP2_0_1.GetChargingProfilesResponseSchema],
  [OCPP2_0_1_CallAction.GetCompositeSchedule, OCPP2_0_1.GetCompositeScheduleResponseSchema],
  [OCPP2_0_1_CallAction.GetLocalListVersion, OCPP2_0_1.GetLocalListVersionResponseSchema],
  [OCPP2_0_1_CallAction.GetLog, OCPP2_0_1.GetLogResponseSchema],
  [OCPP2_0_1_CallAction.GetMonitoringReport, OCPP2_0_1.GetMonitoringReportResponseSchema],
  [OCPP2_0_1_CallAction.GetReport, OCPP2_0_1.GetReportResponseSchema],
  [OCPP2_0_1_CallAction.GetTransactionStatus, OCPP2_0_1.GetTransactionStatusResponseSchema],
  [OCPP2_0_1_CallAction.InstallCertificate, OCPP2_0_1.InstallCertificateResponseSchema],
  [OCPP2_0_1_CallAction.GetCertificateStatus, OCPP2_0_1.GetCertificateStatusRequestSchema],
  [
    OCPP2_0_1_CallAction.GetInstalledCertificateIds,
    OCPP2_0_1.GetInstalledCertificateIdsResponseSchema,
  ],
  [OCPP2_0_1_CallAction.GetVariables, OCPP2_0_1.GetVariablesResponseSchema],
  [OCPP2_0_1_CallAction.RequestStartTransaction, OCPP2_0_1.RequestStartTransactionResponseSchema],
  [OCPP2_0_1_CallAction.RequestStopTransaction, OCPP2_0_1.RequestStopTransactionResponseSchema],
  [OCPP2_0_1_CallAction.ReserveNow, OCPP2_0_1.ReserveNowResponseSchema],
  [OCPP2_0_1_CallAction.Reset, OCPP2_0_1.ResetResponseSchema],
  [OCPP2_0_1_CallAction.SendLocalList, OCPP2_0_1.SendLocalListResponseSchema],
  [OCPP2_0_1_CallAction.SetChargingProfile, OCPP2_0_1.SetChargingProfileResponseSchema],
  [OCPP2_0_1_CallAction.SetDisplayMessage, OCPP2_0_1.SetDisplayMessageResponseSchema],
  [OCPP2_0_1_CallAction.SetMonitoringBase, OCPP2_0_1.SetMonitoringBaseResponseSchema],
  [OCPP2_0_1_CallAction.SetMonitoringLevel, OCPP2_0_1.SetMonitoringLevelResponseSchema],
  [OCPP2_0_1_CallAction.SetNetworkProfile, OCPP2_0_1.SetNetworkProfileResponseSchema],
  [OCPP2_0_1_CallAction.SetVariableMonitoring, OCPP2_0_1.SetVariableMonitoringResponseSchema],
  [OCPP2_0_1_CallAction.SetVariables, OCPP2_0_1.SetVariablesResponseSchema],
  [OCPP2_0_1_CallAction.TriggerMessage, OCPP2_0_1.TriggerMessageResponseSchema],
  [OCPP2_0_1_CallAction.UnlockConnector, OCPP2_0_1.UnlockConnectorResponseSchema],
  [OCPP2_0_1_CallAction.UnpublishFirmware, OCPP2_0_1.UnpublishFirmwareResponseSchema],
  [OCPP2_0_1_CallAction.UpdateFirmware, OCPP2_0_1.UpdateFirmwareResponseSchema],
]);

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
