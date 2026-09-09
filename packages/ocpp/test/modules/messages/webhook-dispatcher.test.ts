// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { ISubscriptionRepository, Subscription } from '@citrineos/dal';
import { type FrameEvent, MessageOrigin, MessageTypeId, OCPPVersion } from '@citrineos/types';
import { buildFrameEvent } from '@/transport/index.js';
import { WebhookDispatcher } from '@modules/messages/webhook-dispatcher.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { faker } from '@faker-js/faker';
import { afterEach, beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { aSubscription } from '../ocpp-router/providers/subscription-provider.js';

describe('WebhookDispatcher', () => {
  const { container } = createTestContainer();
  const A_BOOT_NOTIFICATION_CALL = [2, '123', 'BootNotification', {}];
  const A_CALL_RESULT = [3, '123', { status: 'Accepted' }];
  const TIMESTAMP = 'Any timestamp';
  const PROTOCOL = OCPPVersion.OCPP2_0_1;

  const fetch = vi.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
      json: () => Promise.resolve({ status: 'Accepted' }),
    } as Response),
  );
  global.fetch = fetch as unknown as typeof global.fetch;

  let subscriptionRepository: Mocked<ISubscriptionRepository>;
  let webhookDispatcher: WebhookDispatcher;

  beforeEach(() => {
    vi.useFakeTimers();

    subscriptionRepository = {
      readAllByStationId: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<ISubscriptionRepository>;

    webhookDispatcher = getTestInstance(container, WebhookDispatcher, { subscriptionRepository });
  });

  afterEach(() => {
    webhookDispatcher.shutdown();
    fetch.mockClear();
    subscriptionRepository.readAllByStationId.mockReset();
    vi.clearAllTimers();
  });

  describe('register', () => {
    it('should load subscriptions', async () => {
      const subscription = aSubscription();
      givenSubscriptions(subscription);

      await webhookDispatcher.register(subscription.tenantId, subscription.ocppConnectionName);

      expect(subscriptionRepository.readAllByStationId).toBeCalledWith(
        subscription.tenantId,
        subscription.ocppConnectionName,
      );
    });

    it('should send request for subscriptions with enabled onConnect', async () => {
      const subscription = aSubscription({ onConnect: true });
      givenSubscriptions(subscription);

      await webhookDispatcher.register(subscription.tenantId, subscription.ocppConnectionName);

      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(bodyOf(0)).toEqual({
        ocppConnectionName: subscription.ocppConnectionName,
        event: 'connected',
      });
    });

    it('should not send request for subscriptions with disabled onConnect', async () => {
      const subscription = aSubscription({ onConnect: false });
      givenSubscriptions(subscription);

      await webhookDispatcher.register(subscription.tenantId, subscription.ocppConnectionName);

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should not throw when subscriptions cannot be loaded', async () => {
      subscriptionRepository.readAllByStationId.mockRejectedValue(new Error('database down'));

      await expect(webhookDispatcher.register(DEFAULT_TENANT_ID, 'cp001')).resolves.toBeUndefined();
    });
  });

  describe('deregister', () => {
    it('should send request for subscriptions with enabled onClose', async () => {
      const subscription = aSubscription({ onConnect: false, onClose: true });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.deregister(DEFAULT_TENANT_ID, subscription.ocppConnectionName);

      expect(bodyOf(0)).toEqual({
        ocppConnectionName: subscription.ocppConnectionName,
        event: 'closed',
      });
    });

    it('should not send request for subscriptions with disabled onClose', async () => {
      const subscription = aSubscription({ onConnect: false, onClose: false });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.deregister(DEFAULT_TENANT_ID, subscription.ocppConnectionName);

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should deregister station', async () => {
      const subscription = aSubscription({
        onConnect: false,
        onClose: false,
        onMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.deregister(DEFAULT_TENANT_ID, subscription.ocppConnectionName);

      givenSubscriptions();
      fetch.mockClear();

      await webhookDispatcher.dispatchFrame(anInboundFrame(subscription.ocppConnectionName));

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('dispatchFrame: inbound', () => {
    it('should not send request for subscriptions with disabled onMessage', async () => {
      const subscription = aSubscription({ onConnect: false, onMessage: false });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anInboundFrame(subscription.ocppConnectionName));

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should send request when message matches filter', async () => {
      const subscription = aSubscription({
        onConnect: false,
        onMessage: true,
        messageRegexFilter: 'Accepted',
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(
        anInboundFrame(subscription.ocppConnectionName, {
          raw: JSON.stringify(A_CALL_RESULT),
          type: MessageTypeId.CallResult,
          action: 'BootNotification',
          rpcMessage: A_CALL_RESULT,
        }),
      );

      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(bodyOf(0)).toEqual({
        ocppConnectionName: subscription.ocppConnectionName,
        event: 'message',
        origin: MessageOrigin.ChargingStation,
        message: JSON.stringify(A_CALL_RESULT),
        info: {
          correlationId: '123',
          origin: MessageOrigin.ChargingStation,
          timestamp: TIMESTAMP,
          protocol: PROTOCOL,
          action: 'BootNotification',
          type: String(MessageTypeId.CallResult),
        },
      });
    });

    it('should send request when no message filter is defined', async () => {
      const subscription = aSubscription({
        onConnect: false,
        onMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anInboundFrame(subscription.ocppConnectionName));

      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(bodyOf(0).message).toBe(JSON.stringify(A_BOOT_NOTIFICATION_CALL));
    });

    it('should not send request when message does not match filter', async () => {
      const subscription = aSubscription({
        onConnect: false,
        onMessage: true,
        messageRegexFilter: 'CostUpdated',
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anInboundFrame(subscription.ocppConnectionName));

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should use the resolved action when the frame carries none', async () => {
      const subscription = aSubscription({
        onConnect: false,
        onMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(
        anInboundFrame(subscription.ocppConnectionName, {
          raw: JSON.stringify(A_CALL_RESULT),
          type: MessageTypeId.CallResult,
          action: undefined,
          rpcMessage: A_CALL_RESULT,
        }),
        'StatusNotification',
      );

      expect(bodyOf(0).info).toMatchObject({ action: 'StatusNotification' });
    });

    it('should load subscriptions on first sight of a station', async () => {
      const ocppConnectionName = faker.string.uuid();
      const subscription = aSubscription({
        ocppConnectionName,
        onConnect: false,
        onMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);

      await webhookDispatcher.dispatchFrame(anInboundFrame(ocppConnectionName));

      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        ocppConnectionName,
      );
      expect(fetch).toHaveBeenCalledTimes(1);

      subscriptionRepository.readAllByStationId.mockClear();
      await webhookDispatcher.dispatchFrame(anInboundFrame(ocppConnectionName));
      expect(subscriptionRepository.readAllByStationId).not.toHaveBeenCalled();
    });

    it('should not throw when a subscriber url fails', async () => {
      const subscription = aSubscription({
        onConnect: false,
        onMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);
      fetch.mockRejectedValueOnce(new Error('connection refused'));

      await expect(
        webhookDispatcher.dispatchFrame(anInboundFrame(subscription.ocppConnectionName)),
      ).resolves.toBeUndefined();
    });
  });

  describe('dispatchFrame: outbound', () => {
    it('should not send request for subscriptions with disabled sentMessage', async () => {
      const subscription = aSubscription({ onConnect: false, sentMessage: false });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anOutboundFrame(subscription.ocppConnectionName));

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should send request when message matches filter', async () => {
      const subscription = aSubscription({
        onConnect: false,
        onMessage: false,
        sentMessage: true,
        messageRegexFilter: 'BootNotification',
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anOutboundFrame(subscription.ocppConnectionName));

      expect(bodyOf(0)).toEqual({
        ocppConnectionName: subscription.ocppConnectionName,
        event: 'message',
        origin: MessageOrigin.ChargingStationManagementSystem,
        message: JSON.stringify(A_BOOT_NOTIFICATION_CALL),
        info: {
          correlationId: '123',
          origin: MessageOrigin.ChargingStationManagementSystem,
          timestamp: TIMESTAMP,
          protocol: PROTOCOL,
          action: 'BootNotification',
          type: String(MessageTypeId.Call),
        },
      });
    });

    it('should not send request when message does not match filter', async () => {
      const subscription = aSubscription({
        onConnect: false,
        sentMessage: true,
        messageRegexFilter: 'CostUpdated',
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anOutboundFrame(subscription.ocppConnectionName));

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should keep the two directions separate', async () => {
      const subscription = aSubscription({
        onConnect: false,
        onMessage: true,
        sentMessage: false,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anOutboundFrame(subscription.ocppConnectionName));
      expect(fetch).not.toHaveBeenCalled();

      await webhookDispatcher.dispatchFrame(anInboundFrame(subscription.ocppConnectionName));
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispatchFrame: unparsable frame', () => {
    const anUnparsedFrame = (ocppConnectionName: string) =>
      buildFrameEvent({
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName,
        origin: MessageOrigin.ChargingStation,
        correlationId: 'generated-uuid',
        protocol: PROTOCOL,
        raw: '{not json at all',
        timestamp: TIMESTAMP,
      });

    it('should dispatch the raw text to subscribers with onMessage enabled', async () => {
      const subscription = aSubscription({
        onConnect: false,
        onMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anUnparsedFrame(subscription.ocppConnectionName));

      expect(bodyOf(0)).toEqual({
        ocppConnectionName: subscription.ocppConnectionName,
        event: 'message',
        origin: MessageOrigin.ChargingStation,
        message: '{not json at all',
        info: {
          correlationId: 'generated-uuid',
          origin: MessageOrigin.ChargingStation,
          timestamp: TIMESTAMP,
          protocol: PROTOCOL,
        },
      });
    });

    it('should not dispatch to subscribers with onMessage disabled', async () => {
      const subscription = aSubscription({ onConnect: false, onMessage: false });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anUnparsedFrame(subscription.ocppConnectionName));

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should filter on the raw text', async () => {
      const subscription = aSubscription({
        onConnect: false,
        onMessage: true,
        messageRegexFilter: 'CostUpdated',
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anUnparsedFrame(subscription.ocppConnectionName));

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('scheduled job', () => {
    it('should periodically pick up new subscriptions for registered stations', async () => {
      const subscription = aSubscription({
        onConnect: false,
        sentMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anOutboundFrame(subscription.ocppConnectionName));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());

      const newSubscription = aSubscription({
        ocppConnectionName: subscription.ocppConnectionName,
        onConnect: false,
        sentMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription, newSubscription);

      fetch.mockClear();
      await webhookDispatcher.dispatchFrame(anOutboundFrame(subscription.ocppConnectionName));
      expect(fetch).toHaveBeenCalledTimes(1);

      subscriptionRepository.readAllByStationId.mockClear();
      await vi.runOnlyPendingTimersAsync();
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledTimes(1);
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        subscription.ocppConnectionName,
      );

      fetch.mockClear();
      await webhookDispatcher.dispatchFrame(anOutboundFrame(subscription.ocppConnectionName));
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).toHaveBeenCalledWith(newSubscription.url, expect.anything());
    });

    it('should periodically remove deleted subscriptions for registered stations', async () => {
      const ocppConnectionName = faker.string.uuid();
      const subscription = aSubscription({
        ocppConnectionName,
        onConnect: false,
        sentMessage: true,
        messageRegexFilter: undefined,
      });
      const deletedSubscription = aSubscription({
        ocppConnectionName,
        onConnect: false,
        sentMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription, deletedSubscription);
      await givenRegisteredStations(ocppConnectionName);

      await webhookDispatcher.dispatchFrame(anOutboundFrame(ocppConnectionName));
      expect(fetch).toHaveBeenCalledTimes(2);

      givenSubscriptions(subscription);
      await vi.runOnlyPendingTimersAsync();

      fetch.mockClear();
      await webhookDispatcher.dispatchFrame(anOutboundFrame(ocppConnectionName));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).not.toHaveBeenCalledWith(deletedSubscription.url, expect.anything());
    });

    it('should not query for stations that are no longer registered', async () => {
      const subscription = aSubscription({ onConnect: false });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.ocppConnectionName);
      await webhookDispatcher.deregister(DEFAULT_TENANT_ID, subscription.ocppConnectionName);

      subscriptionRepository.readAllByStationId.mockClear();
      await vi.runOnlyPendingTimersAsync();

      expect(subscriptionRepository.readAllByStationId).not.toHaveBeenCalled();
    });
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function anInboundFrame(
    ocppConnectionName: string,
    override: Partial<Parameters<typeof buildFrameEvent>[0]> = {},
  ): FrameEvent {
    return buildFrameEvent({
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName,
      origin: MessageOrigin.ChargingStation,
      correlationId: '123',
      protocol: PROTOCOL,
      raw: JSON.stringify(A_BOOT_NOTIFICATION_CALL),
      timestamp: TIMESTAMP,
      type: MessageTypeId.Call,
      action: 'BootNotification',
      rpcMessage: A_BOOT_NOTIFICATION_CALL,
      ...override,
    });
  }

  function anOutboundFrame(ocppConnectionName: string): FrameEvent {
    return buildFrameEvent({
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName,
      origin: MessageOrigin.ChargingStationManagementSystem,
      correlationId: '123',
      protocol: PROTOCOL,
      raw: JSON.stringify(A_BOOT_NOTIFICATION_CALL),
      timestamp: TIMESTAMP,
      type: MessageTypeId.Call,
      action: 'BootNotification',
      rpcMessage: A_BOOT_NOTIFICATION_CALL,
    });
  }

  function bodyOf(call: number): any {
    return JSON.parse(String(fetch.mock.calls[call][1]?.body));
  }

  function givenSubscriptions(...subscriptions: Subscription[]) {
    subscriptionRepository.readAllByStationId.mockResolvedValue(subscriptions);
  }

  async function givenRegisteredStations(...stationIds: string[]) {
    for (const ocppConnectionName of stationIds) {
      await webhookDispatcher.register(DEFAULT_TENANT_ID, ocppConnectionName);
    }
    fetch.mockClear();
  }
});
