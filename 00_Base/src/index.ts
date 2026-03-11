// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Base Library Interfaces
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { OCPP1_6, OCPP2_0_1, OCPP2_1 } from './ocpp/model/index.js';
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
export type { OCPPMessageDto } from './interfaces/dto/ocpp.message.dto.js';
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
  OCPP_CallAction,
  OcppError,
  OCPPVersion,
  OCPP_2_VER_LIST,
} from './ocpp/rpc/message.js';
export type {
  Call,
  CallAction,
  CallError,
  CallResult,
  OCPPVersionType,
} from './ocpp/rpc/message.js';
export * as OCPP2_common_types from './ocpp/rpc/types.js';
export * as OCPP2_request_types from './ocpp/rpc/requests.js';
export * as OCPP2_response_types from './ocpp/rpc/responses.js';

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

export const OCPP1_6_CALL_SCHEMA_RECORD: Record<string, object> = {
  [OCPP_CallAction.Authorize]: OCPP1_6.AuthorizeRequestSchema,
  [OCPP_CallAction.BootNotification]: OCPP1_6.BootNotificationRequestSchema,
  [OCPP_CallAction.CancelReservation]: OCPP1_6.CancelReservationRequestSchema,
  [OCPP_CallAction.ChangeAvailability]: OCPP1_6.ChangeAvailabilityRequestSchema,
  [OCPP_CallAction.ChangeConfiguration]: OCPP1_6.ChangeConfigurationRequestSchema,
  [OCPP_CallAction.ClearCache]: OCPP1_6.ClearCacheRequestSchema,
  [OCPP_CallAction.ClearChargingProfile]: OCPP1_6.ClearChargingProfileRequestSchema,
  [OCPP_CallAction.DataTransfer]: OCPP1_6.DataTransferRequestSchema,
  [OCPP_CallAction.DiagnosticsStatusNotification]:
    OCPP1_6.DiagnosticsStatusNotificationRequestSchema,
  [OCPP_CallAction.FirmwareStatusNotification]: OCPP1_6.FirmwareStatusNotificationRequestSchema,
  [OCPP_CallAction.GetCompositeSchedule]: OCPP1_6.GetCompositeScheduleRequestSchema,
  [OCPP_CallAction.GetConfiguration]: OCPP1_6.GetConfigurationRequestSchema,
  [OCPP_CallAction.GetDiagnostics]: OCPP1_6.GetDiagnosticsRequestSchema,
  [OCPP_CallAction.GetLocalListVersion]: OCPP1_6.GetLocalListVersionRequestSchema,
  [OCPP_CallAction.Heartbeat]: OCPP1_6.HeartbeatRequestSchema,
  [OCPP_CallAction.MeterValues]: OCPP1_6.MeterValuesRequestSchema,
  [OCPP_CallAction.RemoteStartTransaction]: OCPP1_6.RemoteStartTransactionRequestSchema,
  [OCPP_CallAction.RemoteStopTransaction]: OCPP1_6.RemoteStopTransactionRequestSchema,
  [OCPP_CallAction.ReserveNow]: OCPP1_6.ReserveNowRequestSchema,
  [OCPP_CallAction.Reset]: OCPP1_6.ResetRequestSchema,
  [OCPP_CallAction.SendLocalList]: OCPP1_6.SendLocalListRequestSchema,
  [OCPP_CallAction.SetChargingProfile]: OCPP1_6.SetChargingProfileRequestSchema,
  [OCPP_CallAction.StartTransaction]: OCPP1_6.StartTransactionRequestSchema,
  [OCPP_CallAction.StatusNotification]: OCPP1_6.StatusNotificationRequestSchema,
  [OCPP_CallAction.StopTransaction]: OCPP1_6.StopTransactionRequestSchema,
  [OCPP_CallAction.TriggerMessage]: OCPP1_6.TriggerMessageRequestSchema,
  [OCPP_CallAction.UnlockConnector]: OCPP1_6.UnlockConnectorRequestSchema,
  [OCPP_CallAction.UpdateFirmware]: OCPP1_6.UpdateFirmwareRequestSchema,
};

