// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type OcppRequest,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, Message } from '@citrineos/base';
import { SecurityEventNotificationRequestOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/testContainer.js';
import { aSecurityEventNotificationRequest } from '@test/dal/providers/SecurityEvent.js';

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

describe('SecurityEventNotificationRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let handler: SecurityEventNotificationRequestOcpp2Handler;
  let securityEventRepository: { createByStationId: ReturnType<typeof vi.fn> };
  let ocppSender: ReturnType<typeof makeMockOcppSender>;

  beforeEach(() => {
    vi.clearAllMocks();

    securityEventRepository = { createByStationId: vi.fn().mockResolvedValue({ id: 1 }) };
    ocppSender = makeMockOcppSender();

    handler = new SecurityEventNotificationRequestOcpp2Handler({
      logger,
      ocppSender,
      securityEventRepository,
    });
  });

  it('persists and acknowledges a standard (listed) security event type without logging a warning', async () => {
    const payload = aSecurityEventNotificationRequest({ type: 'SecurityLogWasCleared' });

    await handler.handle(aSecurityEventMessage(payload));

    expect(securityEventRepository.createByStationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      payload,
      STATION_ID,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns but still persists and acknowledges an unlisted security event type', async () => {
    const payload = aSecurityEventNotificationRequest({ type: 'InvalidCentralSystemCertificate' });

    await handler.handle(aSecurityEventMessage(payload));

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('unknown security event type'),
      'InvalidCentralSystemCertificate',
    );
    expect(securityEventRepository.createByStationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      payload,
      STATION_ID,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalled();
  });
});
