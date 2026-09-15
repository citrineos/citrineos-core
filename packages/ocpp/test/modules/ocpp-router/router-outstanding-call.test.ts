// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { createIdentifier, type IMessageHandler, type IMessageSender } from '@citrineos/base';
import type { IChargingStationRepository } from '@citrineos/dal';
import {
  ErrorCode,
  MessageTypeId,
  OCPP_CallAction,
  type OcppRequest,
  OCPPVersion,
  RetryMessageError,
  type SystemConfig,
} from '@citrineos/types';
import { MessageRouterImpl } from '@modules/ocpp-router/router.js';
import type { CallbackUrlNotifier } from '@modules/ocpp-router/callback-url-notifier.js';
import { MemoryCache } from '@services/cache/memory.js';
import type { MessagesExchangeSink } from '@/transport/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const TENANT_ID = 1;
const STATION_ID = 'CS001';
const IDENTIFIER = createIdentifier(TENANT_ID, STATION_ID);
const PROTOCOL = OCPPVersion.OCPP2_0_1;
const ACTION = OCPP_CallAction.GetBaseReport;
const PAYLOAD = { requestId: 1, reportBase: 'FullInventory' } as unknown as OcppRequest;

describe('MessageRouterImpl with a MemoryCache', () => {
  const { container } = createTestContainer();
  let networkHook: ReturnType<typeof vi.fn>;
  let router: MessageRouterImpl;

  beforeEach(() => {
    networkHook = vi.fn().mockResolvedValue(undefined);
    router = getTestInstance(container, MessageRouterImpl, {
      config: {
        timeouts: { maxCallLengthSeconds: 30, maxCachingSeconds: 60 },
      } as unknown as SystemConfig,
      cache: new MemoryCache(),
      routerSender: {
        send: vi.fn().mockResolvedValue({ success: true }),
        sendRequest: vi.fn().mockResolvedValue({ success: true }),
        sendResponse: vi.fn().mockResolvedValue({ success: true }),
      } as unknown as IMessageSender,
      routerHandler: {
        subscribe: vi.fn().mockResolvedValue(true),
        unsubscribe: vi.fn().mockResolvedValue(true),
      } as unknown as IMessageHandler,
      messagesExchangeSink: {
        record: vi.fn().mockResolvedValue({ delivered: true }),
      } as unknown as MessagesExchangeSink,
      callbackUrlNotifier: {
        notify: vi.fn().mockResolvedValue(undefined),
      } as unknown as CallbackUrlNotifier,
      networkHook,
      ocppValidator: undefined,
      chargingStationRepository: {
        updateChargingStationTimestamp: vi.fn().mockResolvedValue(undefined),
      } as unknown as IChargingStationRepository,
    });
    vi.spyOn(router as any, '_validateCallResult').mockReturnValue({ isValid: true });
  });

  function sendCall(correlationId: string) {
    return router.sendCall(STATION_ID, TENANT_ID, PROTOCOL, ACTION, PAYLOAD, correlationId);
  }

  it('sends only one of two concurrent CALLs to the same station', async () => {
    const results = await Promise.allSettled([sendCall('call-1'), sendCall('call-2')]);

    expect(networkHook).toHaveBeenCalledTimes(1);
    expect(
      results
        .filter((result) => result.status === 'rejected')
        .map((result) => (result as PromiseRejectedResult).reason),
    ).toEqual([expect.any(RetryMessageError)]);
  });

  it('sends the next CALL once the station answers the outstanding one with a CallResult', async () => {
    await sendCall('call-1');
    await router.onMessage(
      IDENTIFIER,
      JSON.stringify([MessageTypeId.CallResult, 'call-1', {}]),
      new Date(),
      PROTOCOL,
    );

    await sendCall('call-2');

    expect(networkHook).toHaveBeenCalledTimes(2);
  });

  it('sends the next CALL once the station answers the outstanding one with a CallError', async () => {
    await sendCall('call-1');
    await router.onMessage(
      IDENTIFIER,
      JSON.stringify([MessageTypeId.CallError, 'call-1', ErrorCode.InternalError, 'boom', {}]),
      new Date(),
      PROTOCOL,
    );

    await sendCall('call-2');

    expect(networkHook).toHaveBeenCalledTimes(2);
  });

  it('sends the next CALL when sending the previous one failed', async () => {
    networkHook.mockRejectedValueOnce(new Error('connection lost'));
    await sendCall('call-1');

    await sendCall('call-2');

    expect(networkHook).toHaveBeenCalledTimes(2);
  });
});
