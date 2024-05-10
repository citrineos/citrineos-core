// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

// Base Library Interfaces
import {
  AuthorizeRequestSchema,
  BootNotificationRequestSchema,
  CancelReservationResponseSchema,
  CertificateSignedResponseSchema,
  ChangeAvailabilityResponseSchema,
  ClearCacheResponseSchema,
  ClearChargingProfileResponseSchema,
  ClearDisplayMessageResponseSchema,
  ClearedChargingLimitRequestSchema,
  ClearVariableMonitoringResponseSchema,
  CostUpdatedResponseSchema,
  CustomerInformationResponseSchema,
  DataTransferRequestSchema,
  DataTransferResponseSchema,
  DeleteCertificateResponseSchema,
  FirmwareStatusNotificationRequestSchema,
  Get15118EVCertificateRequestSchema,
  GetBaseReportResponseSchema,
  GetCertificateStatusRequestSchema,
  GetChargingProfilesResponseSchema,
  GetCompositeScheduleResponseSchema,
  GetInstalledCertificateIdsResponseSchema,
  GetLocalListVersionResponseSchema,
  GetLogResponseSchema,
  GetMonitoringReportResponseSchema,
  GetReportResponseSchema,
  GetTransactionStatusResponseSchema,
  GetVariablesResponseSchema,
  HeartbeatRequestSchema,
  InstallCertificateResponseSchema,
  LogStatusNotificationRequestSchema,
  MeterValuesRequestSchema,
  NotifyCustomerInformationRequestSchema,
  NotifyDisplayMessagesRequestSchema,
  NotifyEVChargingNeedsRequestSchema,
  NotifyEVChargingScheduleRequestSchema,
  NotifyEventRequestSchema,
  NotifyMonitoringReportRequestSchema,
  NotifyReportRequestSchema,
  PublishFirmwareStatusNotificationRequestSchema,
  ReportChargingProfilesRequestSchema,
  RequestStartTransactionResponseSchema,
  RequestStopTransactionResponseSchema,
  ReservationStatusUpdateRequestSchema,
  ReserveNowResponseSchema,
  ResetResponseSchema,
  SecurityEventNotificationRequestSchema,
  SendLocalListResponseSchema,
  SetChargingProfileResponseSchema,
  SetDisplayMessageResponseSchema,
  SetMonitoringBaseResponseSchema,
  SetMonitoringLevelResponseSchema,
  SetNetworkProfileResponseSchema,
  SetVariableMonitoringResponseSchema,
  SetVariablesResponseSchema,
  SignCertificateRequestSchema,
  StatusNotificationRequestSchema,
  TransactionEventRequestSchema,
  TriggerMessageResponseSchema,
  UnlockConnectorResponseSchema,
  UnpublishFirmwareResponseSchema,
  UpdateFirmwareResponseSchema,
} from './ocpp/model/index';
import { CallAction } from './ocpp/rpc/message';

export {
  AbstractModuleApi,
  AsDataEndpoint,
  AsMessageEndpoint,
  HttpMethod,
  IModuleApi,
  ExceptionHandler,
} from './interfaces/api';
export { CacheNamespace, ICache } from './interfaces/cache/cache';
export {
  AbstractMessageRouter,
  IAuthenticator,
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
  CallError,
  CallResult,
  ErrorCode,
  MessageTypeId,
  OcppError,
} from './ocpp/rpc/message';

// Persistence Interfaces

export { ICrudRepository } from './interfaces/repository';
export * from './ocpp/persistence';

// Configuration Types

export { BootConfig, BOOT_STATUS } from './config/BootConfig';
export { defineConfig } from './config/defineConfig';
export { SystemConfig, WebsocketServerConfig } from './config/types';

// Utils

export { RequestBuilder } from './util/request';

export const LOG_LEVEL_OCPP = 10;

// OCPP 2.0.1 Interfaces

export * from './ocpp/model';

export interface OcppRequest {}

export interface OcppResponse {}

export const CALL_SCHEMA_MAP: Map<CallAction, object> = new Map<
  CallAction,
  object
>([
  [CallAction.Authorize, AuthorizeRequestSchema],
  [CallAction.BootNotification, BootNotificationRequestSchema],
  [CallAction.ClearedChargingLimit, ClearedChargingLimitRequestSchema],
  [CallAction.DataTransfer, DataTransferRequestSchema],
  [
    CallAction.FirmwareStatusNotification,
    FirmwareStatusNotificationRequestSchema,
  ],
  [CallAction.Get15118EVCertificate, Get15118EVCertificateRequestSchema],
  [CallAction.GetCertificateStatus, GetCertificateStatusRequestSchema],
  [CallAction.Heartbeat, HeartbeatRequestSchema],
  [CallAction.LogStatusNotification, LogStatusNotificationRequestSchema],
  [CallAction.MeterValues, MeterValuesRequestSchema],
  [
    CallAction.NotifyCustomerInformation,
    NotifyCustomerInformationRequestSchema,
  ],
  [CallAction.NotifyDisplayMessages, NotifyDisplayMessagesRequestSchema],
  [CallAction.NotifyEVChargingNeeds, NotifyEVChargingNeedsRequestSchema],
  [CallAction.NotifyEVChargingSchedule, NotifyEVChargingScheduleRequestSchema],
  [CallAction.NotifyEvent, NotifyEventRequestSchema],
  [CallAction.NotifyMonitoringReport, NotifyMonitoringReportRequestSchema],
  [CallAction.NotifyReport, NotifyReportRequestSchema],
  [
    CallAction.PublishFirmwareStatusNotification,
    PublishFirmwareStatusNotificationRequestSchema,
  ],
  [CallAction.ReportChargingProfiles, ReportChargingProfilesRequestSchema],
  [CallAction.ReservationStatusUpdate, ReservationStatusUpdateRequestSchema],
  [
    CallAction.SecurityEventNotification,
    SecurityEventNotificationRequestSchema,
  ],
  [CallAction.SignCertificate, SignCertificateRequestSchema],
  [CallAction.StatusNotification, StatusNotificationRequestSchema],
  [CallAction.TransactionEvent, TransactionEventRequestSchema],
]);