// Action requests supported by OCPP 2.0.1
export const OCPP2_0_1_CALL_SCHEMA_RECORD: Record<string, object> = {
  [OCPP_CallAction.Authorize]: OCPP2_0_1.AuthorizeRequestSchema,
  [OCPP_CallAction.BootNotification]: OCPP2_0_1.BootNotificationRequestSchema,
  [OCPP_CallAction.CancelReservation]: OCPP2_0_1.CancelReservationRequestSchema,
  [OCPP_CallAction.CertificateSigned]: OCPP2_0_1.CertificateSignedRequestSchema,
  [OCPP_CallAction.ChangeAvailability]: OCPP2_0_1.ChangeAvailabilityRequestSchema,
  [OCPP_CallAction.ClearCache]: OCPP2_0_1.ClearCacheRequestSchema,
  [OCPP_CallAction.ClearChargingProfile]: OCPP2_0_1.ClearChargingProfileRequestSchema,
  [OCPP_CallAction.ClearDisplayMessage]: OCPP2_0_1.ClearDisplayMessageRequestSchema,
  [OCPP_CallAction.ClearedChargingLimit]: OCPP2_0_1.ClearedChargingLimitRequestSchema,
  [OCPP_CallAction.ClearVariableMonitoring]: OCPP2_0_1.ClearVariableMonitoringRequestSchema,
  [OCPP_CallAction.CostUpdated]: OCPP2_0_1.CostUpdatedRequestSchema,
  [OCPP_CallAction.CustomerInformation]: OCPP2_0_1.CustomerInformationRequestSchema,
  [OCPP_CallAction.DataTransfer]: OCPP2_0_1.DataTransferRequestSchema,
  [OCPP_CallAction.DeleteCertificate]: OCPP2_0_1.DeleteCertificateRequestSchema,
  [OCPP_CallAction.FirmwareStatusNotification]: OCPP2_0_1.FirmwareStatusNotificationRequestSchema,

  [OCPP_CallAction.Get15118EVCertificate]: OCPP2_0_1.Get15118EVCertificateRequestSchema,
  [OCPP_CallAction.GetBaseReport]: OCPP2_0_1.GetBaseReportRequestSchema,
  [OCPP_CallAction.GetCertificateStatus]: OCPP2_0_1.GetCertificateStatusRequestSchema,
  [OCPP_CallAction.GetChargingProfiles]: OCPP2_0_1.GetChargingProfilesRequestSchema,
  [OCPP_CallAction.GetCompositeSchedule]: OCPP2_0_1.GetCompositeScheduleRequestSchema,
  [OCPP_CallAction.GetDisplayMessages]: OCPP2_0_1.GetDisplayMessagesRequestSchema,
  [OCPP_CallAction.GetInstalledCertificateIds]: OCPP2_0_1.GetInstalledCertificateIdsRequestSchema,

  [OCPP_CallAction.GetLocalListVersion]: OCPP2_0_1.GetLocalListVersionRequestSchema,
  [OCPP_CallAction.GetLog]: OCPP2_0_1.GetLogRequestSchema,
  [OCPP_CallAction.GetMonitoringReport]: OCPP2_0_1.GetMonitoringReportRequestSchema,
  [OCPP_CallAction.GetReport]: OCPP2_0_1.GetReportRequestSchema,
  [OCPP_CallAction.GetTransactionStatus]: OCPP2_0_1.GetTransactionStatusRequestSchema,
  [OCPP_CallAction.GetVariables]: OCPP2_0_1.GetVariablesRequestSchema,
  [OCPP_CallAction.Heartbeat]: OCPP2_0_1.HeartbeatRequestSchema,
  [OCPP_CallAction.InstallCertificate]: OCPP2_0_1.InstallCertificateRequestSchema,
  [OCPP_CallAction.LogStatusNotification]: OCPP2_0_1.LogStatusNotificationRequestSchema,
  [OCPP_CallAction.MeterValues]: OCPP2_0_1.MeterValuesRequestSchema,
  [OCPP_CallAction.NotifyChargingLimit]: OCPP2_0_1.NotifyChargingLimitRequestSchema,
  [OCPP_CallAction.NotifyCustomerInformation]: OCPP2_0_1.NotifyCustomerInformationRequestSchema,

  [OCPP_CallAction.NotifyDisplayMessages]: OCPP2_0_1.NotifyDisplayMessagesRequestSchema,
  [OCPP_CallAction.NotifyEVChargingNeeds]: OCPP2_0_1.NotifyEVChargingNeedsRequestSchema,
  [OCPP_CallAction.NotifyEVChargingSchedule]: OCPP2_0_1.NotifyEVChargingScheduleRequestSchema,
  [OCPP_CallAction.NotifyEvent]: OCPP2_0_1.NotifyEventRequestSchema,
  [OCPP_CallAction.NotifyMonitoringReport]: OCPP2_0_1.NotifyMonitoringReportRequestSchema,
  [OCPP_CallAction.NotifyReport]: OCPP2_0_1.NotifyReportRequestSchema,
  [OCPP_CallAction.PublishFirmware]: OCPP2_0_1.PublishFirmwareRequestSchema,
  [OCPP_CallAction.PublishFirmwareStatusNotification]:
    OCPP2_0_1.PublishFirmwareStatusNotificationRequestSchema,

  [OCPP_CallAction.ReportChargingProfiles]: OCPP2_0_1.ReportChargingProfilesRequestSchema,
  [OCPP_CallAction.RequestStartTransaction]: OCPP2_0_1.RequestStartTransactionRequestSchema,
  [OCPP_CallAction.RequestStopTransaction]: OCPP2_0_1.RequestStopTransactionRequestSchema,
  [OCPP_CallAction.ReservationStatusUpdate]: OCPP2_0_1.ReservationStatusUpdateRequestSchema,
  [OCPP_CallAction.ReserveNow]: OCPP2_0_1.ReserveNowRequestSchema,
  [OCPP_CallAction.Reset]: OCPP2_0_1.ResetRequestSchema,
  [OCPP_CallAction.SecurityEventNotification]: OCPP2_0_1.SecurityEventNotificationRequestSchema,

  [OCPP_CallAction.SendLocalList]: OCPP2_0_1.SendLocalListRequestSchema,
  [OCPP_CallAction.SetChargingProfile]: OCPP2_0_1.SetChargingProfileRequestSchema,
  [OCPP_CallAction.SetDisplayMessage]: OCPP2_0_1.SetDisplayMessageRequestSchema,
  [OCPP_CallAction.SetMonitoringBase]: OCPP2_0_1.SetMonitoringBaseRequestSchema,
  [OCPP_CallAction.SetMonitoringLevel]: OCPP2_0_1.SetMonitoringLevelRequestSchema,
  [OCPP_CallAction.SetNetworkProfile]: OCPP2_0_1.SetNetworkProfileRequestSchema,
  [OCPP_CallAction.SetVariableMonitoring]: OCPP2_0_1.SetVariableMonitoringRequestSchema,
  [OCPP_CallAction.SetVariables]: OCPP2_0_1.SetVariablesRequestSchema,
  [OCPP_CallAction.SignCertificate]: OCPP2_0_1.SignCertificateRequestSchema,
  [OCPP_CallAction.StatusNotification]: OCPP2_0_1.StatusNotificationRequestSchema,
  [OCPP_CallAction.TransactionEvent]: OCPP2_0_1.TransactionEventRequestSchema,
  [OCPP_CallAction.TriggerMessage]: OCPP2_0_1.TriggerMessageRequestSchema,
  [OCPP_CallAction.UnlockConnector]: OCPP2_0_1.UnlockConnectorRequestSchema,
  [OCPP_CallAction.UnpublishFirmware]: OCPP2_0_1.UnpublishFirmwareRequestSchema,
  [OCPP_CallAction.UpdateFirmware]: OCPP2_0_1.UpdateFirmwareRequestSchema,
};

