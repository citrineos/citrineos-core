/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

// Base Library Interfaces

export { AbstractModuleApi, AsDataEndpoint, AsMessageEndpoint, HttpMethod, IModuleApi } from './interfaces/api';
export { CacheNamespace, ICache } from './interfaces/cache/cache';
export { AbstractCentralSystem, AbstractCentralSystemApi, AsAdminEndpoint, ClientConnection, ICentralSystem, IClientConnection, OcppError } from './interfaces/server';
export { AbstractMessageHandler, AbstractMessageSender, EventGroup, HandlerProperties, IMessage, IMessageConfirmation, IMessageContext, IMessageHandler, IMessageRouter, IMessageSender, Message, MessageOrigin, MessageState } from './interfaces/messages';
export { AbstractModule, AsHandler, IModule } from './interfaces/modules';
export { Call, CallAction, CallError, CallResult, ErrorCode, MessageTypeId } from './ocpp/rpc/message';

// Persistence Interfaces

export { ICrudRepository } from "./interfaces/repository";
export * from "./ocpp/persistence";

// Configuration Types

export { BootConfig } from "./config/BootConfig";
export { defineConfig } from "./config/defineConfig";
export { SystemConfig } from "./config/types";

// Utils

export { RequestBuilder } from "./util/request";

export const LOG_LEVEL_OCPP = 10;

// OCPP 2.0.1 Interfaces

export * from './ocpp/model';

import {
    AuthorizeRequest,
    AuthorizeRequestSchema,
    AuthorizeResponse,
    BootNotificationRequest,
    BootNotificationRequestSchema,
    BootNotificationResponse,
    CancelReservationRequest,
    CancelReservationResponse,
    CancelReservationResponseSchema,
    CertificateSignedRequest,
    CertificateSignedResponse,
    CertificateSignedResponseSchema,
    ChangeAvailabilityRequest,
    ChangeAvailabilityResponse,
    ChangeAvailabilityResponseSchema,
    ClearCacheRequest,
    ClearCacheResponse,
    ClearCacheResponseSchema,
    ClearChargingProfileRequest,
    ClearChargingProfileResponse,
    ClearChargingProfileResponseSchema,
    ClearDisplayMessageRequest,
    ClearDisplayMessageResponse,
    ClearDisplayMessageResponseSchema,
    ClearVariableMonitoringResponseSchema,
    ClearedChargingLimitRequestSchema,
    CostUpdatedResponseSchema,
    CustomerInformationRequest,
    CustomerInformationResponse,
    CustomerInformationResponseSchema,
    DataTransferRequest,
    DataTransferRequestSchema,
    DataTransferResponse,
    DataTransferResponseSchema,
    DeleteCertificateRequest,
    DeleteCertificateResponse,
    DeleteCertificateResponseSchema,
    FirmwareStatusNotificationRequest,
    FirmwareStatusNotificationRequestSchema,
    FirmwareStatusNotificationResponse,
    Get15118EVCertificateRequestSchema,
    GetBaseReportRequest,
    GetBaseReportResponse,
    GetBaseReportResponseSchema,
    GetCertificateStatusRequest,
    GetCertificateStatusRequestSchema,
    GetCertificateStatusResponse,
    GetChargingProfilesRequest,
    GetChargingProfilesResponse,
    GetChargingProfilesResponseSchema,
    GetCompositeScheduleRequest,
    GetCompositeScheduleResponse,
    GetCompositeScheduleResponseSchema,
    GetInstalledCertificateIdsRequest,
    GetInstalledCertificateIdsResponse,
    GetInstalledCertificateIdsResponseSchema,
    GetLocalListVersionRequest,
    GetLocalListVersionResponse,
    GetLocalListVersionResponseSchema,
    GetLogRequest,
    GetLogResponse,
    GetLogResponseSchema,
    GetMonitoringReportRequest,
    GetMonitoringReportResponse,
    GetReportRequest,
    GetReportResponse,
    GetReportResponseSchema,
    GetTransactionStatusResponseSchema,
    GetVariablesResponseSchema,
    HeartbeatRequest,
    HeartbeatRequestSchema,
    HeartbeatResponse,
    InstallCertificateRequest,
    InstallCertificateResponse,
    InstallCertificateResponseSchema,
    LogStatusNotificationRequest,
    LogStatusNotificationRequestSchema,
    LogStatusNotificationResponse,
    MeterValuesRequest,
    MeterValuesRequestSchema,
    MeterValuesResponse,
    NotifyCustomerInformationRequestSchema,
    NotifyDisplayMessagesRequestSchema,
    NotifyEventRequestSchema,
    NotifyMonitoringReportRequestSchema,
    NotifyReportRequestSchema,
    PublishFirmwareStatusNotificationRequestSchema,
    RequestStartTransactionResponseSchema,
    RequestStopTransactionResponseSchema,
    ReservationStatusUpdateRequestSchema,
    ReserveNowRequest,
    ReserveNowResponse,
    ReserveNowResponseSchema,
    ResetRequest,
    ResetResponse,
    ResetResponseSchema,
    SecurityEventNotificationRequestSchema,
    SendLocalListRequest,
    SendLocalListResponse,
    SendLocalListResponseSchema,
    SetChargingProfileRequest,
    SetChargingProfileResponse,
    SetChargingProfileResponseSchema,
    SetDisplayMessageResponseSchema,
    SetMonitoringBaseResponseSchema,
    SetMonitoringLevelResponseSchema,
    SetNetworkProfileResponseSchema,
    SetVariableMonitoringResponseSchema,
    SetVariablesResponseSchema,
    SignCertificateRequestSchema,
    StatusNotificationRequest,
    StatusNotificationRequestSchema,
    StatusNotificationResponse,
    TransactionEventRequest,
    TransactionEventRequestSchema,
    TransactionEventResponse,
    TriggerMessageRequest,
    TriggerMessageResponse,
    TriggerMessageResponseSchema,
    UnlockConnectorRequest,
    UnlockConnectorResponse,
    UnlockConnectorResponseSchema,
    UnpublishFirmwareResponseSchema,
    UpdateFirmwareResponseSchema
} from './ocpp/model/index';
import { CallAction } from './ocpp/rpc/message';

