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
import { DiagnosticsStatusNotificationRequestOcpp16Handler } from '@handlers/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

const STATION_ID = 'station-001';

function aDiagnosticsStatusNotificationMessage(
  payload: OCPP1_6.DiagnosticsStatusNotificationRequest,
): Message<OCPP1_6.DiagnosticsStatusNotificationRequest> {
  return new Message(
    MessageOrigin.ChargingStation,
    EventGroup.Transactions,
    OCPP_CallAction.DiagnosticsStatusNotification,
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

describe('DiagnosticsStatusNotificationRequestOcpp16Handler', () => {
  const { container, logger } = createTestContainer();
  let handler: DiagnosticsStatusNotificationRequestOcpp16Handler;
  let ocppSender: { sendCallResultWithMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    ocppSender = {
      sendCallResultWithMessage: vi.fn().mockResolvedValue({ success: true }),
    };

    handler = getTestInstance(container, DiagnosticsStatusNotificationRequestOcpp16Handler, {
      ocppSender,
    });
  });

  it('acknowledges the request with an empty response', async () => {
    const message = aDiagnosticsStatusNotificationMessage({
      status: OCPP1_6.DiagnosticsStatusNotificationRequestStatus.Uploaded,
    });

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledTimes(1);
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, {});
  });

  it('logs the received request and the sent response', async () => {
    const message = aDiagnosticsStatusNotificationMessage({
      status: OCPP1_6.DiagnosticsStatusNotificationRequestStatus.Idle,
    });

    await handler.handle(message);

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('DiagnosticsStatusNotificationRequest'),
      message,
      undefined,
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('DiagnosticsStatusNotificationResponse'),
      { success: true },
    );
  });
});
