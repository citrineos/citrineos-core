// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  createIdentifier,
  type IMessageHandler,
  type IMessageSender,
  RequestBuilder,
} from '@citrineos/base';
import type { IChargingStationRepository } from '@citrineos/dal';
import {
  type CallEvent,
  CallEventOutcome,
  ErrorCode,
  isCallEvent,
  EventGroup,
  MessageOrigin,
  MessageTypeId,
  OCPP_CallAction,
  type OcppRequest,
  OCPPVersion,
  RetryMessageError,
  type SystemConfig,
} from '@citrineos/types';
import { MessageRouterImpl } from '@modules/ocpp-router/router.js';
import type { CallbackUrlNotifier } from '@modules/ocpp-router/callback-url-notifier.js';
import { MemoryCache } from '@citrineos/base';
import { ConnectionNotFoundError, type MessagesExchangeSink } from '@/transport/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import {
  aMockDeadLetterPublisher,
  aMockReemitter,
  type MockDeadLetterPublisher,
  type MockReemitter,
} from '../../providers/rabbit-mq-provider.js';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

const TENANT_ID = 1;
const STATION_ID = 'CS001';
const IDENTIFIER = createIdentifier(TENANT_ID, STATION_ID);
const PROTOCOL = OCPPVersion.OCPP2_0_1;
const ACTION = OCPP_CallAction.GetBaseReport;
const PAYLOAD = { requestId: 1, reportBase: 'FullInventory' } as unknown as OcppRequest;