export type OcppRequest = BootNotificationRequest | InstallCertificateRequest | CancelReservationRequest | CertificateSignedRequest | LogStatusNotificationRequest | StatusNotificationRequest | HeartbeatRequest | TransactionEventRequest | ResetRequest | AuthorizeRequest | MeterValuesRequest | DataTransferRequest | FirmwareStatusNotificationRequest | StatusNotificationRequest | ChangeAvailabilityRequest | ClearCacheRequest | ClearChargingProfileRequest | ClearDisplayMessageRequest | CustomerInformationRequest | DeleteCertificateRequest | GetBaseReportRequest | GetCertificateStatusRequest | GetChargingProfilesRequest | GetCompositeScheduleRequest | GetInstalledCertificateIdsRequest | GetLocalListVersionRequest | GetLogRequest | GetMonitoringReportRequest | GetReportRequest | ReserveNowRequest | SendLocalListRequest | SetChargingProfileRequest | StatusNotificationRequest | TransactionEventRequest | TriggerMessageRequest | UnlockConnectorRequest;
export type OcppResponse = BootNotificationResponse | InstallCertificateResponse | CancelReservationResponse | CertificateSignedResponse | LogStatusNotificationResponse | StatusNotificationResponse | HeartbeatResponse | TransactionEventResponse | ResetResponse | AuthorizeResponse | MeterValuesResponse | DataTransferResponse | FirmwareStatusNotificationResponse | StatusNotificationResponse | ChangeAvailabilityResponse | ClearCacheResponse | ClearChargingProfileResponse | ClearDisplayMessageResponse | CustomerInformationResponse | DeleteCertificateResponse | GetBaseReportResponse | GetCertificateStatusResponse | GetChargingProfilesResponse | GetCompositeScheduleResponse | GetInstalledCertificateIdsResponse | GetLocalListVersionResponse | GetLogResponse | GetMonitoringReportResponse | GetReportResponse | ReserveNowResponse | SendLocalListResponse | SetChargingProfileResponse | StatusNotificationResponse | TransactionEventResponse | TriggerMessageResponse | UnlockConnectorResponse;

