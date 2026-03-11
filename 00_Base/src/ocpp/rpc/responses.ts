// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * APN. APN_ Authentication. APN_ Authentication_ Code
 * urn:x-oca:ocpp:uid:1:568828
 * Authentication method.
 *
 */

import { OCPP2_0_1, OCPP2_1 } from '../model/index.js';

export type LogStatusNotificationResponse =
  | OCPP2_1.LogStatusNotificationResponse
  | OCPP2_0_1.LogStatusNotificationResponse;

export type NotifyCustomerInformationResponse =
  | OCPP2_1.NotifyCustomerInformationResponse
  | OCPP2_0_1.NotifyCustomerInformationResponse;

export type NotifyReportResponse = OCPP2_1.NotifyReportResponse | OCPP2_0_1.NotifyReportResponse;

export type SecurityEventNotificationResponse =
  | OCPP2_1.SecurityEventNotificationResponse
  | OCPP2_0_1.SecurityEventNotificationResponse;

export type GetBaseReportResponse = OCPP2_1.GetBaseReportResponse | OCPP2_0_1.GetBaseReportResponse;

export type GetReportResponse = OCPP2_1.GetReportResponse | OCPP2_0_1.GetReportResponse;

export type GetMonitoringReportResponse =
  | OCPP2_1.GetMonitoringReportResponse
  | OCPP2_0_1.GetMonitoringReportResponse;

export type GetLogResponse = OCPP2_1.GetLogResponse | OCPP2_0_1.GetLogResponse;

export type CustomerInformationResponse =
  | OCPP2_1.CustomerInformationResponse
  | OCPP2_0_1.CustomerInformationResponse;

export type Get15118EVCertificateResponse =
  | OCPP2_1.Get15118EVCertificateResponse
  | OCPP2_0_1.Get15118EVCertificateResponse;

export type GetCertificateStatusResponse =
  | OCPP2_1.GetCertificateStatusResponse
  | OCPP2_0_1.GetCertificateStatusResponse;

export type SignCertificateResponse =
  | OCPP2_1.SignCertificateResponse
  | OCPP2_0_1.SignCertificateResponse;

export type CertificateSignedResponse =
  | OCPP2_1.CertificateSignedResponse
  | OCPP2_0_1.CertificateSignedResponse;

export type DeleteCertificateResponse =
  | OCPP2_1.DeleteCertificateResponse
  | OCPP2_0_1.DeleteCertificateResponse;

export type GetInstalledCertificateIdsResponse =
  | OCPP2_1.GetInstalledCertificateIdsResponse
  | OCPP2_0_1.GetInstalledCertificateIdsResponse;

export type InstallCertificateResponse =
  | OCPP2_1.InstallCertificateResponse
  | OCPP2_0_1.InstallCertificateResponse;

export type BootNotificationResponse =
  | OCPP2_1.BootNotificationResponse
  | OCPP2_0_1.BootNotificationResponse;

export type HeartbeatResponse = OCPP2_1.HeartbeatResponse | OCPP2_0_1.HeartbeatResponse;

export type NotifyDisplayMessagesResponse =
  | OCPP2_1.NotifyDisplayMessagesResponse
  | OCPP2_0_1.NotifyDisplayMessagesResponse;

export type FirmwareStatusNotificationResponse =
  | OCPP2_1.FirmwareStatusNotificationResponse
  | OCPP2_0_1.FirmwareStatusNotificationResponse;

export type DataTransferResponse = OCPP2_1.DataTransferResponse | OCPP2_0_1.DataTransferResponse;

export type ChangeAvailabilityResponse =
  | OCPP2_1.ChangeAvailabilityResponse
  | OCPP2_0_1.ChangeAvailabilityResponse;

export type SetNetworkProfileResponse =
  | OCPP2_1.SetNetworkProfileResponse
  | OCPP2_0_1.SetNetworkProfileResponse;

export type GetDisplayMessagesResponse =
  | OCPP2_1.GetDisplayMessagesResponse
  | OCPP2_0_1.GetDisplayMessagesResponse;

export type SetDisplayMessageResponse =
  | OCPP2_1.SetDisplayMessageResponse
  | OCPP2_0_1.SetDisplayMessageResponse;

export type PublishFirmwareResponse =
  | OCPP2_1.PublishFirmwareResponse
  | OCPP2_0_1.PublishFirmwareResponse;

export type UnpublishFirmwareResponse =
  | OCPP2_1.UnpublishFirmwareResponse
  | OCPP2_0_1.UnpublishFirmwareResponse;

export type UpdateFirmwareResponse =
  | OCPP2_1.UpdateFirmwareResponse
  | OCPP2_0_1.UpdateFirmwareResponse;

