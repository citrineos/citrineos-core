// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OcppRequest } from '@citrineos/base';
import {
  DEFAULT_TENANT_ID,
  EventGroup,
  Message,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
} from '@citrineos/base';
import { asValue } from 'awilix';
import { ReportingModule } from '@modules/Reporting/src/module/module.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { aSecurityEventNotificationRequest } from '@test/dal/providers/SecurityEvent.js';
import { aSystemConfig } from '@test/modules/Certificates/providers/SystemConfig.js';

const STATION_ID = 'station-001';

function aSecurityEventMessage<T extends OcppRequest>(payload: T): Message<T> {
  return new Message(
    MessageOrigin.ChargingStation,
    EventGroup.Reporting,
    OCPP_CallAction.SecurityEventNotification,
    MessageState.Request,
    {
      correlationId: 'corr-001',
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload,
    'ocpp2.0.1',
  );
}

describe('ReportingModule - SecurityEventNotification handling', () => {
  const { container, logger } = createTestContainer();
  let module: ReportingModule;
  let securityEventRepository: { createByStationId: ReturnType<typeof vi.fn> };
  let sender: { sendResponse: ReturnType<typeof vi.fn>; sendRequest: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    securityEventRepository = { createByStationId: vi.fn().mockResolvedValue({ id: 1 }) };
    sender = {
      sendResponse: vi.fn().mockResolvedValue({ success: true }),
      sendRequest: vi.fn().mockResolvedValue({ success: true }),
    };

    container.register({
      config: asValue(aSystemConfig()),
      cache: asValue({
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(true),
      }),
      sender: asValue({ ...sender, shutdown: vi.fn() }),
      handler: asValue({
        subscribe: vi.fn().mockResolvedValue(true),
        shutdown: vi.fn(),
        set module(_: unknown) {},
      }),
      // undefined lets AbstractModule build a real OCPPValidator, so handle() runs genuine schema validation
      ocppValidator: asValue(undefined),
      deviceModelRepository: asValue({}),
      securityEventRepository: asValue(securityEventRepository),
      variableMonitoringRepository: asValue({}),
      ocppMessageRepository: asValue({}),
      reportingDeviceModelService: asValue({}),
    });

    module = getTestInstance(container, ReportingModule, {});
  });

  it('persists and acknowledges a standard (listed) security event type without logging a warning', async () => {
    const payload = aSecurityEventNotificationRequest({ type: 'SecurityLogWasCleared' });

    await module.handle(aSecurityEventMessage(payload));

    expect(securityEventRepository.createByStationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      payload,
      STATION_ID,
    );
    expect(sender.sendResponse).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns but still persists and acknowledges an unlisted security event type', async () => {
    const payload = aSecurityEventNotificationRequest({ type: 'InvalidCentralSystemCertificate' });

    await module.handle(aSecurityEventMessage(payload));

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('unknown security event type'),
      'InvalidCentralSystemCertificate',
    );
    expect(securityEventRepository.createByStationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      payload,
      STATION_ID,
    );
    expect(sender.sendResponse).toHaveBeenCalled();
  });
});
