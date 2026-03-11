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
export type TransactionEventRequest =
  | OCPP2_1.TransactionEventRequest
  | OCPP2_0_1.TransactionEventRequest;

export type CertificateSignedRequest =
  | OCPP2_1.CertificateSignedRequest
  | OCPP2_0_1.CertificateSignedRequest;

export type GetInstalledCertificateIdsRequest =
  | OCPP2_1.GetInstalledCertificateIdsRequest
  | OCPP2_0_1.GetInstalledCertificateIdsRequest;