// Action requests supported by OCPP 2.1
export const OCPP2_1_CALL_SCHEMA_RECORD: Record<string, object> = {
  [OCPP_CallAction.Authorize]: OCPP2_1.AuthorizeRequestSchema,
  [OCPP_CallAction.BootNotification]: OCPP2_1.BootNotificationRequestSchema,
  [OCPP_CallAction.CancelReservation]: OCPP2_1.CancelReservationRequestSchema,
  [OCPP_CallAction.CertificateSigned]: OCPP2_1.CertificateSignedRequestSchema,
  [OCPP_CallAction.ChangeAvailability]: OCPP2_1.ChangeAvailabilityRequestSchema,
  [OCPP_CallAction.ClearCache]: OCPP2_1.ClearCacheRequestSchema,
  [OCPP_CallAction.ClearChargingProfile]: OCPP2_1.ClearChargingProfileRequestSchema,
  [OCPP_CallAction.ClearDisplayMessage]: OCPP2_1.ClearDisplayMessageRequestSchema,
  [OCPP_CallAction.ClearedChargingLimit]: OCPP2_1.ClearedChargingLimitRequestSchema,
  [OCPP_CallAction.ClearVariableMonitoring]: OCPP2_1.ClearVariableMonitoringRequestSchema,
  [OCPP_CallAction.CostUpdated]: OCPP2_1.CostUpdatedRequestSchema,
  [OCPP_CallAction.CustomerInformation]: OCPP2_1.CustomerInformationRequestSchema,
  [OCPP_CallAction.DataTransfer]: OCPP2_1.DataTransferRequestSchema,
  [OCPP_CallAction.DeleteCertificate]: OCPP2_1.DeleteCertificateRequestSchema,
  [OCPP_CallAction.FirmwareStatusNotification]: OCPP2_1.FirmwareStatusNotificationRequestSchema,

  [OCPP_CallAction.Get15118EVCertificate]: OCPP2_1.Get15118EVCertificateRequestSchema,
  [OCPP_CallAction.GetBaseReport]: OCPP2_1.GetBaseReportRequestSchema,
  [OCPP_CallAction.GetCertificateStatus]: OCPP2_1.GetCertificateStatusRequestSchema,
  [OCPP_CallAction.GetChargingProfiles]: OCPP2_1.GetChargingProfilesRequestSchema,
  [OCPP_CallAction.GetCompositeSchedule]: OCPP2_1.GetCompositeScheduleRequestSchema,
  [OCPP_CallAction.GetDisplayMessages]: OCPP2_1.GetDisplayMessagesRequestSchema,
  [OCPP_CallAction.GetInstalledCertificateIds]: OCPP2_1.GetInstalledCertificateIdsRequestSchema,

  [OCPP_CallAction.GetLocalListVersion]: OCPP2_1.GetLocalListVersionRequestSchema,
  [OCPP_CallAction.GetLog]: OCPP2_1.GetLogRequestSchema,
  [OCPP_CallAction.GetMonitoringReport]: OCPP2_1.GetMonitoringReportRequestSchema,
  [OCPP_CallAction.GetReport]: OCPP2_1.GetReportRequestSchema,
  [OCPP_CallAction.GetTransactionStatus]: OCPP2_1.GetTransactionStatusRequestSchema,
  [OCPP_CallAction.GetVariables]: OCPP2_1.GetVariablesRequestSchema,
  [OCPP_CallAction.Heartbeat]: OCPP2_1.HeartbeatRequestSchema,
  [OCPP_CallAction.InstallCertificate]: OCPP2_1.InstallCertificateRequestSchema,
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
  [OCPP_CallAction.PublishFirmware]: OCPP2_1.PublishFirmwareRequestSchema,
  [OCPP_CallAction.PublishFirmwareStatusNotification]:
    OCPP2_1.PublishFirmwareStatusNotificationRequestSchema,

  [OCPP_CallAction.ReportChargingProfiles]: OCPP2_1.ReportChargingProfilesRequestSchema,
  [OCPP_CallAction.RequestStartTransaction]: OCPP2_1.RequestStartTransactionRequestSchema,
  [OCPP_CallAction.RequestStopTransaction]: OCPP2_1.RequestStopTransactionRequestSchema,
  [OCPP_CallAction.ReservationStatusUpdate]: OCPP2_1.ReservationStatusUpdateRequestSchema,
  [OCPP_CallAction.ReserveNow]: OCPP2_1.ReserveNowRequestSchema,
  [OCPP_CallAction.Reset]: OCPP2_1.ResetRequestSchema,
  [OCPP_CallAction.SecurityEventNotification]: OCPP2_1.SecurityEventNotificationRequestSchema,

  [OCPP_CallAction.SendLocalList]: OCPP2_1.SendLocalListRequestSchema,
  [OCPP_CallAction.SetChargingProfile]: OCPP2_1.SetChargingProfileRequestSchema,
  [OCPP_CallAction.SetDisplayMessage]: OCPP2_1.SetDisplayMessageRequestSchema,
  [OCPP_CallAction.SetMonitoringBase]: OCPP2_1.SetMonitoringBaseRequestSchema,
  [OCPP_CallAction.SetMonitoringLevel]: OCPP2_1.SetMonitoringLevelRequestSchema,
  [OCPP_CallAction.SetNetworkProfile]: OCPP2_1.SetNetworkProfileRequestSchema,
  [OCPP_CallAction.SetVariableMonitoring]: OCPP2_1.SetVariableMonitoringRequestSchema,
  [OCPP_CallAction.SetVariables]: OCPP2_1.SetVariablesRequestSchema,
  [OCPP_CallAction.SignCertificate]: OCPP2_1.SignCertificateRequestSchema,
  [OCPP_CallAction.StatusNotification]: OCPP2_1.StatusNotificationRequestSchema,
  [OCPP_CallAction.TransactionEvent]: OCPP2_1.TransactionEventRequestSchema,
  [OCPP_CallAction.TriggerMessage]: OCPP2_1.TriggerMessageRequestSchema,
  [OCPP_CallAction.UnlockConnector]: OCPP2_1.UnlockConnectorRequestSchema,
  [OCPP_CallAction.UnpublishFirmware]: OCPP2_1.UnpublishFirmwareRequestSchema,
  [OCPP_CallAction.UpdateFirmware]: OCPP2_1.UpdateFirmwareRequestSchema,
};

