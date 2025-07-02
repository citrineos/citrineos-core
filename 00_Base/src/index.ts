// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

// Base Library Interfaces
export {
  AbstractModuleApi,
  AsDataEndpoint,
  AsMessageEndpoint,
  HttpMethod,
  IModuleApi,
  IApiAuthProvider,
  ApiAuthorizationResult,
  ApiAuthenticationResult,
  UserInfo,
} from './interfaces/api';
export { BadRequestError } from './interfaces/api/exceptions/BadRequestError';
export { NotFoundError } from './interfaces/api/exceptions/NotFoundError';
export { ICache } from './interfaces/cache/cache';
export {
  CacheNamespace,
  IWebsocketConnection,
  createIdentifier,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
} from './interfaces/cache/types';
export {
  AbstractMessageRouter,
  IAuthenticator,
  AuthenticationOptions,
  IMessageRouter,
} from './interfaces/router';
export {
  AbstractMessageHandler,
  AbstractMessageSender,
  EventGroup,
  HandlerProperties,
  IMessage,
  IMessageConfirmation,
  IMessageContext,
  IMessageHandler,
  IMessageSender,
  Message,
  MessageOrigin,
  MessageState,
  RetryMessageError,
} from './interfaces/messages';
export { AbstractModule, AsHandler, IModule } from './interfaces/modules';
export {
  Call,
  CallAction,
  OCPP1_6_CallAction,
  OCPP2_0_1_CallAction,
  CallError,
  CallResult,
  ErrorCode,
  MessageTypeId,
  OcppError,
  OCPPVersion,
  OCPPVersionType,
  mapToCallAction,
} from './ocpp/rpc/message';
export { ChargingStationSequenceType } from './ocpp/model/requestIds';
export { IFileAccess, IFileStorage } from './interfaces/files';

// Persistence Interfaces

export { TenantContextManager } from './interfaces/tenant';
export { CrudEvent, CrudRepository } from './interfaces/repository';
export * from './ocpp/persistence';

// Configuration Types

export { BootConfig, BOOT_STATUS } from './config/BootConfig';
export { defineConfig, DEFAULT_TENANT_ID } from './config/defineConfig';
export { SystemConfig, systemConfigSchema, WebsocketServerConfig } from './config/types';
export { SignedMeterValuesConfig } from './config/signedMeterValuesConfig';
export { ConfigStore, ConfigStoreFactory } from './config/ConfigStore';
export { BootstrapConfig, loadBootstrapConfig } from './config/boostrap.config';

// Utils

export { RequestBuilder } from './util/request';
export { MeterValueUtils } from './util/MeterValueUtils';

export const LOG_LEVEL_OCPP = 10;

// OCPP 2.0.1 Interfaces

export * from './ocpp/model';

export { UpdateChargingStationPasswordRequest } from './ocpp/model/UpdateChargingStationPasswordRequest';

import { OCPP1_6, OCPP2_0_1 } from './ocpp/model/index';
import { CallAction, OCPP1_6_CallAction, OCPP2_0_1_CallAction } from './ocpp/rpc/message';
import Ajv from 'ajv';

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

export { eventGroupFromString } from './interfaces/messages';
export { UnauthorizedException } from './interfaces/api/exceptions/unauthorized.exception';
export { HttpHeader } from './interfaces/api/http.header';
export { HttpStatus } from './interfaces/api/http.status';
export { Money } from './money/Money';
export { Currency, CurrencyCode } from './money/Currency';
export { assert, notNull, deepDirectionalEqual } from './assertion/assertion';
export { UnauthorizedError } from './interfaces/api/exception/UnauthorizedError';
export { AuthorizationSecurity } from './interfaces/api/AuthorizationSecurity';
export { Ajv };
export declare type Constructable<T> = new (...args: any[]) => T;