export const CALL_SCHEMA_MAP: Map<CallAction, object> = new Map<CallAction, object>([
    [CallAction.Authorize, AuthorizeRequestSchema],
    [CallAction.BootNotification, BootNotificationRequestSchema],
    [CallAction.ClearedChargingLimit, ClearedChargingLimitRequestSchema],
    [CallAction.DataTransfer, DataTransferRequestSchema],
    [CallAction.FirmwareStatusNotification, FirmwareStatusNotificationRequestSchema],
    [CallAction.Get15118EVCertificate, Get15118EVCertificateRequestSchema],
    [CallAction.GetCertificateStatus, GetCertificateStatusRequestSchema],
    [CallAction.Heartbeat, HeartbeatRequestSchema],
    [CallAction.LogStatusNotification, LogStatusNotificationRequestSchema],
    [CallAction.MeterValues, MeterValuesRequestSchema],
    [CallAction.NotifyCustomerInformation, NotifyCustomerInformationRequestSchema],
    [CallAction.NotifyDisplayMessages, NotifyDisplayMessagesRequestSchema],
    [CallAction.NotifyEvent, NotifyEventRequestSchema],
    [CallAction.NotifyMonitoringReport, NotifyMonitoringReportRequestSchema],
    [CallAction.NotifyReport, NotifyReportRequestSchema],
    [CallAction.PublishFirmwareStatusNotification, PublishFirmwareStatusNotificationRequestSchema],
    [CallAction.ReservationStatusUpdate, ReservationStatusUpdateRequestSchema],
    [CallAction.SecurityEventNotification, SecurityEventNotificationRequestSchema],
    [CallAction.SignCertificate, SignCertificateRequestSchema],
    [CallAction.StatusNotification, StatusNotificationRequestSchema],
    [CallAction.TransactionEvent, TransactionEventRequestSchema]
]);

export const CALL_RESULT_SCHEMA_MAP: Map<CallAction, object> = new Map<CallAction, object>([
    [CallAction.CancelReservation, CancelReservationResponseSchema],
    [CallAction.CertificateSigned, CertificateSignedResponseSchema],
    [CallAction.ChangeAvailability, ChangeAvailabilityResponseSchema],
    [CallAction.ClearCache, ClearCacheResponseSchema],
    [CallAction.ClearChargingProfile, ClearChargingProfileResponseSchema],
    [CallAction.ClearDisplayMessage, ClearDisplayMessageResponseSchema],
    [CallAction.ClearVariableMonitoring, ClearVariableMonitoringResponseSchema],
    [CallAction.CustomerInformation, CustomerInformationResponseSchema],
    [CallAction.CostUpdate, CostUpdatedResponseSchema],
    [CallAction.DataTransfer, DataTransferResponseSchema],
    [CallAction.DeleteCertificate, DeleteCertificateResponseSchema],
    [CallAction.GetBaseReport, GetBaseReportResponseSchema],
    [CallAction.GetChargingProfiles, GetChargingProfilesResponseSchema],
    [CallAction.GetCompositeSchedule, GetCompositeScheduleResponseSchema],
    [CallAction.GetLocalListVersion, GetLocalListVersionResponseSchema],
    [CallAction.GetLog, GetLogResponseSchema],
    [CallAction.GetReport, GetReportResponseSchema],
    [CallAction.GetTransactionStatus, GetTransactionStatusResponseSchema],
    [CallAction.InstallCertificate, InstallCertificateResponseSchema],
    [CallAction.GetCertificateStatus, GetCertificateStatusRequestSchema],
    [CallAction.GetInstalledCertificateIds, GetInstalledCertificateIdsResponseSchema],
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