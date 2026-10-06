// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TENANT_ID, Message } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
} from '@citrineos/types';
import { SecurityEventNotificationRequestOcpp16Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender, mockDeps } from '@test/test-container.js';

const STATION_ID = 'station-001';

function aSecurityEventMessage(
  payload: OCPP1_6.SecurityEventNotificationRequest,
): Message<OCPP1_6.SecurityEventNotificationRequest> {
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
    'ocpp1.6',
  );
}

describe('SecurityEventNotificationRequestOcpp16Handler', () => {
  const { logger } = createTestContainer();
  let handler: SecurityEventNotificationRequestOcpp16Handler;
  let securityEventRepository: { createByStationId: ReturnType<typeof vi.fn> };
  let ocppSender: ReturnType<typeof makeMockOcppSender>;

  beforeEach(() => {
    vi.clearAllMocks();

    securityEventRepository = { createByStationId: vi.fn().mockResolvedValue({ id: 1 }) };
    ocppSender = makeMockOcppSender();

    handler = new SecurityEventNotificationRequestOcpp16Handler(
      mockDeps<typeof SecurityEventNotificationRequestOcpp16Handler>({
        logger,
        ocppSender,
        securityEventRepository,
      }),
    );
  });

  it('persists a listed security event and acknowledges with an empty response', async () => {
    const payload = {
      type: 'StartupOfTheDevice',
      timestamp: new Date().toISOString(),
      techInfo: 'boot',
    };
    const message = aSecurityEventMessage(payload);

    await handler.handle(message);

    expect(securityEventRepository.createByStationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      payload,
      STATION_ID,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns but still persists and acknowledges an unlisted security event type', async () => {
    const payload = { type: 'VendorSpecificEvent', timestamp: new Date().toISOString() };

    await handler.handle(aSecurityEventMessage(payload));

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('unknown security event type'),
      'VendorSpecificEvent',
    );
    expect(securityEventRepository.createByStationId).toHaveBeenCalledTimes(1);
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledTimes(1);
  });
});
