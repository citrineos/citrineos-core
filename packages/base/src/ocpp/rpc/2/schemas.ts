// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AnySchemaObject } from 'ajv';
import { OCPP2_0_1, OCPP2_1, OCPPVersion } from '@citrineos/types';

type SchemaRecord = {
  [V in Exclude<OCPPVersion, OCPPVersion.OCPP1_6>]: Record<string, AnySchemaObject>;
};

const ocpp2_0_1_schemas: Record<string, AnySchemaObject> = {
  CertificateSignedRequestSchema: OCPP2_0_1.CertificateSignedRequestSchema,
  InstallCertificateRequestSchema: OCPP2_0_1.InstallCertificateRequestSchema,
  GetInstalledCertificateIdsRequestSchema: OCPP2_0_1.GetInstalledCertificateIdsRequestSchema,
  DeleteCertificateRequestSchema: OCPP2_0_1.DeleteCertificateRequestSchema,
  SetNetworkProfileRequestSchema: OCPP2_0_1.SetNetworkProfileRequestSchema,
  ClearDisplayMessageRequestSchema: OCPP2_0_1.ClearDisplayMessageRequestSchema,
  GetDisplayMessagesRequestSchema: OCPP2_0_1.GetDisplayMessagesRequestSchema,
  PublishFirmwareRequestSchema: OCPP2_0_1.PublishFirmwareRequestSchema,
  SetDisplayMessageRequestSchema: OCPP2_0_1.SetDisplayMessageRequestSchema,
  UnpublishFirmwareRequestSchema: OCPP2_0_1.UnpublishFirmwareRequestSchema,
  UpdateFirmwareRequestSchema: OCPP2_0_1.UpdateFirmwareRequestSchema,
  ResetRequestSchema: OCPP2_0_1.ResetRequestSchema,
  ChangeAvailabilityRequestSchema: OCPP2_0_1.ChangeAvailabilityRequestSchema,
  TriggerMessageRequestSchema: OCPP2_0_1.TriggerMessageRequestSchema,
  DataTransferRequestSchema: OCPP2_0_1.DataTransferRequestSchema,
  RequestStartTransactionRequestSchema: OCPP2_0_1.RequestStartTransactionRequestSchema,
  RequestStopTransactionRequestSchema: OCPP2_0_1.RequestStopTransactionRequestSchema,
  CancelReservationRequestSchema: OCPP2_0_1.CancelReservationRequestSchema,
  ReserveNowRequestSchema: OCPP2_0_1.ReserveNowRequestSchema,
  UnlockConnectorRequestSchema: OCPP2_0_1.UnlockConnectorRequestSchema,
  ClearCacheRequestSchema: OCPP2_0_1.ClearCacheRequestSchema,
  SendLocalListRequestSchema: OCPP2_0_1.SendLocalListRequestSchema,
  GetLocalListVersionRequestSchema: OCPP2_0_1.GetLocalListVersionRequestSchema,
  SetVariableMonitoringRequestSchema: OCPP2_0_1.SetVariableMonitoringRequestSchema,
  ClearVariableMonitoringRequestSchema: OCPP2_0_1.ClearVariableMonitoringRequestSchema,
  SetMonitoringLevelRequestSchema: OCPP2_0_1.SetMonitoringLevelRequestSchema,
  SetMonitoringBaseRequestSchema: OCPP2_0_1.SetMonitoringBaseRequestSchema,
  SetVariablesRequestSchema: OCPP2_0_1.SetVariablesRequestSchema,
  GetVariablesRequestSchema: OCPP2_0_1.GetVariablesRequestSchema,
  GetBaseReportRequestSchema: OCPP2_0_1.GetBaseReportRequestSchema,
  GetReportRequestSchema: OCPP2_0_1.GetReportRequestSchema,
  GetMonitoringReportRequestSchema: OCPP2_0_1.GetMonitoringReportRequestSchema,
  GetLogRequestSchema: OCPP2_0_1.GetLogRequestSchema,
  CustomerInformationRequestSchema: OCPP2_0_1.CustomerInformationRequestSchema,
  ClearChargingProfileRequestSchema: OCPP2_0_1.ClearChargingProfileRequestSchema,
  GetChargingProfilesRequestSchema: OCPP2_0_1.GetChargingProfilesRequestSchema,
  SetChargingProfileRequestSchema: OCPP2_0_1.SetChargingProfileRequestSchema,
  ClearedChargingLimitRequestSchema: OCPP2_0_1.ClearedChargingLimitRequestSchema,
  GetCompositeScheduleRequestSchema: OCPP2_0_1.GetCompositeScheduleRequestSchema,
  CostUpdatedRequestSchema: OCPP2_0_1.CostUpdatedRequestSchema,
  GetTransactionStatusRequestSchema: OCPP2_0_1.GetTransactionStatusRequestSchema,
};

