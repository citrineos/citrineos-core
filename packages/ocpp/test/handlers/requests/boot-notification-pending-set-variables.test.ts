// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type ICache, type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type SystemConfig,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { BootNotificationRequestOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';
import { describe, expect, it, vi } from 'vitest';

const STATION_ID = 'station-001';

const SET_VARIABLE_DATA: OCPP2_0_1.SetVariableDataType = {
  attributeType: OCPP2_0_1.AttributeEnumType.Actual,
  attributeValue: '30',
  component: { name: 'OCPPCommCtrlr' },
  variable: { name: 'HeartbeatInterval' },
};

function makeMessage(): IMessage<OCPP2_0_1.BootNotificationRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload: {
      reason: OCPP2_0_1.BootReasonEnumType.PowerUp,
      chargingStation: { vendorName: 'Voltempo', model: 'Hypercharger' },
    },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Configuration,
    action: OCPP_CallAction.BootNotification,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<OCPP2_0_1.BootNotificationRequest>;
}

function makeHandler(pendingBootSetVariables: object[]) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();
  const cache = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    onChange: vi.fn().mockResolvedValue(
      JSON.stringify({
        setVariableResult: [
          {
            attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Accepted,
            component: SET_VARIABLE_DATA.component,
            variable: SET_VARIABLE_DATA.variable,
          },
        ],
      }),
    ),
  };
  const bootNotificationService = {
    createBootNotificationResponse: vi.fn().mockResolvedValue({
      status: OCPP2_0_1.RegistrationStatusEnumType.Pending,
      currentTime: new Date().toISOString(),
      interval: 60,
    }),
    cacheChargerActionsPermissions: vi.fn().mockResolvedValue(undefined),
    updateBootConfig: vi
      .fn()
      .mockResolvedValue({ id: 1, getBaseReportOnPending: false, pendingBootSetVariables }),
    updateBoot: vi.fn().mockResolvedValue(undefined),
  };
  const deviceModelRepository = {
    readAllSetVariableByStationId: vi.fn().mockResolvedValue([SET_VARIABLE_DATA]),
  };

  const handler = new BootNotificationRequestOcpp2Handler({
    logger,
    ocppSender,
    cache: cache as unknown as ICache,
    config: {
      timeouts: { maxCachingSeconds: 10 },
      ocpp: { getBaseReportOnPending: false, autoAccept: false },
    } as unknown as SystemConfig,
    bootNotificationService: bootNotificationService as any,
    configurationDeviceModelService: {
      updateDeviceModel: vi.fn(),
      getItemsPerMessageSetVariablesByStationId: vi.fn().mockResolvedValue(undefined),
    } as any,
    deviceModelRepository: deviceModelRepository as any,
    chargingStationRepository: {
      doesChargingStationExistByOcppConnectionName: vi.fn().mockResolvedValue(true),
      createOrUpdateChargingStation: vi.fn().mockResolvedValue(undefined),
    } as any,
  });

  return { handler, ocppSender, deviceModelRepository };
}

describe('BootNotification 2.x pending boot SetVariables', () => {
  it('sends the boot config pending SetVariables when the boot is Pending', async () => {
    const { handler, ocppSender } = makeHandler([{ id: 7 }]);

    await handler.handle(makeMessage());

    expect(ocppSender.sendCall).toHaveBeenCalledWith(
      expect.objectContaining({
        action: OCPP_CallAction.SetVariables,
        payload: { setVariableData: [SET_VARIABLE_DATA] },
      }),
    );
  });

  it('sends no SetVariables when the boot config has none pending', async () => {
    const { handler, ocppSender, deviceModelRepository } = makeHandler([]);

    await handler.handle(makeMessage());

    expect(deviceModelRepository.readAllSetVariableByStationId).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: OCPP_CallAction.SetVariables }),
    );
  });
});
