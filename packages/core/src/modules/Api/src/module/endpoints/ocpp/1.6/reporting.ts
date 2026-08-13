// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, forwardMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';

const ocpp16 = (action: OCPP_CallAction, bodySchema: object) =>
  forwardMessageEndpoint({
    action,
    protocols: [OCPPVersion.OCPP1_6],
    eventGroup: EventGroup.Reporting,
    bodySchema: () => bodySchema,
  });

export const REPORTING_MESSAGE_ENDPOINTS = [
  ocpp16(OCPP_CallAction.GetDiagnostics, OCPP1_6.GetDiagnosticsRequestSchema),
] satisfies ReadonlyArray<MessageEndpointClass>;
