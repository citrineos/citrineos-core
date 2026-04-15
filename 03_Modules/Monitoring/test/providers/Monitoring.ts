// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, MessageOrigin, OCPP2_0_1 } from '@citrineos/base';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil.js';

export const aClearMonitoringResult = (
  updateFunction?: UpdateFunction<OCPP2_0_1.ClearMonitoringResultType>,
): OCPP2_0_1.ClearMonitoringResultType => {
  const clear = {
    status: OCPP2_0_1.ClearMonitoringStatusEnumType.Accepted,
    id: Math.floor(Math.random() * 1000),
  };

  return applyUpdateFunction(clear, updateFunction);
};

export const aSetVariableData = (
  updateFunction?: UpdateFunction<OCPP2_0_1.SetVariableDataType>,
): OCPP2_0_1.SetVariableDataType => {
  const data: OCPP2_0_1.SetVariableDataType = {
    component: { name: 'TestComponent' },
    variable: { name: 'TestVariable' },
    attributeValue: 'test-value',
    attributeType: OCPP2_0_1.AttributeEnumType.Actual,
  };
  return applyUpdateFunction(data, updateFunction);
};

export const aSetVariableResult = (
  updateFunction?: UpdateFunction<OCPP2_0_1.SetVariableResultType>,
): OCPP2_0_1.SetVariableResultType => {
  const result: OCPP2_0_1.SetVariableResultType = {
    component: { name: 'TestComponent' },
    variable: { name: 'TestVariable' },
    attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Accepted,
    attributeType: OCPP2_0_1.AttributeEnumType.Actual,
  };
  return applyUpdateFunction(result, updateFunction);
};

export const aSetVariablesRequest = (
  updateFunction?: UpdateFunction<OCPP2_0_1.SetVariablesRequest>,
): OCPP2_0_1.SetVariablesRequest => {
  const request: OCPP2_0_1.SetVariablesRequest = {
    setVariableData: [aSetVariableData()],
  };
  return applyUpdateFunction(request, updateFunction);
};

export const aSetVariablesResponse = (
  updateFunction?: UpdateFunction<OCPP2_0_1.SetVariablesResponse>,
): OCPP2_0_1.SetVariablesResponse => {
  const response: OCPP2_0_1.SetVariablesResponse = {
    setVariableResult: [aSetVariableResult()],
  };
  return applyUpdateFunction(response, updateFunction);
};

/**
 * Builds the raw OCPP message array as stored in the DB for a SetVariables request.
 * Format: [messageTypeId, correlationId, action, payload]
 */
export const aStoredSetVariablesOcppMessage = (
  correlationId: string,
  setVariableData: OCPP2_0_1.SetVariableDataType[],
  origin: MessageOrigin = MessageOrigin.ChargingStationManagementSystem,
) => ({
  message: [2, correlationId, 'SetVariables', { setVariableData } as OCPP2_0_1.SetVariablesRequest],
  origin,
});

/**
 * Builds a minimal IMessage-shaped object for a SetVariablesResponse, as the handler receives it.
 */
export const aSetVariablesResponseMessage = (
  payload: OCPP2_0_1.SetVariablesResponse,
  overrides: Partial<{
    correlationId: string;
    tenantId: number;
    stationId: string;
    timestamp: string;
  }> = {},
) => ({
  context: {
    correlationId: overrides.correlationId ?? 'corr-default',
    tenantId: overrides.tenantId ?? DEFAULT_TENANT_ID,
    stationId: overrides.stationId ?? 'CS-001',
    timestamp: overrides.timestamp ?? '2025-01-01T00:00:00.000Z',
  },
  payload,
});
