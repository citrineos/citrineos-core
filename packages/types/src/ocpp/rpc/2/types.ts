// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OCPP2_0_1, OCPP2_1 } from '@ocpp/model/index.js';

/**
 * APN. APN_ Authentication. APN_ Authentication_ Code
 * urn:x-oca:ocpp:uid:1:568828
 * Authentication method.
 *
 */

export type EventDataType = OCPP2_1.EventDataType | OCPP2_0_1.EventDataType;
export type AuthorizationData = OCPP2_1.AuthorizationData | OCPP2_0_1.AuthorizationData;
export type EVSEType = OCPP2_1.EVSEType | OCPP2_0_1.EVSEType;
export type VariableType = OCPP2_1.VariableType | OCPP2_0_1.VariableType;
export type ComponentType = OCPP2_1.ComponentType | OCPP2_0_1.ComponentType;
export type MessageInfoType = OCPP2_1.MessageInfoType | OCPP2_0_1.MessageInfoType;
export type StatusInfoType = OCPP2_1.StatusInfoType | OCPP2_0_1.StatusInfoType;
export type VariableAttributeType = OCPP2_1.VariableAttributeType | OCPP2_0_1.VariableAttributeType;
export type ReportDataType = OCPP2_1.ReportDataType | OCPP2_0_1.ReportDataType;
export type GetVariableResultType = OCPP2_1.GetVariableResultType | OCPP2_0_1.GetVariableResultType;
export type SetVariableDataType = OCPP2_1.SetVariableDataType | OCPP2_0_1.SetVariableDataType;
export type SetVariableResultType = OCPP2_1.SetVariableResultType | OCPP2_0_1.SetVariableResultType;
export type MeterValueType = OCPP2_1.MeterValueType | OCPP2_0_1.MeterValueType;
export type VariableMonitoringType =
  | OCPP2_1.VariableMonitoringType
  | OCPP2_0_1.VariableMonitoringType;
export type MonitoringDataType = OCPP2_1.MonitoringDataType | OCPP2_0_1.MonitoringDataType;
export type SetMonitoringDataType = OCPP2_1.SetMonitoringDataType | OCPP2_0_1.SetMonitoringDataType;
export type SetMonitoringResultType =
  | OCPP2_1.SetMonitoringResultType
  | OCPP2_0_1.SetMonitoringResultType;

export type ReserveNowRequest = OCPP2_1.ReserveNowRequest | OCPP2_0_1.ReserveNowRequest;

export type GetVariableDataType = OCPP2_1.GetVariableDataType | OCPP2_0_1.GetVariableDataType;
export type ComponentVariableType = OCPP2_1.ComponentVariableType | OCPP2_0_1.ComponentVariableType;

export type CertificateHashDataChainType =
  | OCPP2_1.CertificateHashDataChainType
  | OCPP2_0_1.CertificateHashDataChainType;

export type ChargingNeedsType = OCPP2_1.ChargingNeedsType | OCPP2_0_1.ChargingNeedsType;

export type ChargingProfileCriterionType =
  | OCPP2_1.ChargingProfileCriterionType
  | OCPP2_0_1.ChargingProfileCriterionType;

export type ChargingProfileType = OCPP2_1.ChargingProfileType | OCPP2_0_1.ChargingProfileType;

export type ChargingSchedulePeriodType =
  | OCPP2_1.ChargingSchedulePeriodType
  | OCPP2_0_1.ChargingSchedulePeriodType;

export type CompositeScheduleType = OCPP2_1.CompositeScheduleType | OCPP2_0_1.CompositeScheduleType;

export type SignedMeterValueType = OCPP2_1.SignedMeterValueType | OCPP2_0_1.SignedMeterValueType;
export type SampledValueType = OCPP2_1.SampledValueType | OCPP2_0_1.SampledValueType;
