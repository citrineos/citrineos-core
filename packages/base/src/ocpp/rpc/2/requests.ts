// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * APN. APN_ Authentication. APN_ Authentication_ Code
 * urn:x-oca:ocpp:uid:1:568828
 * Authentication method.
 *
 */

import { OCPP2_0_1, OCPP2_1 } from '@citrineos/types';

export type LogStatusNotificationRequest =
  | OCPP2_1.LogStatusNotificationRequest
  | OCPP2_0_1.LogStatusNotificationRequest;

export type NotifyCustomerInformationRequest =
  | OCPP2_1.NotifyCustomerInformationRequest
  | OCPP2_0_1.NotifyCustomerInformationRequest;

export type NotifyReportRequest = OCPP2_1.NotifyReportRequest | OCPP2_0_1.NotifyReportRequest;

export type SecurityEventNotificationRequest =
  | OCPP2_1.SecurityEventNotificationRequest
  | OCPP2_0_1.SecurityEventNotificationRequest;

export type Get15118EVCertificateRequest =
  | OCPP2_1.Get15118EVCertificateRequest
  | OCPP2_0_1.Get15118EVCertificateRequest;

export type GetCertificateStatusRequest =
  | OCPP2_1.GetCertificateStatusRequest
  | OCPP2_0_1.GetCertificateStatusRequest;

export type SignCertificateRequest =
  | OCPP2_1.SignCertificateRequest
  | OCPP2_0_1.SignCertificateRequest;

export type BootNotificationRequest =
  | OCPP2_1.BootNotificationRequest
  | OCPP2_0_1.BootNotificationRequest;

export type HeartbeatRequest = OCPP2_1.HeartbeatRequest | OCPP2_0_1.HeartbeatRequest;

export type NotifyDisplayMessagesRequest =
  | OCPP2_1.NotifyDisplayMessagesRequest
  | OCPP2_0_1.NotifyDisplayMessagesRequest;

export type FirmwareStatusNotificationRequest =
  | OCPP2_1.FirmwareStatusNotificationRequest
  | OCPP2_0_1.FirmwareStatusNotificationRequest;

export type DataTransferRequest = OCPP2_1.DataTransferRequest | OCPP2_0_1.DataTransferRequest;

export type AuthorizeRequest = OCPP2_1.AuthorizeRequest | OCPP2_0_1.AuthorizeRequest;

export type ReservationStatusUpdateRequest =
  | OCPP2_1.ReservationStatusUpdateRequest
  | OCPP2_0_1.ReservationStatusUpdateRequest;

export type NotifyEventRequest = OCPP2_1.NotifyEventRequest | OCPP2_0_1.NotifyEventRequest;

export type NotifyMonitoringReportRequest =
  | OCPP2_1.NotifyMonitoringReportRequest
  | OCPP2_0_1.NotifyMonitoringReportRequest;

export type StatusNotificationRequest =
  | OCPP2_1.StatusNotificationRequest
  | OCPP2_0_1.StatusNotificationRequest;

export type NotifyEVChargingNeedsRequest =
  | OCPP2_1.NotifyEVChargingNeedsRequest
  | OCPP2_0_1.NotifyEVChargingNeedsRequest;

export type NotifyEVChargingScheduleRequest =
  | OCPP2_1.NotifyEVChargingScheduleRequest
  | OCPP2_0_1.NotifyEVChargingScheduleRequest;

export type NotifyChargingLimitRequest =
  | OCPP2_1.NotifyChargingLimitRequest
  | OCPP2_0_1.NotifyChargingLimitRequest;

export type ReportChargingProfilesRequest =
  | OCPP2_1.ReportChargingProfilesRequest
  | OCPP2_0_1.ReportChargingProfilesRequest;

export type ClearedChargingLimitRequest =
  | OCPP2_1.ClearedChargingLimitRequest
  | OCPP2_0_1.ClearedChargingLimitRequest;

export type ReserveNowRequest = OCPP2_1.ReserveNowRequest | OCPP2_0_1.ReserveNowRequest;
export type MeterValuesRequest = OCPP2_1.MeterValuesRequest | OCPP2_0_1.MeterValuesRequest;

export type TransactionEventRequest =
  | OCPP2_1.TransactionEventRequest
  | OCPP2_0_1.TransactionEventRequest;

export type CertificateSignedRequest =
  | OCPP2_1.CertificateSignedRequest
  | OCPP2_0_1.CertificateSignedRequest;

export type GetInstalledCertificateIdsRequest =
  | OCPP2_1.GetInstalledCertificateIdsRequest
  | OCPP2_0_1.GetInstalledCertificateIdsRequest;

export type InstallCertificateRequest =
  | OCPP2_1.InstallCertificateRequest
  | OCPP2_0_1.InstallCertificateRequest;

export type DeleteCertificateRequest =
  | OCPP2_1.DeleteCertificateRequest
  | OCPP2_0_1.DeleteCertificateRequest;

export type SetNetworkProfileRequest =
  | OCPP2_1.SetNetworkProfileRequest
  | OCPP2_0_1.SetNetworkProfileRequest;

