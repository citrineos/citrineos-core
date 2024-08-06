import { faker } from '@faker-js/faker';
import { jest } from '@jest/globals';
import { ISubscriptionRepository, Subscription } from '@citrineos/data';
import { WebhookDispatcher } from '../../src';
import { MessageOrigin } from '@citrineos/base';
import { aSubscription } from '../providers/subscription.provider.test';

describe('WebhookDispatcher', () => {
  const fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'Accepted' }),
    } as Response),
  );
  global.fetch = fetch;

  let subscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let webhookDispatcher: WebhookDispatcher;

  beforeEach(() => {
    jest.useFakeTimers();

    subscriptionRepository = {
      readAllByStationId: jest.fn(),
    } as unknown as jest.Mocked<ISubscriptionRepository>;

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

      await webhookDispatcher.register(subscription.stationId);

      expect(subscriptionRepository.readAllByStationId).toBeCalledWith(
        subscription.stationId,
      );
    });

    it('should send request for subscriptions with enabled onConnect', async () => {
      const subscription = aSubscription({ onConnect: true });
      givenSubscriptions(subscription);

      await webhookDispatcher.register(subscription.stationId);

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

      await webhookDispatcher.register(subscription.stationId);

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('deregister', () => {
    it('should send request for subscriptions with enabled onClose', async () => {
      const subscription = aSubscription({ onClose: true });
      givenSubscriptions(subscription);
      await givenRegisteredStations(subscription.stationId);

      await webhookDispatcher.deregister(subscription.stationId);

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

      await webhookDispatcher.deregister(subscription.stationId);

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
        subscription.stationId,
        'Any message',
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());

      await webhookDispatcher.deregister(subscription.stationId);

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(
        subscription.stationId,
        'Any message',
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
        subscription.stationId,
        'Any message',
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

      await webhookDispatcher.dispatchMessageReceived(
        subscription.stationId,
        message,
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

      await webhookDispatcher.dispatchMessageReceived(
        subscription.stationId,
        message,
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
        subscription.stationId,
        'Rejected reservation',
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
        subscription.stationId,
        'Any message',
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

      await webhookDispatcher.dispatchMessageSent(
        subscription.stationId,
        message,
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

      await webhookDispatcher.dispatchMessageSent(
        subscription.stationId,
        message,
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
        subscription.stationId,
        '"partialCost": 10.54',
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
        subscription.stationId,
        'Any message',
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
        subscription.stationId,
        'Any message',
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());

      subscriptionRepository.readAllByStationId.mockClear();
      await jest.runOnlyPendingTimersAsync();
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledTimes(
        1,
      );
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledWith(
        subscription.stationId,
      );

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(
        subscription.stationId,
        'Any message',
      );
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).toHaveBeenCalledWith(
        newSubscription.url,
        expect.anything(),
      );
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

      await webhookDispatcher.dispatchMessageSent(stationId, 'Any message');
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).toHaveBeenCalledWith(
        anotherSubscription.url,
        expect.anything(),
      );

      // Simulate 'anotherSubscription' was deleted
      givenSubscriptions(subscription);

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(stationId, 'Any message');
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).toHaveBeenCalledWith(
        anotherSubscription.url,
        expect.anything(),
      );

      // Run pending timers to trigger subscription refresh
      subscriptionRepository.readAllByStationId.mockClear();
      await jest.runOnlyPendingTimersAsync();
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledTimes(
        1,
      );
      expect(subscriptionRepository.readAllByStationId).toHaveBeenCalledWith(
        subscription.stationId,
      );

      fetch.mockClear();
      await webhookDispatcher.dispatchMessageSent(stationId, 'Any message');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(subscription.url, expect.anything());
      expect(fetch).not.toHaveBeenCalledWith(
        anotherSubscription.url,
        expect.anything(),
      );
    });
  });

  function givenSubscriptions(...subscriptions: Subscription[]) {
    subscriptionRepository.readAllByStationId.mockResolvedValue(subscriptions);
  }

  async function givenRegisteredStations(...stationIds: string[]) {
    for (let stationId of stationIds) {
      await webhookDispatcher.register(stationId);
    }
    fetch.mockClear();
  }
});
