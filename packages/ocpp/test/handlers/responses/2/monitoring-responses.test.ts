// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppResponse,
  ChargingStationSequenceTypeEnum,
  EventGroup,
  GenericDeviceModelStatusEnum,
  GenericStatusEnum,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IDeviceModelRepository, IVariableMonitoringRepository } from '@citrineos/dal';
import {
  ClearVariableMonitoringResponseOcpp2Handler,
  GetMonitoringReportResponseOcpp2Handler,
  GetVariablesResponseOcpp2Handler,
  SetMonitoringBaseResponseOcpp2Handler,
  SetMonitoringLevelResponseOcpp2Handler,
  SetVariableMonitoringResponseOcpp2Handler,
} from '@handlers/index.js';
import type { MonitoringService } from '@modules/monitoring/monitoring-service.js';
import type { IdGenerator } from '@util/index.js';
import { createTestContainer, getTestInstance, makeMockOcppSender } from '@test/test-container.js';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';
const TIMESTAMP = '2026-01-15T10:00:00.000Z';
const GENERATED_REQUEST_ID = 42;

function makeMessage<T extends OcppResponse>(action: OCPP_CallAction, payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-001',
      timestamp: TIMESTAMP,
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Monitoring,
    action,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<T>;
}

const { container, logger } = createTestContainer();

// Shared container logger accumulates calls across tests; the per-describe mocks
// are created after this hook, so they are unaffected.
beforeEach(() => {
  vi.clearAllMocks();
});

describe('SetMonitoringBaseResponseOcpp2Handler', () => {
  let variableMonitoringRepository: Mocked<IVariableMonitoringRepository>;
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let idGenerator: Mocked<IdGenerator>;

  beforeEach(() => {
    variableMonitoringRepository = {
      rejectAllVariableMonitoringsByStationId: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<IVariableMonitoringRepository>;
    ocppSender = makeMockOcppSender();
    idGenerator = {
      generateRequestId: vi.fn().mockResolvedValue(GENERATED_REQUEST_ID),
    } as unknown as Mocked<IdGenerator>;
  });

  function makeHandler() {
    return getTestInstance(container, SetMonitoringBaseResponseOcpp2Handler, {
      ocppSender,
      variableMonitoringRepository,
      idGenerator,
    });
  }

  it('Accepted rejects all station monitorings then requests a monitoring report', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.SetMonitoringBase, {
        status: GenericDeviceModelStatusEnum.Accepted,
      } as never),
    );

    expect(
      variableMonitoringRepository.rejectAllVariableMonitoringsByStationId,
    ).toHaveBeenCalledTimes(1);
    expect(
      variableMonitoringRepository.rejectAllVariableMonitoringsByStationId,
    ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, OCPP_CallAction.SetVariableMonitoring, STATION);
    expect(idGenerator.generateRequestId).toHaveBeenCalledTimes(1);
    expect(idGenerator.generateRequestId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      ChargingStationSequenceTypeEnum.getMonitoringReport,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
    expect(ocppSender.sendCall).toHaveBeenCalledWith({
      ocppConnectionName: STATION,
      tenantId: DEFAULT_TENANT_ID,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.GetMonitoringReport,
      eventGroup: EventGroup.Monitoring,
      payload: { requestId: GENERATED_REQUEST_ID },
    });
  });

  it('Rejected logs the failure with statusInfo and skips reset and report request', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.SetMonitoringBase, {
        status: GenericDeviceModelStatusEnum.Rejected,
        statusInfo: { reasonCode: 'NotEnabled', additionalInfo: 'monitoring disabled' },
      } as never),
    );

    expect(
      variableMonitoringRepository.rejectAllVariableMonitoringsByStationId,
    ).not.toHaveBeenCalled();
    expect(idGenerator.generateRequestId).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to set monitoring base.',
      GenericDeviceModelStatusEnum.Rejected,
      'NotEnabled',
      'monitoring disabled',
    );
  });

  it('NotSupported without statusInfo logs undefined details and sends nothing', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.SetMonitoringBase, {
        status: GenericDeviceModelStatusEnum.NotSupported,
      } as never),
    );

    expect(
      variableMonitoringRepository.rejectAllVariableMonitoringsByStationId,
    ).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to set monitoring base.',
      GenericDeviceModelStatusEnum.NotSupported,
      undefined,
      undefined,
    );
  });

  it('repository failure propagates and no GetMonitoringReport call goes out', async () => {
    variableMonitoringRepository.rejectAllVariableMonitoringsByStationId.mockRejectedValue(
      new Error('db down'),
    );
    const handler = makeHandler();

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.SetMonitoringBase, {
          status: GenericDeviceModelStatusEnum.Accepted,
        } as never),
      ),
    ).rejects.toThrow('db down');

    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });
});

describe('SetMonitoringLevelResponseOcpp2Handler', () => {
  // Log-only stub: no sender, no repositories.
  function makeHandler() {
    return getTestInstance(container, SetMonitoringLevelResponseOcpp2Handler, {});
  }

  it('Accepted resolves without logging an error', async () => {
    const handler = makeHandler();

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.SetMonitoringLevel, {
          status: GenericStatusEnum.Accepted,
        } as never),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('Rejected logs status with statusInfo details', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.SetMonitoringLevel, {
        status: GenericStatusEnum.Rejected,
        statusInfo: { reasonCode: 'LevelTooHigh', additionalInfo: 'max 5' },
      } as never),
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to set monitoring level.',
      GenericStatusEnum.Rejected,
      'LevelTooHigh',
      'max 5',
    );
  });
});