export const OCPP1_6_CALL_RESULT_SCHEMA_RECORD: Record<string, object> = {
  [OCPP_CallAction.Authorize]: OCPP1_6.AuthorizeResponseSchema,
  [OCPP_CallAction.BootNotification]: OCPP1_6.BootNotificationResponseSchema,
  [OCPP_CallAction.CancelReservation]: OCPP1_6.CancelReservationResponseSchema,
  [OCPP_CallAction.ChangeAvailability]: OCPP1_6.ChangeAvailabilityResponseSchema,
  [OCPP_CallAction.ChangeConfiguration]: OCPP1_6.ChangeConfigurationResponseSchema,
  [OCPP_CallAction.ClearCache]: OCPP1_6.ClearCacheResponseSchema,
  [OCPP_CallAction.ClearChargingProfile]: OCPP1_6.ClearChargingProfileResponseSchema,
  [OCPP_CallAction.DataTransfer]: OCPP1_6.DataTransferResponseSchema,
  [OCPP_CallAction.DiagnosticsStatusNotification]:
    OCPP1_6.DiagnosticsStatusNotificationResponseSchema,
  [OCPP_CallAction.FirmwareStatusNotification]: OCPP1_6.FirmwareStatusNotificationResponseSchema,
  [OCPP_CallAction.GetCompositeSchedule]: OCPP1_6.GetCompositeScheduleResponseSchema,
  [OCPP_CallAction.GetConfiguration]: OCPP1_6.GetConfigurationResponseSchema,
  [OCPP_CallAction.GetDiagnostics]: OCPP1_6.GetDiagnosticsResponseSchema,
  [OCPP_CallAction.GetLocalListVersion]: OCPP1_6.GetLocalListVersionResponseSchema,
  [OCPP_CallAction.Heartbeat]: OCPP1_6.HeartbeatResponseSchema,
  [OCPP_CallAction.MeterValues]: OCPP1_6.MeterValuesResponseSchema,
  [OCPP_CallAction.RemoteStartTransaction]: OCPP1_6.RemoteStartTransactionResponseSchema,
  [OCPP_CallAction.RemoteStopTransaction]: OCPP1_6.RemoteStopTransactionResponseSchema,
  [OCPP_CallAction.ReserveNow]: OCPP1_6.ReserveNowResponseSchema,
  [OCPP_CallAction.Reset]: OCPP1_6.ResetResponseSchema,
  [OCPP_CallAction.SendLocalList]: OCPP1_6.SendLocalListResponseSchema,
  [OCPP_CallAction.SetChargingProfile]: OCPP1_6.SetChargingProfileResponseSchema,
  [OCPP_CallAction.StartTransaction]: OCPP1_6.StartTransactionResponseSchema,
  [OCPP_CallAction.StatusNotification]: OCPP1_6.StatusNotificationResponseSchema,
  [OCPP_CallAction.StopTransaction]: OCPP1_6.StopTransactionResponseSchema,
  [OCPP_CallAction.TriggerMessage]: OCPP1_6.TriggerMessageResponseSchema,
  [OCPP_CallAction.UnlockConnector]: OCPP1_6.UnlockConnectorResponseSchema,
  [OCPP_CallAction.UpdateFirmware]: OCPP1_6.UpdateFirmwareResponseSchema,
};

