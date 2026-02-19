// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '@faker-js/faker';
import {
  IOCPPMessageRepository,
  ISubscriptionRepository,
  OCPPMessage,
  Subscription,
} from '@citrineos/data';
import { WebhookDispatcher } from '../../src';
import { createIdentifier, DEFAULT_TENANT_ID, MessageOrigin, MessageState } from '@citrineos/base';
import { aSubscription } from '../providers/SubscriptionProvider.js';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('WebhookDispatcher', () => {
  const fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'Accepted' }),
    } as Response),
  );
  global.fetch = fetch;

  let subscriptionRepository: Mocked<ISubscriptionRepository>;
  let ocppMessageRepository: IOCPPMessageRepository;
  let createOCPPMessage: ReturnType<typeof vi.fn>;
  let webhookDispatcher: WebhookDispatcher;

  beforeEach(() => {
    vi.useFakeTimers();

    subscriptionRepository = {
      readAllByStationId: vi.fn(),
    } as unknown as Mocked<ISubscriptionRepository>;

    createOCPPMessage = vi
      .fn()
      .mockResolvedValue({ action: 'BootNotification' } as Partial<OCPPMessage>);
    ocppMessageRepository = {
      createOCPPMessage,
    } as unknown as IOCPPMessageRepository;

    webhookDispatcher = new WebhookDispatcher(ocppMessageRepository, subscriptionRepository);
  });

  afterEach(() => {
    fetch.mockClear();
    subscriptionRepository.readAllByStationId.mockReset();
    vi.clearAllTimers();
  });

  describe('register', () => {
    it('should load subscriptions', async () => {
      const subscription = aSubscription();
      givenSubscriptions(subscription);

      await webhookDispatcher.register(subscription.tenantId, subscription.stationId);

      expect(subscriptionRepository.readAllByStationId).toBeCalledWith(
        subscription.tenantId,
        subscription.stationId,
      );
    });

    it('should send request for subscriptions with enabled onConnect', async () => {
      const subscription = aSubscription({ onConnect: true });
      givenSubscriptions(subscription);

      await webhookDispatcher.register(subscription.tenantId, subscription.stationId);

      expect(fetch).toBeCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId: subscription.stationId,
          event: 'connected',
        }),
      });
    });

    it('should not send request for subscriptions with disabled onConnect', async () => {
      const subscription = aSubscription({ onConnect: false });
      givenSubscriptions(subscription);

      await webhookDispatcher.register(subscription.tenantId, subscription.stationId);

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('deregister', () => {
    it('should send request for subscriptions with enabled onClose', async () => {
      const subscription = aSubscription({ onClose: true });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.deregister(subscription.tenantId, subscription.stationId);

      expect(fetch).toBeCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId: subscription.stationId,
          event: 'closed',
        }),
      });
    });

    it('should not send request for subscriptions with disabled onClose', async () => {
      const subscription = aSubscription({ onClose: false });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.deregister(subscription.tenantId, subscription.stationId);

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should deregister station', async () => {
      const subscription = aSubscription({
        sentMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'BootNotification',
        MessageState.Request,
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());

      await webhookDispatcher.deregister(subscription.tenantId, subscription.stationId);

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'BootNotification',
        MessageState.Request,
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('dispatchMessageReceived', () => {
    it('should not send request for subscriptions with disabled onMessage', async () => {
      const subscription = aSubscription({ onMessage: false });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.dispatchMessageReceived(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'Any timestamp',
        'ocpp2.0.1',
        'BootNotification',
        MessageState.Request,
        [2, '123', 'BootNotification', {}],
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should send request when message matches filter', async () => {
      const subscription = aSubscription({
        onMessage: true,
        messageRegexFilter: 'Accepted',
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      const rpcMessage = [3, '123', { status: 'Accepted' }];
      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const correlationId = '123';
      const action = 'BootNotification';

      await webhookDispatcher.dispatchMessageReceived(
        createIdentifier(subscription.tenantId, subscription.stationId),
        timestamp,
        protocol,
        action,
        MessageState.Response,
        rpcMessage,
      );

      expect(fetch).toHaveBeenCalledWith(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId: subscription.stationId,
          event: 'message',
          origin: MessageOrigin.ChargingStation,
          message: JSON.stringify(rpcMessage),
          info: {
            correlationId: correlationId,
            origin: MessageOrigin.ChargingStation,
            timestamp: timestamp,
            protocol: protocol,
            action: action,
          },
        }),
      });
    });

    it('should send request when no message filter is defined', async () => {
      const subscription = aSubscription({
        onMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      const rpcMessage = [2, '123', 'BootNotification', { reason: 'PowerUp' }];
      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const correlationId = '123';
      const action = 'BootNotification';

      await webhookDispatcher.dispatchMessageReceived(
        createIdentifier(subscription.tenantId, subscription.stationId),
        timestamp,
        protocol,
        action,
        MessageState.Request,
        rpcMessage,
      );

      expect(fetch).toHaveBeenCalledWith(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId: subscription.stationId,
          event: 'message',
          origin: MessageOrigin.ChargingStation,
          message: JSON.stringify(rpcMessage),
          info: {
            correlationId: correlationId,
            origin: MessageOrigin.ChargingStation,
            timestamp: timestamp,
            protocol: protocol,
            action: action,
          },
        }),
      });
    });

    it('should not send request when message does not match filter', async () => {
      const subscription = aSubscription({
        onMessage: true,
        messageRegexFilter: 'Accepted',
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.dispatchMessageReceived(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'Any timestamp',
        'ocpp2.0.1',
        'BootNotification',
        MessageState.Request,
        [2, '123', 'BootNotification', { reason: 'PowerUp' }],
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should create OCPP message record', async () => {
      const subscription = aSubscription({ onMessage: true, messageRegexFilter: undefined });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      const rpcMessage = [2, '123', 'BootNotification', {}];
      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const action = 'BootNotification';

      await webhookDispatcher.dispatchMessageReceived(
        createIdentifier(subscription.tenantId, subscription.stationId),
        timestamp,
        protocol,
        action,
        MessageState.Request,
        rpcMessage,
      );

      expect(createOCPPMessage).toHaveBeenCalledWith(
        subscription.tenantId,
        expect.objectContaining({
          tenantId: subscription.tenantId,
          stationId: subscription.stationId,
          correlationId: '123',
          origin: MessageOrigin.ChargingStation,
          state: MessageState.Request,
          protocol: protocol,
          action: action,
          message: rpcMessage,
          timestamp: timestamp,
        }),
      );
    });

    it('should use action from stored message record when action is undefined', async () => {
      const storedAction = 'StatusNotification';
      createOCPPMessage.mockResolvedValue({
        action: storedAction,
      } as Partial<OCPPMessage> as OCPPMessage);

      const subscription = aSubscription({ onMessage: true, messageRegexFilter: undefined });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      // OCPP response (type 3) has no action field in the message itself
      const rpcMessage = [3, '123', { status: 'Accepted' }];

      await webhookDispatcher.dispatchMessageReceived(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'Any timestamp',
        'ocpp2.0.1',
        undefined as any,
        MessageState.Response,
        rpcMessage,
      );

      expect(fetch).toHaveBeenCalledWith(
        subscription.url,
        expect.objectContaining({
          body: expect.stringContaining(storedAction),
        }),
      );
    });
  });

  describe('dispatchMessageSent', () => {
    it('should not send request for subscriptions with disabled sentMessage', async () => {
      const subscription = aSubscription({ sentMessage: false });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'BootNotification',
        MessageState.Request,
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should send request when message matches filter', async () => {
      const subscription = aSubscription({
        sentMessage: true,
        messageRegexFilter: 'totalCost',
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      const rpcMessage = [3, '123', { totalCost: 12.54 }];
      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const correlationId = '123';
      const action = 'CostUpdated';

      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        action,
        MessageState.Response,
        timestamp,
        protocol,
        rpcMessage,
      );

      expect(fetch).toHaveBeenCalledWith(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId: subscription.stationId,
          event: 'message',
          origin: MessageOrigin.ChargingStationManagementSystem,
          message: JSON.stringify(rpcMessage),
          info: {
            correlationId: correlationId,
            origin: MessageOrigin.ChargingStationManagementSystem,
            timestamp: timestamp,
            protocol: protocol,
            action: action,
          },
        }),
      });
    });

    it('should send request when no message filter', async () => {
      const subscription = aSubscription({
        sentMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      const rpcMessage = [2, '123', 'BootNotification', {}];
      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const correlationId = '123';
      const action = 'BootNotification';

      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        action,
        MessageState.Request,
        timestamp,
        protocol,
        rpcMessage,
      );

      expect(fetch).toHaveBeenCalledWith(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId: subscription.stationId,
          event: 'message',
          origin: MessageOrigin.ChargingStationManagementSystem,
          message: JSON.stringify(rpcMessage),
          info: {
            correlationId: correlationId,
            origin: MessageOrigin.ChargingStationManagementSystem,
            timestamp: timestamp,
            protocol: protocol,
            action: action,
          },
        }),
      });
    });

    it('should not send request when message does not match filter', async () => {
      const subscription = aSubscription({
        sentMessage: true,
        messageRegexFilter: 'totalCost',
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'BootNotification',
        MessageState.Request,
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should create OCPP message record', async () => {
      const subscription = aSubscription({ sentMessage: true, messageRegexFilter: undefined });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      const rpcMessage = [2, '123', 'BootNotification', {}];
      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const action = 'BootNotification';

      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        action,
        MessageState.Request,
        timestamp,
        protocol,
        rpcMessage,
      );

      expect(createOCPPMessage).toHaveBeenCalledWith(
        subscription.tenantId,
        expect.objectContaining({
          tenantId: subscription.tenantId,
          stationId: subscription.stationId,
          correlationId: '123',
          origin: MessageOrigin.ChargingStationManagementSystem,
          state: MessageState.Request,
          protocol: protocol,
          action: action,
          message: rpcMessage,
          timestamp: timestamp,
        }),
      );
    });
  });

  describe('dispatchMessageReceivedUnparsed', () => {
    it('should dispatch message to subscribers with onMessage enabled', async () => {
      const subscription = aSubscription({ onMessage: true, messageRegexFilter: undefined });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      const message = 'some raw unparsed message';
      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const action = 'BootNotification';

      await webhookDispatcher.dispatchMessageReceivedUnparsed(
        subscription.tenantId,
        subscription.stationId,
        message,
        timestamp,
        protocol,
        action,
        MessageState.Request,
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        subscription.url,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(message),
        }),
      );
    });

    it('should not dispatch message to subscribers with onMessage disabled', async () => {
      const subscription = aSubscription({ onMessage: false });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.dispatchMessageReceivedUnparsed(
        subscription.tenantId,
        subscription.stationId,
        'Any message',
        'Any timestamp',
        'ocpp2.0.1',
        'BootNotification',
        MessageState.Request,
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should filter messages based on messageRegexFilter', async () => {
      const subscription = aSubscription({
        onMessage: true,
        messageRegexFilter: 'Accepted',
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.dispatchMessageReceivedUnparsed(
        subscription.tenantId,
        subscription.stationId,
        'Rejected reservation',
        'Any timestamp',
        'ocpp2.0.1',
        'BootNotification',
        MessageState.Request,
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should send message with origin ChargingStation', async () => {
      const subscription = aSubscription({ onMessage: true, messageRegexFilter: undefined });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.dispatchMessageReceivedUnparsed(
        subscription.tenantId,
        subscription.stationId,
        'Any raw message',
        'Any timestamp',
        'ocpp2.0.1',
        'BootNotification',
        MessageState.Request,
      );

      expect(fetch).toHaveBeenCalledWith(
        subscription.url,
        expect.objectContaining({
          body: expect.stringContaining(MessageOrigin.ChargingStation),
        }),
      );
    });

    it('should create OCPP message record with generated correlation ID', async () => {
      const subscription = aSubscription({ onMessage: true, messageRegexFilter: undefined });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      const message = 'Any raw message';
      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const action = 'BootNotification';

      await webhookDispatcher.dispatchMessageReceivedUnparsed(
        subscription.tenantId,
        subscription.stationId,
        message,
        timestamp,
        protocol,
        action,
        MessageState.Request,
      );

      expect(createOCPPMessage).toHaveBeenCalledWith(
        subscription.tenantId,
        expect.objectContaining({
          tenantId: subscription.tenantId,
          stationId: subscription.stationId,
          correlationId: expect.any(String),
          origin: MessageOrigin.ChargingStation,
          state: MessageState.Request,
          protocol: protocol,
          action: action,
          message: message,
          timestamp: timestamp,
        }),
      );
    });
  });

  describe('scheduled job', () => {
    it('should periodically pick up new subscriptions for registered stations', async () => {
      const subscription = aSubscription({
        sentMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'BootNotification',
        MessageState.Request,
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());

      const newSubscription = aSubscription({
        stationId: subscription.stationId,
        sentMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription, newSubscription);

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'BootNotification',
        MessageState.Request,
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());

      subscriptionRepository.readAllByStationId.mockClear();
      await vi.runOnlyPendingTimersAsync();
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledTimes(1);
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledWith(
        subscription.tenantId,
        subscription.stationId,
      );

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'BootNotification',
        MessageState.Request,
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).toHaveBeenCalledWith(newSubscription.url, expect.anything());
    });

    it('should periodically remove deleted subscriptions for registered stations', async () => {
      const stationId = faker.string.uuid();
      const subscription = aSubscription({
        stationId: stationId,
        sentMessage: true,
        messageRegexFilter: undefined,
      });
      const anotherSubscription = aSubscription({
        stationId: stationId,
        sentMessage: true,
        messageRegexFilter: undefined,
      });
      givenSubscriptions(subscription, anotherSubscription);
      await givenRegisteredStations(stationId);

      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'BootNotification',
        MessageState.Request,
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).toHaveBeenCalledWith(anotherSubscription.url, expect.anything());

      // Simulate 'anotherSubscription' was deleted
      givenSubscriptions(subscription);

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'BootNotification',
        MessageState.Request,
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).toHaveBeenCalledWith(anotherSubscription.url, expect.anything());

      // Run pending timers to trigger subscription refresh
      subscriptionRepository.readAllByStationId.mockClear();
      await vi.runOnlyPendingTimersAsync();
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledTimes(1);
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledWith(
        subscription.tenantId,
        subscription.stationId,
      );

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'BootNotification',
        MessageState.Request,
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).not.toHaveBeenCalledWith(anotherSubscription.url, expect.anything());
    });
  });

  function givenSubscriptions(...subscriptions: Subscription[]) {
    subscriptionRepository.readAllByStationId.mockResolvedValue(subscriptions);
  }

  async function givenRegisteredStations(...stationIds: string[]) {
    for (const stationId of stationIds) {
      await webhookDispatcher.register(DEFAULT_TENANT_ID, stationId);
    }
    fetch.mockClear();
  }
});