export type ResetResponse = OCPP2_1.ResetResponse | OCPP2_0_1.ResetResponse;

export type TriggerMessageResponse =
  | OCPP2_1.TriggerMessageResponse
  | OCPP2_0_1.TriggerMessageResponse;

export type ClearDisplayMessageResponse =
  | OCPP2_1.ClearDisplayMessageResponse
  | OCPP2_0_1.ClearDisplayMessageResponse;

export type AuthorizeResponse = OCPP2_1.AuthorizeResponse | OCPP2_0_1.AuthorizeResponse;

export type ReservationStatusUpdateResponse =
  | OCPP2_1.ReservationStatusUpdateResponse
  | OCPP2_0_1.ReservationStatusUpdateResponse;

export type CancelReservationResponse =
  | OCPP2_1.CancelReservationResponse
  | OCPP2_0_1.CancelReservationResponse;

export type ReserveNowResponse = OCPP2_1.ReserveNowResponse | OCPP2_0_1.ReserveNowResponse;

export type UnlockConnectorResponse =
  | OCPP2_1.UnlockConnectorResponse
  | OCPP2_0_1.UnlockConnectorResponse;

export type SendLocalListResponse = OCPP2_1.SendLocalListResponse | OCPP2_0_1.SendLocalListResponse;

export type GetLocalListVersionResponse =
  | OCPP2_1.GetLocalListVersionResponse
  | OCPP2_0_1.GetLocalListVersionResponse;

export type ClearCacheResponse = OCPP2_1.ClearCacheResponse | OCPP2_0_1.ClearCacheResponse;

export type NotifyEventResponse = OCPP2_1.NotifyEventResponse | OCPP2_0_1.NotifyEventResponse;

export type ClearVariableMonitoringResponse =
  | OCPP2_1.ClearVariableMonitoringResponse
  | OCPP2_0_1.ClearVariableMonitoringResponse;

export type SetMonitoringLevelResponse =
  | OCPP2_1.SetMonitoringLevelResponse
  | OCPP2_0_1.SetMonitoringLevelResponse;

export type SetMonitoringBaseResponse =
  | OCPP2_1.SetMonitoringBaseResponse
  | OCPP2_0_1.SetMonitoringBaseResponse;

export type GetVariablesResponse = OCPP2_1.GetVariablesResponse | OCPP2_0_1.GetVariablesResponse;

export type SetVariablesResponse = OCPP2_1.SetVariablesResponse | OCPP2_0_1.SetVariablesResponse;

export type StatusNotificationResponse =
  | OCPP2_1.StatusNotificationResponse
  | OCPP2_0_1.StatusNotificationResponse;

export type CostUpdatedResponse = OCPP2_1.CostUpdatedResponse | OCPP2_0_1.CostUpdatedResponse;

export type GetTransactionStatusResponse =
  | OCPP2_1.GetTransactionStatusResponse
  | OCPP2_0_1.GetTransactionStatusResponse;

export type NotifyEVChargingNeedsResponse =
  | OCPP2_1.NotifyEVChargingNeedsResponse
  | OCPP2_0_1.NotifyEVChargingNeedsResponse;

export type NotifyEVChargingScheduleResponse =
  | OCPP2_1.NotifyEVChargingScheduleResponse
  | OCPP2_0_1.NotifyEVChargingScheduleResponse;

export type NotifyChargingLimitResponse =
  | OCPP2_1.NotifyChargingLimitResponse
  | OCPP2_0_1.NotifyChargingLimitResponse;

export type ReportChargingProfilesResponse =
  | OCPP2_1.ReportChargingProfilesResponse
  | OCPP2_0_1.ReportChargingProfilesResponse;

export type ClearChargingProfileResponse =
  | OCPP2_1.ClearChargingProfileResponse
  | OCPP2_0_1.ClearChargingProfileResponse;

export type GetChargingProfilesResponse =
  | OCPP2_1.GetChargingProfilesResponse
  | OCPP2_0_1.GetChargingProfilesResponse;

export type SetChargingProfileResponse =
  | OCPP2_1.SetChargingProfileResponse
  | OCPP2_0_1.SetChargingProfileResponse;

export type ClearedChargingLimitResponse =
  | OCPP2_1.ClearedChargingLimitResponse
  | OCPP2_0_1.ClearedChargingLimitResponse;

export type RequestStartTransactionResponse =
  | OCPP2_1.RequestStartTransactionResponse
  | OCPP2_0_1.RequestStartTransactionResponse;
export type RequestStopTransactionResponse =
  | OCPP2_1.RequestStopTransactionResponse
  | OCPP2_0_1.RequestStopTransactionResponse;
