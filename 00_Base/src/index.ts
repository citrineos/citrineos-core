// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Base Library Interfaces
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { OCPP1_6, OCPP2_0_1 } from './ocpp/model/index.js';
import { type CallAction, OCPP1_6_CallAction, OCPP2_0_1_CallAction } from './ocpp/rpc/message.js';

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
  OCPPValidator,
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
  NO_ACTION,
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
export {
  HUBJECT_DEFAULT_AUTH_TOKEN,
  HUBJECT_DEFAULT_BASEURL,
  HUBJECT_DEFAULT_CLIENTID,
  HUBJECT_DEFAULT_CLIENTSECRET,
  HUBJECT_DEFAULT_TOKENURL,
  RbacRulesSchema,
  systemConfigSchema,
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

export const OCPP1_6_CALL_SCHEMA_MAP: Map<CallAction, object> = new Map<OCPP1_6_CallAction, object>(
  [
    [OCPP1_6_CallAction.Authorize, OCPP1_6.AuthorizeRequestSchema],
    [OCPP1_6_CallAction.BootNotification, OCPP1_6.BootNotificationRequestSchema],
    [OCPP1_6_CallAction.CancelReservation, OCPP1_6.CancelReservationRequestSchema],
    [OCPP1_6_CallAction.ChangeAvailability, OCPP1_6.ChangeAvailabilityRequestSchema],
    [OCPP1_6_CallAction.ChangeConfiguration, OCPP1_6.ChangeConfigurationRequestSchema],
    [OCPP1_6_CallAction.ClearCache, OCPP1_6.ClearCacheRequestSchema],
    [OCPP1_6_CallAction.ClearChargingProfile, OCPP1_6.ClearChargingProfileRequestSchema],
    [OCPP1_6_CallAction.DataTransfer, OCPP1_6.DataTransferRequestSchema],
    [
      OCPP1_6_CallAction.DiagnosticsStatusNotification,
      OCPP1_6.DiagnosticsStatusNotificationRequestSchema,
    ],
    [
      OCPP1_6_CallAction.FirmwareStatusNotification,
      OCPP1_6.FirmwareStatusNotificationRequestSchema,
    ],
    [OCPP1_6_CallAction.GetCompositeSchedule, OCPP1_6.GetCompositeScheduleRequestSchema],
    [OCPP1_6_CallAction.GetConfiguration, OCPP1_6.GetConfigurationRequestSchema],
    [OCPP1_6_CallAction.GetDiagnostics, OCPP1_6.GetDiagnosticsRequestSchema],
    [OCPP1_6_CallAction.GetLocalListVersion, OCPP1_6.GetLocalListVersionRequestSchema],
    [OCPP1_6_CallAction.Heartbeat, OCPP1_6.HeartbeatRequestSchema],
    [OCPP1_6_CallAction.MeterValues, OCPP1_6.MeterValuesRequestSchema],
    [OCPP1_6_CallAction.RemoteStartTransaction, OCPP1_6.RemoteStartTransactionRequestSchema],
    [OCPP1_6_CallAction.RemoteStopTransaction, OCPP1_6.RemoteStopTransactionRequestSchema],
    [OCPP1_6_CallAction.ReserveNow, OCPP1_6.ReserveNowRequestSchema],
    [OCPP1_6_CallAction.Reset, OCPP1_6.ResetRequestSchema],
    [OCPP1_6_CallAction.SendLocalList, OCPP1_6.SendLocalListRequestSchema],
    [OCPP1_6_CallAction.SetChargingProfile, OCPP1_6.SetChargingProfileRequestSchema],
    [OCPP1_6_CallAction.StartTransaction, OCPP1_6.StartTransactionRequestSchema],
    [OCPP1_6_CallAction.StatusNotification, OCPP1_6.StatusNotificationRequestSchema],
    [OCPP1_6_CallAction.StopTransaction, OCPP1_6.StopTransactionRequestSchema],
    [OCPP1_6_CallAction.TriggerMessage, OCPP1_6.TriggerMessageRequestSchema],
    [OCPP1_6_CallAction.UnlockConnector, OCPP1_6.UnlockConnectorRequestSchema],
    [OCPP1_6_CallAction.UpdateFirmware, OCPP1_6.UpdateFirmwareRequestSchema],
  ],
);

export const OCPP2_0_1_CALL_SCHEMA_MAP: Map<CallAction, object> = new Map<
  OCPP2_0_1_CallAction,
  object
>([
  [OCPP2_0_1_CallAction.Authorize, OCPP2_0_1.AuthorizeRequestSchema],
  [OCPP2_0_1_CallAction.BootNotification, OCPP2_0_1.BootNotificationRequestSchema],
  [OCPP2_0_1_CallAction.CancelReservation, OCPP2_0_1.CancelReservationRequestSchema],
  [OCPP2_0_1_CallAction.CertificateSigned, OCPP2_0_1.CertificateSignedRequestSchema],
  [OCPP2_0_1_CallAction.ChangeAvailability, OCPP2_0_1.ChangeAvailabilityRequestSchema],
  [OCPP2_0_1_CallAction.ClearCache, OCPP2_0_1.ClearCacheRequestSchema],
  [OCPP2_0_1_CallAction.ClearChargingProfile, OCPP2_0_1.ClearChargingProfileRequestSchema],
  [OCPP2_0_1_CallAction.ClearDisplayMessage, OCPP2_0_1.ClearDisplayMessageRequestSchema],
  [OCPP2_0_1_CallAction.ClearedChargingLimit, OCPP2_0_1.ClearedChargingLimitRequestSchema],
  [OCPP2_0_1_CallAction.ClearVariableMonitoring, OCPP2_0_1.ClearVariableMonitoringRequestSchema],
  [OCPP2_0_1_CallAction.CostUpdated, OCPP2_0_1.CostUpdatedRequestSchema],
  [OCPP2_0_1_CallAction.CustomerInformation, OCPP2_0_1.CustomerInformationRequestSchema],
  [OCPP2_0_1_CallAction.DataTransfer, OCPP2_0_1.DataTransferRequestSchema],
  [OCPP2_0_1_CallAction.DeleteCertificate, OCPP2_0_1.DeleteCertificateRequestSchema],
  [
    OCPP2_0_1_CallAction.FirmwareStatusNotification,
    OCPP2_0_1.FirmwareStatusNotificationRequestSchema,
  ],
  [OCPP2_0_1_CallAction.Get15118EVCertificate, OCPP2_0_1.Get15118EVCertificateRequestSchema],
  [OCPP2_0_1_CallAction.GetBaseReport, OCPP2_0_1.GetBaseReportRequestSchema],
  [OCPP2_0_1_CallAction.GetCertificateStatus, OCPP2_0_1.GetCertificateStatusRequestSchema],
  [OCPP2_0_1_CallAction.GetChargingProfiles, OCPP2_0_1.GetChargingProfilesRequestSchema],
  [OCPP2_0_1_CallAction.GetCompositeSchedule, OCPP2_0_1.GetCompositeScheduleRequestSchema],
  [OCPP2_0_1_CallAction.GetDisplayMessages, OCPP2_0_1.GetDisplayMessagesRequestSchema],
  [
    OCPP2_0_1_CallAction.GetInstalledCertificateIds,
    OCPP2_0_1.GetInstalledCertificateIdsRequestSchema,
  ],
  [OCPP2_0_1_CallAction.GetLocalListVersion, OCPP2_0_1.GetLocalListVersionRequestSchema],
  [OCPP2_0_1_CallAction.GetLog, OCPP2_0_1.GetLogRequestSchema],
  [OCPP2_0_1_CallAction.GetMonitoringReport, OCPP2_0_1.GetMonitoringReportRequestSchema],
  [OCPP2_0_1_CallAction.GetReport, OCPP2_0_1.GetReportRequestSchema],
  [OCPP2_0_1_CallAction.GetTransactionStatus, OCPP2_0_1.GetTransactionStatusRequestSchema],
  [OCPP2_0_1_CallAction.GetVariables, OCPP2_0_1.GetVariablesRequestSchema],
  [OCPP2_0_1_CallAction.Heartbeat, OCPP2_0_1.HeartbeatRequestSchema],
  [OCPP2_0_1_CallAction.InstallCertificate, OCPP2_0_1.InstallCertificateRequestSchema],
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
  [OCPP2_0_1_CallAction.PublishFirmware, OCPP2_0_1.PublishFirmwareRequestSchema],
  [
    OCPP2_0_1_CallAction.PublishFirmwareStatusNotification,
    OCPP2_0_1.PublishFirmwareStatusNotificationRequestSchema,
  ],
  [OCPP2_0_1_CallAction.ReportChargingProfiles, OCPP2_0_1.ReportChargingProfilesRequestSchema],
  [OCPP2_0_1_CallAction.RequestStartTransaction, OCPP2_0_1.RequestStartTransactionRequestSchema],
  [OCPP2_0_1_CallAction.RequestStopTransaction, OCPP2_0_1.RequestStopTransactionRequestSchema],
  [OCPP2_0_1_CallAction.ReservationStatusUpdate, OCPP2_0_1.ReservationStatusUpdateRequestSchema],
  [OCPP2_0_1_CallAction.ReserveNow, OCPP2_0_1.ReserveNowRequestSchema],
  [OCPP2_0_1_CallAction.Reset, OCPP2_0_1.ResetRequestSchema],
  [
    OCPP2_0_1_CallAction.SecurityEventNotification,
    OCPP2_0_1.SecurityEventNotificationRequestSchema,
  ],
  [OCPP2_0_1_CallAction.SendLocalList, OCPP2_0_1.SendLocalListRequestSchema],
  [OCPP2_0_1_CallAction.SetChargingProfile, OCPP2_0_1.SetChargingProfileRequestSchema],
  [OCPP2_0_1_CallAction.SetDisplayMessage, OCPP2_0_1.SetDisplayMessageRequestSchema],
  [OCPP2_0_1_CallAction.SetMonitoringBase, OCPP2_0_1.SetMonitoringBaseRequestSchema],
  [OCPP2_0_1_CallAction.SetMonitoringLevel, OCPP2_0_1.SetMonitoringLevelRequestSchema],
  [OCPP2_0_1_CallAction.SetNetworkProfile, OCPP2_0_1.SetNetworkProfileRequestSchema],
  [OCPP2_0_1_CallAction.SetVariableMonitoring, OCPP2_0_1.SetVariableMonitoringRequestSchema],
  [OCPP2_0_1_CallAction.SetVariables, OCPP2_0_1.SetVariablesRequestSchema],
  [OCPP2_0_1_CallAction.SignCertificate, OCPP2_0_1.SignCertificateRequestSchema],
  [OCPP2_0_1_CallAction.StatusNotification, OCPP2_0_1.StatusNotificationRequestSchema],
  [OCPP2_0_1_CallAction.TransactionEvent, OCPP2_0_1.TransactionEventRequestSchema],
  [OCPP2_0_1_CallAction.TriggerMessage, OCPP2_0_1.TriggerMessageRequestSchema],
  [OCPP2_0_1_CallAction.UnlockConnector, OCPP2_0_1.UnlockConnectorRequestSchema],
  [OCPP2_0_1_CallAction.UnpublishFirmware, OCPP2_0_1.UnpublishFirmwareRequestSchema],
  [OCPP2_0_1_CallAction.UpdateFirmware, OCPP2_0_1.UpdateFirmwareRequestSchema],
]);

export const OCPP1_6_CALL_RESULT_SCHEMA_MAP: Map<CallAction, object> = new Map<
  OCPP1_6_CallAction,
  object
>([
  [OCPP1_6_CallAction.Authorize, OCPP1_6.AuthorizeResponseSchema],
  [OCPP1_6_CallAction.BootNotification, OCPP1_6.BootNotificationResponseSchema],
  [OCPP1_6_CallAction.CancelReservation, OCPP1_6.CancelReservationResponseSchema],
  [OCPP1_6_CallAction.ChangeAvailability, OCPP1_6.ChangeAvailabilityResponseSchema],
  [OCPP1_6_CallAction.ChangeConfiguration, OCPP1_6.ChangeConfigurationResponseSchema],
  [OCPP1_6_CallAction.ClearCache, OCPP1_6.ClearCacheResponseSchema],
  [OCPP1_6_CallAction.ClearChargingProfile, OCPP1_6.ClearChargingProfileResponseSchema],
  [OCPP1_6_CallAction.DataTransfer, OCPP1_6.DataTransferResponseSchema],
  [
    OCPP1_6_CallAction.DiagnosticsStatusNotification,
    OCPP1_6.DiagnosticsStatusNotificationResponseSchema,
  ],
  [OCPP1_6_CallAction.FirmwareStatusNotification, OCPP1_6.FirmwareStatusNotificationResponseSchema],
  [OCPP1_6_CallAction.GetCompositeSchedule, OCPP1_6.GetCompositeScheduleResponseSchema],
  [OCPP1_6_CallAction.GetConfiguration, OCPP1_6.GetConfigurationResponseSchema],
  [OCPP1_6_CallAction.GetDiagnostics, OCPP1_6.GetDiagnosticsResponseSchema],
  [OCPP1_6_CallAction.GetLocalListVersion, OCPP1_6.GetLocalListVersionResponseSchema],
  [OCPP1_6_CallAction.Heartbeat, OCPP1_6.HeartbeatResponseSchema],
  [OCPP1_6_CallAction.MeterValues, OCPP1_6.MeterValuesResponseSchema],
  [OCPP1_6_CallAction.RemoteStartTransaction, OCPP1_6.RemoteStartTransactionResponseSchema],
  [OCPP1_6_CallAction.RemoteStopTransaction, OCPP1_6.RemoteStopTransactionResponseSchema],
  [OCPP1_6_CallAction.ReserveNow, OCPP1_6.ReserveNowResponseSchema],
  [OCPP1_6_CallAction.Reset, OCPP1_6.ResetResponseSchema],
  [OCPP1_6_CallAction.SendLocalList, OCPP1_6.SendLocalListResponseSchema],
  [OCPP1_6_CallAction.SetChargingProfile, OCPP1_6.SetChargingProfileResponseSchema],
  [OCPP1_6_CallAction.StartTransaction, OCPP1_6.StartTransactionResponseSchema],
  [OCPP1_6_CallAction.StatusNotification, OCPP1_6.StatusNotificationResponseSchema],
  [OCPP1_6_CallAction.StopTransaction, OCPP1_6.StopTransactionResponseSchema],
  [OCPP1_6_CallAction.TriggerMessage, OCPP1_6.TriggerMessageResponseSchema],
  [OCPP1_6_CallAction.UnlockConnector, OCPP1_6.UnlockConnectorResponseSchema],
  [OCPP1_6_CallAction.UpdateFirmware, OCPP1_6.UpdateFirmwareResponseSchema],
]);

export const OCPP2_0_1_CALL_RESULT_SCHEMA_MAP: Map<CallAction, object> = new Map<
  CallAction,
  object
>([
  [OCPP2_0_1_CallAction.Authorize, OCPP2_0_1.AuthorizeResponseSchema],
  [OCPP2_0_1_CallAction.BootNotification, OCPP2_0_1.BootNotificationResponseSchema],
  [OCPP2_0_1_CallAction.CancelReservation, OCPP2_0_1.CancelReservationResponseSchema],
  [OCPP2_0_1_CallAction.CertificateSigned, OCPP2_0_1.CertificateSignedResponseSchema],
  [OCPP2_0_1_CallAction.ChangeAvailability, OCPP2_0_1.ChangeAvailabilityResponseSchema],
  [OCPP2_0_1_CallAction.ClearCache, OCPP2_0_1.ClearCacheResponseSchema],
  [OCPP2_0_1_CallAction.ClearChargingProfile, OCPP2_0_1.ClearChargingProfileResponseSchema],
  [OCPP2_0_1_CallAction.ClearDisplayMessage, OCPP2_0_1.ClearDisplayMessageResponseSchema],
  [OCPP2_0_1_CallAction.ClearedChargingLimit, OCPP2_0_1.ClearedChargingLimitResponseSchema],
  [OCPP2_0_1_CallAction.ClearVariableMonitoring, OCPP2_0_1.ClearVariableMonitoringResponseSchema],
  [OCPP2_0_1_CallAction.CostUpdated, OCPP2_0_1.CostUpdatedResponseSchema],
  [OCPP2_0_1_CallAction.CustomerInformation, OCPP2_0_1.CustomerInformationResponseSchema],
  [OCPP2_0_1_CallAction.DataTransfer, OCPP2_0_1.DataTransferResponseSchema],
  [OCPP2_0_1_CallAction.DeleteCertificate, OCPP2_0_1.DeleteCertificateResponseSchema],
  [
    OCPP2_0_1_CallAction.FirmwareStatusNotification,
    OCPP2_0_1.FirmwareStatusNotificationResponseSchema,
  ],
  [OCPP2_0_1_CallAction.Get15118EVCertificate, OCPP2_0_1.Get15118EVCertificateResponseSchema],
  [OCPP2_0_1_CallAction.GetBaseReport, OCPP2_0_1.GetBaseReportResponseSchema],
  [OCPP2_0_1_CallAction.GetCertificateStatus, OCPP2_0_1.GetCertificateStatusResponseSchema],
  [OCPP2_0_1_CallAction.GetChargingProfiles, OCPP2_0_1.GetChargingProfilesResponseSchema],
  [OCPP2_0_1_CallAction.GetCompositeSchedule, OCPP2_0_1.GetCompositeScheduleResponseSchema],
  [OCPP2_0_1_CallAction.GetDisplayMessages, OCPP2_0_1.GetDisplayMessagesResponseSchema],
  [
    OCPP2_0_1_CallAction.GetInstalledCertificateIds,
    OCPP2_0_1.GetInstalledCertificateIdsResponseSchema,
  ],
  [OCPP2_0_1_CallAction.GetLocalListVersion, OCPP2_0_1.GetLocalListVersionResponseSchema],
  [OCPP2_0_1_CallAction.GetLog, OCPP2_0_1.GetLogResponseSchema],
  [OCPP2_0_1_CallAction.GetMonitoringReport, OCPP2_0_1.GetMonitoringReportResponseSchema],
  [OCPP2_0_1_CallAction.GetReport, OCPP2_0_1.GetReportResponseSchema],
  [OCPP2_0_1_CallAction.GetTransactionStatus, OCPP2_0_1.GetTransactionStatusResponseSchema],
  [OCPP2_0_1_CallAction.GetVariables, OCPP2_0_1.GetVariablesResponseSchema],
  [OCPP2_0_1_CallAction.Heartbeat, OCPP2_0_1.HeartbeatResponseSchema],
  [OCPP2_0_1_CallAction.InstallCertificate, OCPP2_0_1.InstallCertificateResponseSchema],
  [OCPP2_0_1_CallAction.LogStatusNotification, OCPP2_0_1.LogStatusNotificationResponseSchema],
  [OCPP2_0_1_CallAction.MeterValues, OCPP2_0_1.MeterValuesResponseSchema],
  [OCPP2_0_1_CallAction.NotifyChargingLimit, OCPP2_0_1.NotifyChargingLimitResponseSchema],
  [
    OCPP2_0_1_CallAction.NotifyCustomerInformation,
    OCPP2_0_1.NotifyCustomerInformationResponseSchema,
  ],
  [OCPP2_0_1_CallAction.NotifyDisplayMessages, OCPP2_0_1.NotifyDisplayMessagesResponseSchema],
  [OCPP2_0_1_CallAction.NotifyEVChargingNeeds, OCPP2_0_1.NotifyEVChargingNeedsResponseSchema],
  [OCPP2_0_1_CallAction.NotifyEVChargingSchedule, OCPP2_0_1.NotifyEVChargingScheduleResponseSchema],
  [OCPP2_0_1_CallAction.NotifyEvent, OCPP2_0_1.NotifyEventResponseSchema],
  [OCPP2_0_1_CallAction.NotifyMonitoringReport, OCPP2_0_1.NotifyMonitoringReportResponseSchema],
  [OCPP2_0_1_CallAction.NotifyReport, OCPP2_0_1.NotifyReportResponseSchema],
  [OCPP2_0_1_CallAction.PublishFirmware, OCPP2_0_1.PublishFirmwareResponseSchema],
  [
    OCPP2_0_1_CallAction.PublishFirmwareStatusNotification,
    OCPP2_0_1.PublishFirmwareStatusNotificationResponseSchema,
  ],
  [OCPP2_0_1_CallAction.ReportChargingProfiles, OCPP2_0_1.ReportChargingProfilesResponseSchema],
  [OCPP2_0_1_CallAction.RequestStartTransaction, OCPP2_0_1.RequestStartTransactionResponseSchema],
  [OCPP2_0_1_CallAction.RequestStopTransaction, OCPP2_0_1.RequestStopTransactionResponseSchema],
  [OCPP2_0_1_CallAction.ReservationStatusUpdate, OCPP2_0_1.ReservationStatusUpdateResponseSchema],
  [OCPP2_0_1_CallAction.ReserveNow, OCPP2_0_1.ReserveNowResponseSchema],
  [OCPP2_0_1_CallAction.Reset, OCPP2_0_1.ResetResponseSchema],
  [
    OCPP2_0_1_CallAction.SecurityEventNotification,
    OCPP2_0_1.SecurityEventNotificationResponseSchema,
  ],
  [OCPP2_0_1_CallAction.SendLocalList, OCPP2_0_1.SendLocalListResponseSchema],
  [OCPP2_0_1_CallAction.SetChargingProfile, OCPP2_0_1.SetChargingProfileResponseSchema],
  [OCPP2_0_1_CallAction.SetDisplayMessage, OCPP2_0_1.SetDisplayMessageResponseSchema],
  [OCPP2_0_1_CallAction.SetMonitoringBase, OCPP2_0_1.SetMonitoringBaseResponseSchema],
  [OCPP2_0_1_CallAction.SetMonitoringLevel, OCPP2_0_1.SetMonitoringLevelResponseSchema],
  [OCPP2_0_1_CallAction.SetNetworkProfile, OCPP2_0_1.SetNetworkProfileResponseSchema],
  [OCPP2_0_1_CallAction.SetVariableMonitoring, OCPP2_0_1.SetVariableMonitoringResponseSchema],
  [OCPP2_0_1_CallAction.SetVariables, OCPP2_0_1.SetVariablesResponseSchema],
  [OCPP2_0_1_CallAction.SignCertificate, OCPP2_0_1.SignCertificateResponseSchema],
  [OCPP2_0_1_CallAction.StatusNotification, OCPP2_0_1.StatusNotificationResponseSchema],
  [OCPP2_0_1_CallAction.TransactionEvent, OCPP2_0_1.TransactionEventResponseSchema],
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
export * from './interfaces/dto/change.configuration.dto.js';
export * from './interfaces/dto/charging.needs.dto.js';
export * from './interfaces/dto/charging.profile.dto.js';
export * from './interfaces/dto/charging.schedule.dto.js';
export * from './interfaces/dto/charging.station.dto.js';
export * from './interfaces/dto/charging.station.security.info.dto.js';
export * from './interfaces/dto/charging.station.network.profile.dto.js';
export * from './interfaces/dto/charging.station.sequence.dto.js';
export * from './interfaces/dto/component.dto.js';
export * from './interfaces/dto/composite.schedule.dto.js';
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
export * from './interfaces/dto/security.event.dto.js';
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
export * from './interfaces/dto/types/charging.parameters.js';
export * from './interfaces/dto/types/enums.js';
export * from './interfaces/dto/types/hours.js';
export * from './interfaces/dto/types/location.js';
export * from './interfaces/dto/types/message.info.js';
export * from './interfaces/dto/types/ocpi.registration.js';
export * from './interfaces/dto/types/sales.tariff.js';
export * from './interfaces/dto/types/sampled.value.dto.js';
export * from './interfaces/dto/types/transaction.type.js';
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
export { IMessageQuerystringSchema } from './interfaces/api/MessageQuerystring.js';
export type { IMessageQuerystring } from './interfaces/api/MessageQuerystring.js';