export type ClearDisplayMessageRequest =
  | OCPP2_1.ClearDisplayMessageRequest
  | OCPP2_0_1.SetNetworkProfileRequest;

export type GetDisplayMessagesRequest =
  | OCPP2_1.GetDisplayMessagesRequest
  | OCPP2_0_1.GetDisplayMessagesRequest;

export type PublishFirmwareRequest =
  | OCPP2_1.PublishFirmwareRequest
  | OCPP2_0_1.PublishFirmwareRequest;
export type SetDisplayMessageRequest =
  | OCPP2_1.SetDisplayMessageRequest
  | OCPP2_0_1.SetDisplayMessageRequest;
export type UnpublishFirmwareRequest =
  | OCPP2_1.UnpublishFirmwareRequest
  | OCPP2_0_1.UnpublishFirmwareRequest;
export type UpdateFirmwareRequest = OCPP2_1.UpdateFirmwareRequest | OCPP2_0_1.UpdateFirmwareRequest;
export type ResetRequest = OCPP2_1.ResetRequest | OCPP2_0_1.ResetRequest;
export type ChangeAvailabilityRequest =
  | OCPP2_1.ChangeAvailabilityRequest
  | OCPP2_0_1.ChangeAvailabilityRequest;
export type TriggerMessageRequest = OCPP2_1.TriggerMessageRequest | OCPP2_0_1.TriggerMessageRequest;
export type RequestStartTransactionRequest =
  | OCPP2_1.RequestStartTransactionRequest
  | OCPP2_0_1.RequestStartTransactionRequest;
export type RequestStopTransactionRequest =
  | OCPP2_1.RequestStopTransactionRequest
  | OCPP2_0_1.RequestStopTransactionRequest;
export type CancelReservationRequest =
  | OCPP2_1.CancelReservationRequest
  | OCPP2_0_1.CancelReservationRequest;
export type UnlockConnectorRequest =
  | OCPP2_1.UnlockConnectorRequest
  | OCPP2_0_1.UnlockConnectorRequest;
export type ClearCacheRequest = OCPP2_1.ClearCacheRequest | OCPP2_0_1.ClearCacheRequest;
export type SendLocalListRequest = OCPP2_1.SendLocalListRequest | OCPP2_0_1.SendLocalListRequest;
export type GetLocalListVersionRequest =
  | OCPP2_1.GetLocalListVersionRequest
  | OCPP2_0_1.GetLocalListVersionRequest;
export type SetVariableMonitoringRequest =
  | OCPP2_1.SetVariableMonitoringRequest
  | OCPP2_0_1.SetVariableMonitoringRequest;
export type ClearVariableMonitoringRequest =
  | OCPP2_1.ClearVariableMonitoringRequest
  | OCPP2_0_1.ClearVariableMonitoringRequest;
export type SetMonitoringLevelRequest =
  | OCPP2_1.SetMonitoringLevelRequest
  | OCPP2_0_1.SetMonitoringLevelRequest;
export type SetMonitoringBaseRequest =
  | OCPP2_1.SetMonitoringBaseRequest
  | OCPP2_0_1.SetMonitoringBaseRequest;
export type SetVariablesRequest = OCPP2_1.SetVariablesRequest | OCPP2_0_1.SetVariablesRequest;
export type GetVariablesRequest = OCPP2_1.GetVariablesRequest | OCPP2_0_1.GetVariablesRequest;
export type GetBaseReportRequest = OCPP2_1.GetBaseReportRequest | OCPP2_0_1.GetBaseReportRequest;
export type GetReportRequest = OCPP2_1.GetReportRequest | OCPP2_0_1.GetReportRequest;
export type GetMonitoringReportRequest =
  | OCPP2_1.GetMonitoringReportRequest
  | OCPP2_0_1.GetMonitoringReportRequest;
export type GetLogRequest = OCPP2_1.GetLogRequest | OCPP2_0_1.GetLogRequest;
export type CustomerInformationRequest =
  | OCPP2_1.CustomerInformationRequest
  | OCPP2_0_1.CustomerInformationRequest;
export type ClearChargingProfileRequest =
  | OCPP2_1.ClearChargingProfileRequest
  | OCPP2_0_1.ClearChargingProfileRequest;
export type GetChargingProfilesRequest =
  | OCPP2_1.GetChargingProfilesRequest
  | OCPP2_0_1.GetChargingProfilesRequest;
export type SetChargingProfileRequest =
  | OCPP2_1.SetChargingProfileRequest
  | OCPP2_0_1.SetChargingProfileRequest;
export type GetCompositeScheduleRequest =
  | OCPP2_1.GetCompositeScheduleRequest
  | OCPP2_0_1.GetCompositeScheduleRequest;
export type CostUpdatedRequest = OCPP2_1.CostUpdatedRequest | OCPP2_0_1.CostUpdatedRequest;
export type GetTransactionStatusRequest =
  | OCPP2_1.GetTransactionStatusRequest
  | OCPP2_0_1.GetTransactionStatusRequest;
