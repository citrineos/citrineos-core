// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, forwardMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP_CallAction } from '@citrineos/types';
import { GetCustomReportEndpoint } from './reporting/get-custom-report-endpoint.js';
import { GetMonitoringReportEndpoint } from './reporting/get-monitoring-report-endpoint.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  forwardMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Reporting,
    bodySchema: ocpp2Schema(schemaName),
  });

export const REPORTING_MESSAGE_ENDPOINTS = [
  ocpp2(OCPP_CallAction.GetBaseReport, 'GetBaseReportRequestSchema'),
  GetCustomReportEndpoint,
  GetMonitoringReportEndpoint,
  ocpp2(OCPP_CallAction.GetLog, 'GetLogRequestSchema'),
  ocpp2(OCPP_CallAction.CustomerInformation, 'CustomerInformationRequestSchema'),
] satisfies ReadonlyArray<MessageEndpointClass>;