describe('SetVariableMonitoringResponseOcpp2Handler', () => {
  let variableMonitoringRepository: Mocked<IVariableMonitoringRepository>;

  beforeEach(() => {
    variableMonitoringRepository = {
      updateResultByStationId: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<IVariableMonitoringRepository>;
  });

  function makeHandler() {
    return getTestInstance(container, SetVariableMonitoringResponseOcpp2Handler, {
      variableMonitoringRepository,
    });
  }

  const resultAccepted = {
    id: 11,
    status: 'Accepted',
    type: 'UpperThreshold',
    severity: 3,
    component: { name: 'EVSE' },
    variable: { name: 'Temperature' },
  };
  const resultRejected = {
    id: 12,
    status: 'Rejected',
    type: 'Delta',
    severity: 5,
    component: { name: 'Connector' },
    variable: { name: 'Voltage' },
  };

  it('writes each setMonitoringResult entry against the station in order', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.SetVariableMonitoring, {
        setMonitoringResult: [resultAccepted, resultRejected],
      } as never),
    );

    expect(variableMonitoringRepository.updateResultByStationId).toHaveBeenCalledTimes(2);
    expect(variableMonitoringRepository.updateResultByStationId).toHaveBeenNthCalledWith(
      1,
      DEFAULT_TENANT_ID,
      resultAccepted,
      STATION,
    );
    expect(variableMonitoringRepository.updateResultByStationId).toHaveBeenNthCalledWith(
      2,
      DEFAULT_TENANT_ID,
      resultRejected,
      STATION,
    );
  });

  it('stops at the first failing result and rethrows', async () => {
    variableMonitoringRepository.updateResultByStationId.mockRejectedValueOnce(
      new Error('constraint violation'),
    );
    const handler = makeHandler();

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.SetVariableMonitoring, {
          setMonitoringResult: [resultAccepted, resultRejected],
        } as never),
      ),
    ).rejects.toThrow('constraint violation');

    expect(variableMonitoringRepository.updateResultByStationId).toHaveBeenCalledTimes(1);
  });
});

describe('ClearVariableMonitoringResponseOcpp2Handler', () => {
  let monitoringService: Mocked<MonitoringService>;

  beforeEach(() => {
    monitoringService = {
      processClearMonitoringResult: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<MonitoringService>;
  });

  function makeHandler() {
    return getTestInstance(container, ClearVariableMonitoringResponseOcpp2Handler, {
      monitoringService,
    });
  }

  it('forwards the clearMonitoringResult list to the monitoring service', async () => {
    const clearMonitoringResult = [
      { id: 5, status: 'Accepted' },
      { id: 6, status: 'NotFound' },
    ];
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.ClearVariableMonitoring, {
        clearMonitoringResult,
      } as never),
    );

    expect(monitoringService.processClearMonitoringResult).toHaveBeenCalledTimes(1);
    expect(monitoringService.processClearMonitoringResult).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      clearMonitoringResult,
    );
  });

  it('service failure propagates to the caller', async () => {
    monitoringService.processClearMonitoringResult.mockRejectedValue(new Error('service down'));
    const handler = makeHandler();

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.ClearVariableMonitoring, {
          clearMonitoringResult: [{ id: 5, status: 'Accepted' }],
        } as never),
      ),
    ).rejects.toThrow('service down');
  });
});

describe('GetMonitoringReportResponseOcpp2Handler', () => {
  // Log-only stub: the report content arrives via NotifyMonitoringReport, not here.
  function makeHandler() {
    return getTestInstance(container, GetMonitoringReportResponseOcpp2Handler, {});
  }

  it('Accepted resolves without logging an error', async () => {
    const handler = makeHandler();

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.GetMonitoringReport, {
          status: GenericDeviceModelStatusEnum.Accepted,
        } as never),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('Rejected logs the failure with statusInfo details', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.GetMonitoringReport, {
        status: GenericDeviceModelStatusEnum.Rejected,
        statusInfo: { reasonCode: 'NoMonitors', additionalInfo: 'nothing configured' },
      } as never),
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to get monitoring report.',
      GenericDeviceModelStatusEnum.Rejected,
      'NoMonitors',
      'nothing configured',
    );
  });

  it('NotSupported without statusInfo logs undefined details', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.GetMonitoringReport, {
        status: GenericDeviceModelStatusEnum.NotSupported,
      } as never),
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to get monitoring report.',
      GenericDeviceModelStatusEnum.NotSupported,
      undefined,
      undefined,
    );
  });
});

describe('GetVariablesResponseOcpp2Handler', () => {
  let deviceModelRepository: Mocked<IDeviceModelRepository>;

  beforeEach(() => {
    deviceModelRepository = {
      createOrUpdateByGetVariablesResultAndStationId: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<IDeviceModelRepository>;
  });

  function makeHandler() {
    return getTestInstance(container, GetVariablesResponseOcpp2Handler, {
      deviceModelRepository,
    });
  }

  it('persists the getVariableResult list with the message timestamp', async () => {
    const getVariableResult = [
      {
        attributeStatus: 'Accepted',
        attributeValue: '240',
        component: { name: 'Connector' },
        variable: { name: 'MaxVoltage' },
      },
    ];
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.GetVariables, {
        getVariableResult,
      } as never),
    );

    expect(
      deviceModelRepository.createOrUpdateByGetVariablesResultAndStationId,
    ).toHaveBeenCalledTimes(1);
    expect(
      deviceModelRepository.createOrUpdateByGetVariablesResultAndStationId,
    ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, getVariableResult, STATION, TIMESTAMP);
  });

  it('repository failure propagates to the caller', async () => {
    deviceModelRepository.createOrUpdateByGetVariablesResultAndStationId.mockRejectedValue(
      new Error('db down'),
    );
    const handler = makeHandler();

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.GetVariables, {
          getVariableResult: [],
        } as never),
      ),
    ).rejects.toThrow('db down');
  });
});