const ocpp2_1_schemas: Record<string, AnySchemaObject> = {
  CertificateSignedRequestSchema: OCPP2_1.CertificateSignedRequestSchema,
  InstallCertificateRequestSchema: OCPP2_1.InstallCertificateRequestSchema,
  GetInstalledCertificateIdsRequestSchema: OCPP2_1.GetInstalledCertificateIdsRequestSchema,
  DeleteCertificateRequestSchema: OCPP2_1.DeleteCertificateRequestSchema,
  SetNetworkProfileRequestSchema: OCPP2_1.SetNetworkProfileRequestSchema,
  ClearDisplayMessageRequestSchema: OCPP2_1.ClearDisplayMessageRequestSchema,
  GetDisplayMessagesRequestSchema: OCPP2_1.GetDisplayMessagesRequestSchema,
  PublishFirmwareRequestSchema: OCPP2_1.PublishFirmwareRequestSchema,
  SetDisplayMessageRequestSchema: OCPP2_1.SetDisplayMessageRequestSchema,
  UnpublishFirmwareRequestSchema: OCPP2_1.UnpublishFirmwareRequestSchema,
  UpdateFirmwareRequestSchema: OCPP2_1.UpdateFirmwareRequestSchema,
  ResetRequestSchema: OCPP2_1.ResetRequestSchema,
  ChangeAvailabilityRequestSchema: OCPP2_1.ChangeAvailabilityRequestSchema,
  TriggerMessageRequestSchema: OCPP2_1.TriggerMessageRequestSchema,
  DataTransferRequestSchema: OCPP2_1.DataTransferRequestSchema,
  RequestStartTransactionRequestSchema: OCPP2_1.RequestStartTransactionRequestSchema,
  RequestStopTransactionRequestSchema: OCPP2_1.RequestStopTransactionRequestSchema,
  CancelReservationRequestSchema: OCPP2_1.CancelReservationRequestSchema,
  ReserveNowRequestSchema: OCPP2_1.ReserveNowRequestSchema,
  UnlockConnectorRequestSchema: OCPP2_1.UnlockConnectorRequestSchema,
  ClearCacheRequestSchema: OCPP2_1.ClearCacheRequestSchema,
  SendLocalListRequestSchema: OCPP2_1.SendLocalListRequestSchema,
  GetLocalListVersionRequestSchema: OCPP2_1.GetLocalListVersionRequestSchema,
  SetVariableMonitoringRequestSchema: OCPP2_1.SetVariableMonitoringRequestSchema,
  ClearVariableMonitoringRequestSchema: OCPP2_1.ClearVariableMonitoringRequestSchema,
  SetMonitoringLevelRequestSchema: OCPP2_1.SetMonitoringLevelRequestSchema,
  SetMonitoringBaseRequestSchema: OCPP2_1.SetMonitoringBaseRequestSchema,
  SetVariablesRequestSchema: OCPP2_1.SetVariablesRequestSchema,
  GetVariablesRequestSchema: OCPP2_1.GetVariablesRequestSchema,
  GetBaseReportRequestSchema: OCPP2_1.GetBaseReportRequestSchema,
  GetReportRequestSchema: OCPP2_1.GetReportRequestSchema,
  GetMonitoringReportRequestSchema: OCPP2_1.GetMonitoringReportRequestSchema,
  GetLogRequestSchema: OCPP2_1.GetLogRequestSchema,
  CustomerInformationRequestSchema: OCPP2_1.CustomerInformationRequestSchema,
  ClearChargingProfileRequestSchema: OCPP2_1.ClearChargingProfileRequestSchema,
  GetChargingProfilesRequestSchema: OCPP2_1.GetChargingProfilesRequestSchema,
  SetChargingProfileRequestSchema: OCPP2_1.SetChargingProfileRequestSchema,
  ClearedChargingLimitRequestSchema: OCPP2_1.ClearedChargingLimitRequestSchema,
  GetCompositeScheduleRequestSchema: OCPP2_1.GetCompositeScheduleRequestSchema,
  CostUpdatedRequestSchema: OCPP2_1.CostUpdatedRequestSchema,
  GetTransactionStatusRequestSchema: OCPP2_1.GetTransactionStatusRequestSchema,
  SetDefaultTariffRequestSchema: OCPP2_1.SetDefaultTariffRequestSchema,
};

const OCPP2_SCHEMA_RECORD: SchemaRecord = {
  'ocpp2.0.1': ocpp2_0_1_schemas,
  'ocpp2.1': ocpp2_1_schemas,
};

export const getOcpp2Schema = (version: Exclude<OCPPVersion, OCPPVersion.OCPP1_6>, name: string) =>
  OCPP2_SCHEMA_RECORD[version][name];
