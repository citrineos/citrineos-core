import { faker } from '@faker-js/faker';
import { jest } from '@jest/globals';
import { ISubscriptionRepository, OCPPMessage, Subscription } from '@citrineos/data';
import { WebhookDispatcher } from '../../src';
import { createIdentifier, DEFAULT_TENANT_ID, MessageOrigin } from '@citrineos/base';
import { aSubscription } from '../providers/SubscriptionProvider';

describe('WebhookDispatcher', () => {
  const fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'Accepted' }),
    } as Response),
  );
  global.fetch = fetch;

  // Mock transaction object
  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
  };
  let subscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let webhookDispatcher: WebhookDispatcher;

  beforeEach(() => {
    jest.useFakeTimers();

    subscriptionRepository = {
      readAllByStationId: jest.fn(),
    } as unknown as jest.Mocked<ISubscriptionRepository>;

    Object.defineProperty(OCPPMessage, 'sequelize', {
      configurable: true, // Allow further modifications
      value: {
        transaction: jest.fn(() => mockTransaction),
      },
    });
    OCPPMessage.findOne = jest.fn(() => Promise.resolve(null));
    OCPPMessage.create = jest.fn(() => Promise.resolve({} as any));

    webhookDispatcher = new WebhookDispatcher(subscriptionRepository);
  });

  afterEach(() => {
    fetch.mockClear();
    subscriptionRepository.readAllByStationId.mockReset();
    jest.clearAllTimers();
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
        'Any message',
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
        'Any message',
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
        'Any message',
        'Any timestamp',
        'ocpp2.0.1',
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
      const message = 'Accepted reservation';

      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const correlationId = '123';
      const action = 'BootNotification';
      await webhookDispatcher.dispatchMessageReceived(
        createIdentifier(subscription.tenantId, subscription.stationId),
        message,
        timestamp,
        protocol,
        [2, correlationId, action, {}],
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
          message: message,
          info: {
            correlationId: correlationId,
            origin: 'cs',
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
      const message = 'Rejected reservation';

      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const correlationId = '123';
      const action = 'BootNotification';
      await webhookDispatcher.dispatchMessageReceived(
        createIdentifier(subscription.tenantId, subscription.stationId),
        message,
        timestamp,
        protocol,
        [2, correlationId, action, {}],
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
          message: message,
          info: {
            correlationId: correlationId,
            origin: 'cs',
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
        'Rejected reservation',
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('dispatchMessageSent', () => {
    it('should not send request for subscriptions with disabled sentMessage', async () => {
      const subscription = aSubscription({ sentMessage: false });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'Any message',
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
      const message = '"totalCost": 12.54';

      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const correlationId = '123';
      const action = 'BootNotification';
      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        message,
        timestamp,
        protocol,
        [2, correlationId, action, {}],
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
          message: message,
          info: {
            correlationId: correlationId,
            origin: 'csms',
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
      const message = '"totalCost": 12.54';

      const timestamp = 'Any timestamp';
      const protocol = 'ocpp2.0.1';
      const correlationId = '123';
      const action = 'BootNotification';
      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        message,
        timestamp,
        protocol,
        [2, correlationId, action, {}],
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
          message: message,
          info: {
            correlationId: correlationId,
            origin: 'csms',
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
        '"partialCost": 10.54',
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );

      expect(fetch).not.toHaveBeenCalled();
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
        'Any message',
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
        'Any message',
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());

      subscriptionRepository.readAllByStationId.mockClear();
      await jest.runOnlyPendingTimersAsync();
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledTimes(1);
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledWith(
        subscription.tenantId,
        subscription.stationId,
      );

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'Any message',
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
        'Any message',
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
        'Any message',
        'Any timestamp',
        'ocpp2.0.1',
        [2, '123', 'BootNotification', {}],
      );
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).toHaveBeenCalledWith(anotherSubscription.url, expect.anything());

      // Run pending timers to trigger subscription refresh
      subscriptionRepository.readAllByStationId.mockClear();
      await jest.runOnlyPendingTimersAsync();
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledTimes(1);
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledWith(
        subscription.tenantId,
        subscription.stationId,
      );

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(
        createIdentifier(subscription.tenantId, subscription.stationId),
        'Any message',
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