export const CALL_RESULT_SCHEMA_MAP: Map<CallAction, object> = new Map<
  CallAction,
  object
>([
  [CallAction.CancelReservation, CancelReservationResponseSchema],
  [CallAction.CertificateSigned, CertificateSignedResponseSchema],
  [CallAction.ChangeAvailability, ChangeAvailabilityResponseSchema],
  [CallAction.ClearCache, ClearCacheResponseSchema],
  [CallAction.ClearChargingProfile, ClearChargingProfileResponseSchema],
  [CallAction.ClearDisplayMessage, ClearDisplayMessageResponseSchema],
  [CallAction.ClearVariableMonitoring, ClearVariableMonitoringResponseSchema],
  [CallAction.CustomerInformation, CustomerInformationResponseSchema],
  [CallAction.CostUpdated, CostUpdatedResponseSchema],
  [CallAction.DataTransfer, DataTransferResponseSchema],
  [CallAction.DeleteCertificate, DeleteCertificateResponseSchema],
  [CallAction.GetBaseReport, GetBaseReportResponseSchema],
  [CallAction.GetChargingProfiles, GetChargingProfilesResponseSchema],
  [CallAction.GetCompositeSchedule, GetCompositeScheduleResponseSchema],
  [CallAction.GetLocalListVersion, GetLocalListVersionResponseSchema],
  [CallAction.GetLog, GetLogResponseSchema],
  [CallAction.GetMonitoringReport, GetMonitoringReportResponseSchema],
  [CallAction.GetReport, GetReportResponseSchema],
  [CallAction.GetTransactionStatus, GetTransactionStatusResponseSchema],
  [CallAction.InstallCertificate, InstallCertificateResponseSchema],
  [CallAction.GetCertificateStatus, GetCertificateStatusRequestSchema],
  [
    CallAction.GetInstalledCertificateIds,
    GetInstalledCertificateIdsResponseSchema,
  ],
  [CallAction.GetVariables, GetVariablesResponseSchema],
  [CallAction.RequestStartTransaction, RequestStartTransactionResponseSchema],
  [CallAction.RequestStopTransaction, RequestStopTransactionResponseSchema],
  [CallAction.ReserveNow, ReserveNowResponseSchema],
  [CallAction.Reset, ResetResponseSchema],
  [CallAction.SendLocalList, SendLocalListResponseSchema],
  [CallAction.SetChargingProfile, SetChargingProfileResponseSchema],
  [CallAction.SetDisplayMessage, SetDisplayMessageResponseSchema],
  [CallAction.SetMonitoringBase, SetMonitoringBaseResponseSchema],
  [CallAction.SetMonitoringLevel, SetMonitoringLevelResponseSchema],
  [CallAction.SetNetworkProfile, SetNetworkProfileResponseSchema],
  [CallAction.SetVariableMonitoring, SetVariableMonitoringResponseSchema],
  [CallAction.SetVariables, SetVariablesResponseSchema],
  [CallAction.TriggerMessage, TriggerMessageResponseSchema],
  [CallAction.UnlockConnector, UnlockConnectorResponseSchema],
  [CallAction.UnpublishFirmware, UnpublishFirmwareResponseSchema],
  [CallAction.UpdateFirmware, UpdateFirmwareResponseSchema],
]);

export { eventGroupFromString } from './interfaces/messages';
export { OcpiTag, getOcpiTagString } from '../../03_Modules/Ocpi/src/util/ocpi.tag';
export { HttpStatus } from './interfaces/api/http.status';
export { OcpiResponse } from '../../03_Modules/Ocpi/src/util/ocpi.response';
export { OcpiErrorResponse } from '../../03_Modules/Ocpi/src/util/ocpi.error.response';
export { Credentials } from '../../03_Modules/Ocpi/src/model/Credentials';
export {
  VersionDTO,
  VersionDetailsDTO,
  Version,
} from '../../03_Modules/Ocpi/src/model/Version';
export { HttpHeader } from './interfaces/api/http.header';
export { UnauthorizedException } from './interfaces/api/exceptions/unauthorized.exception';
export { Businessdetails } from '../../03_Modules/Ocpi/src/model/Businessdetails';
export { CredentialsRole } from '../../03_Modules/Ocpi/src/model/CredentialsRole';
export { Endpoint } from '../../03_Modules/Ocpi/src/model/Endpoint';
export { Imagecategory } from '../../03_Modules/Ocpi/src/model/Imagecategory';
export { Image } from '../../03_Modules/Ocpi/src/model/Image';
export { InterfaceRole } from '../../03_Modules/Ocpi/src/model/InterfaceRole';
export { ModuleId } from '../../03_Modules/Ocpi/src/model/ModuleId';
export { Role } from '../../03_Modules/Ocpi/src/model/Role';
export { VersionNumber } from '../../03_Modules/Ocpi/src/model/VersionNumber';
export { OcpiNamespace } from '../../03_Modules/Ocpi/src/util/ocpi.namespace';
export {
  AuthorizationSecurityList,
  AuthorizationSecurity,
} from './interfaces/api/ocpi/AuthorizationSecurity';
