// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IVariableMonitoringRepository } from '@citrineos/dal';
import { SetVariableMonitoringResponseOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';

function anAcceptedResult(
  id: number,
  type: OCPP2_0_1.MonitorEnumType,
): OCPP2_0_1.SetMonitoringResultType {
  return {
    id,
    status: OCPP2_0_1.SetMonitoringStatusEnumType.Accepted,
    type,
    severity: 4,
    component: { name: 'EVSE' },
    variable: { name: 'Power' },
  };
}

function aResponse(
  setMonitoringResult: OCPP2_0_1.SetMonitoringResultType[],
): IMessage<OCPP2_0_1.SetVariableMonitoringResponse> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload: { setMonitoringResult },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Monitoring,
    action: OCPP_CallAction.SetVariableMonitoring,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<OCPP2_0_1.SetVariableMonitoringResponse>;
}

describe('SetVariableMonitoringResponseOcpp2Handler', () => {
  const { container } = createTestContainer();
  let variableMonitoringRepository: Mocked<IVariableMonitoringRepository>;

  beforeEach(() => {
    variableMonitoringRepository = {
      updateResultByStationId: vi.fn(),
    } as unknown as Mocked<IVariableMonitoringRepository>;
  });

  it('applies the remaining results when one cannot be matched', async () => {
    const unmatched = anAcceptedResult(11, OCPP2_0_1.MonitorEnumType.UpperThreshold);
    const matched = anAcceptedResult(12, OCPP2_0_1.MonitorEnumType.LowerThreshold);
    variableMonitoringRepository.updateResultByStationId
      .mockRejectedValueOnce(new Error('Unable to update set monitoring result'))
      .mockResolvedValueOnce({} as never);
    const handler = getTestInstance(container, SetVariableMonitoringResponseOcpp2Handler, {
      variableMonitoringRepository,
    });

    await handler.handle(aResponse([unmatched, matched]));

    expect(variableMonitoringRepository.updateResultByStationId).toHaveBeenLastCalledWith(
      DEFAULT_TENANT_ID,
      matched,
      STATION,
    );
  });
});
