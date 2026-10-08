// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ErrorCode,
  FrameDirection,
  MessageOrigin,
  MessageTypeId,
  OCPP_CallAction,
} from '@citrineos/types';
import { OcppCallFailureAlertProcessor } from '@modules/messages/processors/ocpp-call-failure-alert-processor.js';
import { aFrameEvent, TENANT_ID } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { UNKNOWN_ACTION } from '@/transport/metrics.js';

const STATION_DB_ID = 17;
const RESPONDED_AT = '2026-03-04T05:06:07.000Z';

describe('OcppCallFailureAlertProcessor', () => {
  const { container } = createTestContainer();
  let networkAlertService: { recordCallFailure: Mock };
  let processor: OcppCallFailureAlertProcessor;

  function aCallError(origin: MessageOrigin) {
    return aFrameEvent({
      type: MessageTypeId.CallError,
      origin,
      direction:
        origin === MessageOrigin.ChargingStation ? FrameDirection.Inbound : FrameDirection.Outbound,
      correlationId: 'corr-1',
      action: undefined,
      payload: {
        errorCode: ErrorCode.InternalError,
        errorDescription: 'boom',
        errorDetails: {},
      },
      timestamp: RESPONDED_AT,
    });
  }

  function aCallResult() {
    return aFrameEvent({
      type: MessageTypeId.CallResult,
      origin: MessageOrigin.ChargingStation,
      correlationId: 'corr-2',
      action: undefined,
      payload: {},
      timestamp: RESPONDED_AT,
    });
  }

  beforeEach(() => {
    networkAlertService = { recordCallFailure: vi.fn().mockResolvedValue(undefined) };
    processor = getTestInstance(container, OcppCallFailureAlertProcessor, {
      networkAlertService,
    });
  });

  it('should not be critical, so a failure does not re-run the persist insert', () => {
    expect(processor.critical).toBe(false);
    expect(processor.name).toBe('ocpp-call-failure-alert');
  });

  describe('CallError', () => {
    it.each([MessageOrigin.ChargingStation, MessageOrigin.ChargingStationManagementSystem])(
      'should record a CallError sent by %s against the persisted row',
      async (origin) => {
        await processor.process(aCallError(origin), {
          stationId: STATION_DB_ID,
          persistedId: 55,
          persistedAction: OCPP_CallAction.GetBaseReport,
        });

        expect(networkAlertService.recordCallFailure).toHaveBeenCalledExactlyOnceWith({
          tenantId: TENANT_ID,
          stationId: STATION_DB_ID,
          reason: 'CallError',
          origin,
          action: OCPP_CallAction.GetBaseReport,
          correlationId: 'corr-1',
          errorCode: ErrorCode.InternalError,
          occurredAt: RESPONDED_AT,
          ocppMessageId: 55,
        });
      },
    );

    it('should fall back to the unknown action when correlation resolved none', async () => {
      await processor.process(aCallError(MessageOrigin.ChargingStation), {
        stationId: STATION_DB_ID,
        persistedId: 55,
      });

      expect(networkAlertService.recordCallFailure).toHaveBeenCalledWith(
        expect.objectContaining({ action: UNKNOWN_ACTION }),
      );
      expect(UNKNOWN_ACTION).toBe('unknown');
    });
  });

  describe('frames it ignores', () => {
    it('should record nothing for an unparsed frame', async () => {
      await processor.process(
        aFrameEvent({
          parsed: false,
          type: undefined,
          payload: undefined,
          frame: undefined,
          raw: 'garbage',
        }),
        { stationId: STATION_DB_ID, persistedId: 1 },
      );

      expect(networkAlertService.recordCallFailure).not.toHaveBeenCalled();
    });

    it.each([
      ['CallError', () => aCallError(MessageOrigin.ChargingStation)],
      ['CallResult', () => aCallResult()],
    ])('should record nothing for a %s linked to no station', async (_label, event) => {
      await processor.process(event(), { persistedId: 1 });

      expect(networkAlertService.recordCallFailure).not.toHaveBeenCalled();
    });

    it('should record nothing for a CallResult, however long it took', async () => {
      await processor.process(aCallResult(), { stationId: STATION_DB_ID, persistedId: 1 });

      expect(networkAlertService.recordCallFailure).not.toHaveBeenCalled();
    });

    it('should record nothing for a Call', async () => {
      await processor.process(aFrameEvent({ type: MessageTypeId.Call }), {
        stationId: STATION_DB_ID,
        persistedId: 1,
      });

      expect(networkAlertService.recordCallFailure).not.toHaveBeenCalled();
    });
  });
});
