// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, forwardMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP_CallAction } from '@citrineos/types';
import { ClearVariableMonitoringEndpoint } from './monitoring/clear-variable-monitoring-endpoint.js';
import { GetVariablesEndpoint } from './monitoring/get-variables-endpoint.js';
import { SetVariableMonitoringEndpoint } from './monitoring/set-variable-monitoring-endpoint.js';
import { SetVariablesEndpoint } from './monitoring/set-variables-endpoint.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  forwardMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Monitoring,
    bodySchema: ocpp2Schema(schemaName),
  });

export const MONITORING_MESSAGE_ENDPOINTS = [
  SetVariableMonitoringEndpoint,
  ClearVariableMonitoringEndpoint,
  ocpp2(OCPP_CallAction.SetMonitoringLevel, 'SetMonitoringLevelRequestSchema'),
  ocpp2(OCPP_CallAction.SetMonitoringBase, 'SetMonitoringBaseRequestSchema'),
  SetVariablesEndpoint,
  GetVariablesEndpoint,
] satisfies ReadonlyArray<MessageEndpointClass>;