// Action results supported by OCPP 2.0.1
export const OCPP2_0_1_CALL_RESULT_SCHEMA_RECORD: Record<string, object> = {
  [OCPP_CallAction.Authorize]: OCPP2_0_1.AuthorizeResponseSchema,
  [OCPP_CallAction.BootNotification]: OCPP2_0_1.BootNotificationResponseSchema,
  [OCPP_CallAction.CancelReservation]: OCPP2_0_1.CancelReservationResponseSchema,
  [OCPP_CallAction.CertificateSigned]: OCPP2_0_1.CertificateSignedResponseSchema,
  [OCPP_CallAction.ChangeAvailability]: OCPP2_0_1.ChangeAvailabilityResponseSchema,
  [OCPP_CallAction.ClearCache]: OCPP2_0_1.ClearCacheResponseSchema,
  [OCPP_CallAction.ClearChargingProfile]: OCPP2_0_1.ClearChargingProfileResponseSchema,
  [OCPP_CallAction.ClearDisplayMessage]: OCPP2_0_1.ClearDisplayMessageResponseSchema,
  [OCPP_CallAction.ClearedChargingLimit]: OCPP2_0_1.ClearedChargingLimitResponseSchema,
  [OCPP_CallAction.ClearVariableMonitoring]: OCPP2_0_1.ClearVariableMonitoringResponseSchema,
  [OCPP_CallAction.CostUpdated]: OCPP2_0_1.CostUpdatedResponseSchema,
  [OCPP_CallAction.CustomerInformation]: OCPP2_0_1.CustomerInformationResponseSchema,
  [OCPP_CallAction.DataTransfer]: OCPP2_0_1.DataTransferResponseSchema,
  [OCPP_CallAction.DeleteCertificate]: OCPP2_0_1.DeleteCertificateResponseSchema,
  [OCPP_CallAction.FirmwareStatusNotification]: OCPP2_0_1.FirmwareStatusNotificationResponseSchema,
  [OCPP_CallAction.Get15118EVCertificate]: OCPP2_0_1.Get15118EVCertificateResponseSchema,
  [OCPP_CallAction.GetBaseReport]: OCPP2_0_1.GetBaseReportResponseSchema,
  [OCPP_CallAction.GetCertificateStatus]: OCPP2_0_1.GetCertificateStatusResponseSchema,
  [OCPP_CallAction.GetChargingProfiles]: OCPP2_0_1.GetChargingProfilesResponseSchema,
  [OCPP_CallAction.GetCompositeSchedule]: OCPP2_0_1.GetCompositeScheduleResponseSchema,
  [OCPP_CallAction.GetDisplayMessages]: OCPP2_0_1.GetDisplayMessagesResponseSchema,
  [OCPP_CallAction.GetInstalledCertificateIds]: OCPP2_0_1.GetInstalledCertificateIdsResponseSchema,
  [OCPP_CallAction.GetLocalListVersion]: OCPP2_0_1.GetLocalListVersionResponseSchema,
  [OCPP_CallAction.GetLog]: OCPP2_0_1.GetLogResponseSchema,
  [OCPP_CallAction.GetMonitoringReport]: OCPP2_0_1.GetMonitoringReportResponseSchema,
  [OCPP_CallAction.GetReport]: OCPP2_0_1.GetReportResponseSchema,
  [OCPP_CallAction.GetTransactionStatus]: OCPP2_0_1.GetTransactionStatusResponseSchema,
  [OCPP_CallAction.GetVariables]: OCPP2_0_1.GetVariablesResponseSchema,
  [OCPP_CallAction.Heartbeat]: OCPP2_0_1.HeartbeatResponseSchema,
  [OCPP_CallAction.InstallCertificate]: OCPP2_0_1.InstallCertificateResponseSchema,
  [OCPP_CallAction.LogStatusNotification]: OCPP2_0_1.LogStatusNotificationResponseSchema,
  [OCPP_CallAction.MeterValues]: OCPP2_0_1.MeterValuesResponseSchema,
  [OCPP_CallAction.NotifyChargingLimit]: OCPP2_0_1.NotifyChargingLimitResponseSchema,
  [OCPP_CallAction.NotifyCustomerInformation]: OCPP2_0_1.NotifyCustomerInformationResponseSchema,
  [OCPP_CallAction.NotifyDisplayMessages]: OCPP2_0_1.NotifyDisplayMessagesResponseSchema,
  [OCPP_CallAction.NotifyEVChargingNeeds]: OCPP2_0_1.NotifyEVChargingNeedsResponseSchema,
  [OCPP_CallAction.NotifyEVChargingSchedule]: OCPP2_0_1.NotifyEVChargingScheduleResponseSchema,
  [OCPP_CallAction.NotifyEvent]: OCPP2_0_1.NotifyEventResponseSchema,
  [OCPP_CallAction.NotifyMonitoringReport]: OCPP2_0_1.NotifyMonitoringReportResponseSchema,
  [OCPP_CallAction.NotifyReport]: OCPP2_0_1.NotifyReportResponseSchema,
  [OCPP_CallAction.PublishFirmware]: OCPP2_0_1.PublishFirmwareResponseSchema,
  [OCPP_CallAction.PublishFirmwareStatusNotification]:
    OCPP2_0_1.PublishFirmwareStatusNotificationResponseSchema,
  [OCPP_CallAction.ReportChargingProfiles]: OCPP2_0_1.ReportChargingProfilesResponseSchema,
  [OCPP_CallAction.RequestStartTransaction]: OCPP2_0_1.RequestStartTransactionResponseSchema,
  [OCPP_CallAction.RequestStopTransaction]: OCPP2_0_1.RequestStopTransactionResponseSchema,
  [OCPP_CallAction.ReservationStatusUpdate]: OCPP2_0_1.ReservationStatusUpdateResponseSchema,
  [OCPP_CallAction.ReserveNow]: OCPP2_0_1.ReserveNowResponseSchema,
  [OCPP_CallAction.Reset]: OCPP2_0_1.ResetResponseSchema,
  [OCPP_CallAction.SecurityEventNotification]: OCPP2_0_1.SecurityEventNotificationResponseSchema,
  [OCPP_CallAction.SendLocalList]: OCPP2_0_1.SendLocalListResponseSchema,
  [OCPP_CallAction.SetChargingProfile]: OCPP2_0_1.SetChargingProfileResponseSchema,
  [OCPP_CallAction.SetDisplayMessage]: OCPP2_0_1.SetDisplayMessageResponseSchema,
  [OCPP_CallAction.SetMonitoringBase]: OCPP2_0_1.SetMonitoringBaseResponseSchema,
  [OCPP_CallAction.SetMonitoringLevel]: OCPP2_0_1.SetMonitoringLevelResponseSchema,
  [OCPP_CallAction.SetNetworkProfile]: OCPP2_0_1.SetNetworkProfileResponseSchema,
  [OCPP_CallAction.SetVariableMonitoring]: OCPP2_0_1.SetVariableMonitoringResponseSchema,
  [OCPP_CallAction.SetVariables]: OCPP2_0_1.SetVariablesResponseSchema,
  [OCPP_CallAction.SignCertificate]: OCPP2_0_1.SignCertificateResponseSchema,
  [OCPP_CallAction.StatusNotification]: OCPP2_0_1.StatusNotificationResponseSchema,
  [OCPP_CallAction.TransactionEvent]: OCPP2_0_1.TransactionEventResponseSchema,
  [OCPP_CallAction.TriggerMessage]: OCPP2_0_1.TriggerMessageResponseSchema,
  [OCPP_CallAction.UnlockConnector]: OCPP2_0_1.UnlockConnectorResponseSchema,
  [OCPP_CallAction.UnpublishFirmware]: OCPP2_0_1.UnpublishFirmwareResponseSchema,
  [OCPP_CallAction.UpdateFirmware]: OCPP2_0_1.UpdateFirmwareResponseSchema,
};

