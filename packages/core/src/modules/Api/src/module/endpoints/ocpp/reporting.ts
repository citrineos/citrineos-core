// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, passthroughMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { GetCustomReportEndpoint } from './reporting/GetCustomReportEndpoint.js';
import { GetMonitoringReportEndpoint } from './reporting/GetMonitoringReportEndpoint.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';

const ocpp16 = (action: OCPP_CallAction, bodySchema: object) =>
  passthroughMessageEndpoint({
    action,
    protocols: [OCPPVersion.OCPP1_6],
    endpointPrefixConfigKey: 'reporting',
    eventGroup: EventGroup.Reporting,
    bodySchema: () => bodySchema,
  });

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  passthroughMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    endpointPrefixConfigKey: 'reporting',
    eventGroup: EventGroup.Reporting,
    bodySchema: ocpp2Schema(schemaName),
  });

export const REPORTING_MESSAGE_ENDPOINTS = [
  ocpp16(OCPP_CallAction.GetDiagnostics, OCPP1_6.GetDiagnosticsRequestSchema),
  ocpp2(OCPP_CallAction.GetBaseReport, 'GetBaseReportRequestSchema'),
  GetCustomReportEndpoint,
  GetMonitoringReportEndpoint,
  ocpp2(OCPP_CallAction.GetLog, 'GetLogRequestSchema'),
  ocpp2(OCPP_CallAction.CustomerInformation, 'CustomerInformationRequestSchema'),
] satisfies ReadonlyArray<MessageEndpointClass>;