describe('MessageRouterImpl with a MemoryCache', () => {
  const { container } = createTestContainer();
  let networkHook: ReturnType<typeof vi.fn>;
  let reemitter: MockReemitter;
  let deadLetterPublisher: MockDeadLetterPublisher;
  let messagesExchangeSink: { record: Mock<MessagesExchangeSink['record']> };
  let router: MessageRouterImpl;

  function aRouter(timeouts: Partial<SystemConfig['timeouts']> = {}): MessageRouterImpl {
    return getTestInstance(container, MessageRouterImpl, {
      config: {
        ocpp: { maxPendingCallsPerStation: 5 },
        timeouts: {
          maxCallLengthSeconds: 30,
          maxCachingSeconds: 60,
          staleCallMaxAgeSeconds: 40,
          ...timeouts,
        },
      } as unknown as SystemConfig,
      cache: new MemoryCache(),
      routerSender: {
        send: vi.fn().mockResolvedValue({ success: true }),
        sendRequest: vi.fn().mockResolvedValue({ success: true }),
        sendResponse: vi.fn().mockResolvedValue({ success: true }),
        shutdown: vi.fn().mockResolvedValue(undefined),
      } as unknown as IMessageSender,
      routerHandler: {
        subscribe: vi.fn().mockResolvedValue(true),
        unsubscribe: vi.fn().mockResolvedValue(true),
        shutdown: vi.fn().mockResolvedValue(undefined),
      } as unknown as IMessageHandler,
      messagesExchangeSink,
      callbackUrlNotifier: {
        notify: vi.fn().mockResolvedValue(undefined),
      } as unknown as CallbackUrlNotifier,
      networkHook,
      ocppValidator: undefined,
      chargingStationRepository: {
        updateChargingStationTimestamp: vi.fn().mockResolvedValue(undefined),
        setChargingStationIsOnlineAndOCPPVersion: vi.fn().mockResolvedValue(undefined),
        readChargingStationByOcppConnectionName: vi.fn().mockResolvedValue(undefined),
      } as unknown as IChargingStationRepository,
      reemitter,
      deadLetterPublisher,
    });
  }

  beforeEach(() => {
    networkHook = vi.fn().mockResolvedValue(undefined);
    reemitter = aMockReemitter();
    deadLetterPublisher = aMockDeadLetterPublisher();
    messagesExchangeSink = { record: vi.fn().mockResolvedValue({ delivered: true }) };
    router = aRouter();
    vi.spyOn(router as any, '_validateCallResult').mockReturnValue({ isValid: true });
  });

  afterEach(() => {
    vi.useRealTimers();
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

  // The station has maxCallLengthSeconds (30 here) to answer a Call before it is reported as timed out.
  describe('Call outcome events', () => {
    function callEvents(): CallEvent[] {
      return messagesExchangeSink.record.mock.calls.map(([event]) => event).filter(isCallEvent);
    }

    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('publishes a timeout once the station leaves a sent Call unanswered', async () => {
      await sendCall('call-1');

      await vi.advanceTimersByTimeAsync(29_999);
      expect(callEvents()).toEqual([]);

      await vi.advanceTimersByTimeAsync(1);
      expect(callEvents()).toEqual([
        {
          kind: 'call',
          tenantId: TENANT_ID,
          ocppConnectionName: STATION_ID,
          outcome: CallEventOutcome.Timeout,
          correlationId: 'call-1',
          action: ACTION,
          protocol: PROTOCOL,
          timestamp: expect.any(String),
        },
      ]);
    });

    it('waits for the configured maxCallLengthSeconds', async () => {
      router = aRouter({ maxCallLengthSeconds: 5 });

      await sendCall('call-1');
      await vi.advanceTimersByTimeAsync(5_000);

      expect(callEvents().map((event) => event.outcome)).toEqual([CallEventOutcome.Timeout]);
    });

    it('publishes nothing for a Call the station answers with a CallResult in time', async () => {
      await sendCall('call-1');
      await router.onMessage(
        IDENTIFIER,
        JSON.stringify([MessageTypeId.CallResult, 'call-1', {}]),
        new Date(),
        PROTOCOL,
      );

      await vi.advanceTimersByTimeAsync(60_000);

      expect(callEvents()).toEqual([]);
    });

    it('publishes nothing for a Call the station answers with a CallError in time', async () => {
      await sendCall('call-1');
      await router.onMessage(
        IDENTIFIER,
        JSON.stringify([MessageTypeId.CallError, 'call-1', ErrorCode.InternalError, 'boom', {}]),
        new Date(),
        PROTOCOL,
      );

      await vi.advanceTimersByTimeAsync(60_000);

      expect(callEvents()).toEqual([]);
    });

    it('still times out a Call when the station answers a different one', async () => {
      await sendCall('call-1');
      await router.onMessage(
        IDENTIFIER,
        JSON.stringify([MessageTypeId.CallResult, 'other', {}]),
        new Date(),
        PROTOCOL,
      );

      await vi.advanceTimersByTimeAsync(30_000);

      expect(callEvents().map((event) => event.correlationId)).toEqual(['call-1']);
    });

    it('publishes send_failed, and arms no timeout, when the Call could not be written', async () => {
      networkHook.mockRejectedValueOnce(new Error('connection lost'));

      await sendCall('call-1');
      await vi.advanceTimersByTimeAsync(60_000);

      expect(callEvents()).toEqual([
        expect.objectContaining({
          tenantId: TENANT_ID,
          ocppConnectionName: STATION_ID,
          outcome: CallEventOutcome.SendFailed,
          correlationId: 'call-1',
          action: ACTION,
          protocol: PROTOCOL,
        }),
      ]);
    });

    it('publishes no timeout once shut down', async () => {
      await sendCall('call-1');

      await router.shutdown();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(callEvents()).toEqual([]);
    });
  });

  // OCPP allows one outstanding CSMS Call per station; the rest wait in the router, in order.
  describe('Calls waiting behind the outstanding one', () => {
    function aCall(correlationId: string, staleAfterSeconds?: number) {
      const call = RequestBuilder.buildCall(
        STATION_ID,
        correlationId,
        TENANT_ID,
        ACTION,
        PAYLOAD,
        EventGroup.Reporting,
        MessageOrigin.ChargingStationManagementSystem,
        PROTOCOL,
      );
      if (staleAfterSeconds !== undefined) {
        call.context.staleAfterSeconds = staleAfterSeconds;
      }
      return call;
    }

    function sentCorrelationIds(): string[] {
      return networkHook.mock.calls.map(([, frame]) => JSON.parse(frame as string)[1]);
    }

    function answer(correlationId: string) {
      return router.onMessage(
        IDENTIFIER,
        JSON.stringify([MessageTypeId.CallResult, correlationId, {}]),
        new Date(),
        PROTOCOL,
      );
    }

    async function settle() {
      await vi.advanceTimersByTimeAsync(0);
    }

    beforeEach(async () => {
      vi.useFakeTimers();
      await router.registerConnection(TENANT_ID, STATION_ID, PROTOCOL);
    });

    it('sends a waiting Call once the station answers the outstanding one', async () => {
      await router.handle(aCall('call-1'));
      await router.handle(aCall('call-2'));
      expect(sentCorrelationIds()).toEqual(['call-1']);

      await answer('call-1');
      await settle();

      expect(sentCorrelationIds()).toEqual(['call-1', 'call-2']);
    });

    it('sends waiting Calls in the order they arrived', async () => {
      await router.handle(aCall('call-1'));
      await router.handle(aCall('call-2'));
      await router.handle(aCall('call-3'));

      await answer('call-1');
      await settle();
      await answer('call-2');
      await settle();

      expect(sentCorrelationIds()).toEqual(['call-1', 'call-2', 'call-3']);
    });

    it('sends a waiting Call once the outstanding one times out unanswered', async () => {
      await router.handle(aCall('call-1'));
      await router.handle(aCall('call-2'));

      await vi.advanceTimersByTimeAsync(30_000);

      expect(sentCorrelationIds()).toEqual(['call-1', 'call-2']);
    });

    it('dead-letters a waiting Call that went stale instead of sending it', async () => {
      await router.handle(aCall('call-1'));
      const willGoStale = aCall('call-2', 5);
      await router.handle(willGoStale);

      await vi.advanceTimersByTimeAsync(6_000);
      await answer('call-1');
      await settle();

      expect(sentCorrelationIds()).toEqual(['call-1']);
      expect(deadLetterPublisher.publishMessage).toHaveBeenCalledWith(
        willGoStale,
        'stale',
        'router',
      );
    });

    it('drops a second delivery of the Call that is already outstanding', async () => {
      await router.handle(aCall('call-1'));
      await router.handle(aCall('call-1'));

      await answer('call-1');
      await settle();

      expect(sentCorrelationIds()).toEqual(['call-1']);
    });

    it('re-emits waiting Calls, oldest first, when the station disconnects', async () => {
      await router.handle(aCall('call-1'));
      const second = aCall('call-2');
      const third = aCall('call-3');
      await router.handle(second);
      await router.handle(third);

      await router.deregisterConnection(TENANT_ID, STATION_ID);

      expect(reemitter.reemit.mock.calls.map(([message]) => message)).toEqual([second, third]);
      expect(sentCorrelationIds()).toEqual(['call-1']);
    });

    it('dead-letters Calls beyond maxPendingCallsPerStation instead of queueing them', async () => {
      await router.handle(aCall('call-0'));
      for (let n = 1; n <= 5; n++) {
        await router.handle(aCall(`call-${n}`));
      }
      const overflow = aCall('call-6');

      await router.handle(overflow);

      expect(deadLetterPublisher.publishMessage).toHaveBeenCalledTimes(1);
      expect(deadLetterPublisher.publishMessage).toHaveBeenCalledWith(
        overflow,
        'overflow',
        'router',
      );
    });

    it('re-emits a waiting Call the station left before it could be sent', async () => {
      await router.handle(aCall('call-1'));
      const waiting = aCall('call-2');
      await router.handle(waiting);
      networkHook.mockRejectedValueOnce(new ConnectionNotFoundError(IDENTIFIER));

      await answer('call-1');
      await settle();

      expect(reemitter.reemit).toHaveBeenCalledWith(waiting);
    });

    it('dead-letters waiting Calls on shutdown', async () => {
      await router.handle(aCall('call-1'));
      const waiting = aCall('call-2');
      await router.handle(waiting);

      await router.shutdown();

      expect(deadLetterPublisher.publishMessage).toHaveBeenCalledWith(
        waiting,
        'shutdown',
        'router',
      );
      expect(reemitter.shutdown).toHaveBeenCalled();
    });
  });
});