// Action results supported by OCPP 2.1
// TODO: Add new action results for OCPP 2.1 once they are implemented
export const OCPP2_1_CALL_RESULT_SCHEMA_RECORD: Record<string, object> = {
  [OCPP_CallAction.Authorize]: OCPP2_1.AuthorizeResponseSchema,
  [OCPP_CallAction.BootNotification]: OCPP2_1.BootNotificationResponseSchema,
  [OCPP_CallAction.CancelReservation]: OCPP2_1.CancelReservationResponseSchema,
  [OCPP_CallAction.CertificateSigned]: OCPP2_1.CertificateSignedResponseSchema,
  [OCPP_CallAction.ChangeAvailability]: OCPP2_1.ChangeAvailabilityResponseSchema,
  [OCPP_CallAction.ClearCache]: OCPP2_1.ClearCacheResponseSchema,
  [OCPP_CallAction.ClearChargingProfile]: OCPP2_1.ClearChargingProfileResponseSchema,
  [OCPP_CallAction.ClearDisplayMessage]: OCPP2_1.ClearDisplayMessageResponseSchema,
  [OCPP_CallAction.ClearedChargingLimit]: OCPP2_1.ClearedChargingLimitResponseSchema,
  [OCPP_CallAction.ClearVariableMonitoring]: OCPP2_1.ClearVariableMonitoringResponseSchema,
  [OCPP_CallAction.CostUpdated]: OCPP2_1.CostUpdatedResponseSchema,
  [OCPP_CallAction.CustomerInformation]: OCPP2_1.CustomerInformationResponseSchema,
  [OCPP_CallAction.DataTransfer]: OCPP2_1.DataTransferResponseSchema,
  [OCPP_CallAction.DeleteCertificate]: OCPP2_1.DeleteCertificateResponseSchema,
  [OCPP_CallAction.FirmwareStatusNotification]: OCPP2_1.FirmwareStatusNotificationResponseSchema,
  [OCPP_CallAction.Get15118EVCertificate]: OCPP2_1.Get15118EVCertificateResponseSchema,
  [OCPP_CallAction.GetBaseReport]: OCPP2_1.GetBaseReportResponseSchema,
  [OCPP_CallAction.GetCertificateStatus]: OCPP2_1.GetCertificateStatusResponseSchema,
  [OCPP_CallAction.GetChargingProfiles]: OCPP2_1.GetChargingProfilesResponseSchema,
  [OCPP_CallAction.GetCompositeSchedule]: OCPP2_1.GetCompositeScheduleResponseSchema,
  [OCPP_CallAction.GetDisplayMessages]: OCPP2_1.GetDisplayMessagesResponseSchema,
  [OCPP_CallAction.GetInstalledCertificateIds]: OCPP2_1.GetInstalledCertificateIdsResponseSchema,
  [OCPP_CallAction.GetLocalListVersion]: OCPP2_1.GetLocalListVersionResponseSchema,
  [OCPP_CallAction.GetLog]: OCPP2_1.GetLogResponseSchema,
  [OCPP_CallAction.GetMonitoringReport]: OCPP2_1.GetMonitoringReportResponseSchema,
  [OCPP_CallAction.GetReport]: OCPP2_1.GetReportResponseSchema,
  [OCPP_CallAction.GetTransactionStatus]: OCPP2_1.GetTransactionStatusResponseSchema,
  [OCPP_CallAction.GetVariables]: OCPP2_1.GetVariablesResponseSchema,
  [OCPP_CallAction.Heartbeat]: OCPP2_1.HeartbeatResponseSchema,
  [OCPP_CallAction.InstallCertificate]: OCPP2_1.InstallCertificateResponseSchema,
  [OCPP_CallAction.LogStatusNotification]: OCPP2_1.LogStatusNotificationResponseSchema,
  [OCPP_CallAction.MeterValues]: OCPP2_1.MeterValuesResponseSchema,
  [OCPP_CallAction.NotifyChargingLimit]: OCPP2_1.NotifyChargingLimitResponseSchema,
  [OCPP_CallAction.NotifyCustomerInformation]: OCPP2_1.NotifyCustomerInformationResponseSchema,
  [OCPP_CallAction.NotifyDisplayMessages]: OCPP2_1.NotifyDisplayMessagesResponseSchema,
  [OCPP_CallAction.NotifyEVChargingNeeds]: OCPP2_1.NotifyEVChargingNeedsResponseSchema,
  [OCPP_CallAction.NotifyEVChargingSchedule]: OCPP2_1.NotifyEVChargingScheduleResponseSchema,
  [OCPP_CallAction.NotifyEvent]: OCPP2_1.NotifyEventResponseSchema,
  [OCPP_CallAction.NotifyMonitoringReport]: OCPP2_1.NotifyMonitoringReportResponseSchema,
  [OCPP_CallAction.NotifyReport]: OCPP2_1.NotifyReportResponseSchema,
  [OCPP_CallAction.PublishFirmware]: OCPP2_1.PublishFirmwareResponseSchema,
  [OCPP_CallAction.PublishFirmwareStatusNotification]:
    OCPP2_1.PublishFirmwareStatusNotificationResponseSchema,
  [OCPP_CallAction.ReportChargingProfiles]: OCPP2_1.ReportChargingProfilesResponseSchema,
  [OCPP_CallAction.RequestStartTransaction]: OCPP2_1.RequestStartTransactionResponseSchema,
  [OCPP_CallAction.RequestStopTransaction]: OCPP2_1.RequestStopTransactionResponseSchema,
  [OCPP_CallAction.ReservationStatusUpdate]: OCPP2_1.ReservationStatusUpdateResponseSchema,
  [OCPP_CallAction.ReserveNow]: OCPP2_1.ReserveNowResponseSchema,
  [OCPP_CallAction.Reset]: OCPP2_1.ResetResponseSchema,
  [OCPP_CallAction.SecurityEventNotification]: OCPP2_1.SecurityEventNotificationResponseSchema,
  [OCPP_CallAction.SendLocalList]: OCPP2_1.SendLocalListResponseSchema,
  [OCPP_CallAction.SetChargingProfile]: OCPP2_1.SetChargingProfileResponseSchema,
  [OCPP_CallAction.SetDisplayMessage]: OCPP2_1.SetDisplayMessageResponseSchema,
  [OCPP_CallAction.SetMonitoringBase]: OCPP2_1.SetMonitoringBaseResponseSchema,
  [OCPP_CallAction.SetMonitoringLevel]: OCPP2_1.SetMonitoringLevelResponseSchema,
  [OCPP_CallAction.SetNetworkProfile]: OCPP2_1.SetNetworkProfileResponseSchema,
  [OCPP_CallAction.SetVariableMonitoring]: OCPP2_1.SetVariableMonitoringResponseSchema,
  [OCPP_CallAction.SetVariables]: OCPP2_1.SetVariablesResponseSchema,
  [OCPP_CallAction.SignCertificate]: OCPP2_1.SignCertificateResponseSchema,
  [OCPP_CallAction.StatusNotification]: OCPP2_1.StatusNotificationResponseSchema,
  [OCPP_CallAction.TransactionEvent]: OCPP2_1.TransactionEventResponseSchema,
  [OCPP_CallAction.TriggerMessage]: OCPP2_1.TriggerMessageResponseSchema,
  [OCPP_CallAction.UnlockConnector]: OCPP2_1.UnlockConnectorResponseSchema,
  [OCPP_CallAction.UnpublishFirmware]: OCPP2_1.UnpublishFirmwareResponseSchema,
  [OCPP_CallAction.UpdateFirmware]: OCPP2_1.UpdateFirmwareResponseSchema,
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
