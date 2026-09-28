// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { RabbitMqModuleReceiver } from '@/transport/queue/rabbit-mq/module-receiver.js';
import { MessageOrigin, MessageState, OCPP_CallAction } from '@citrineos/types';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aConsumeMessage,
  aMockAmqpChannel,
  aMockChannelManager,
  aMockConnectionManager,
  aMockDeadLetterPublisher,
  aSystemConfigWithAmqp,
} from '../../../providers/rabbit-mq-provider.js';

const { container } = createTestContainer();

// Each identifier gets its own dedicated queue and consumer(s).
describe('RabbitMqModuleReceiver', () => {
  let receiver: RabbitMqModuleReceiver;
  let mockChannel: ReturnType<typeof aMockAmqpChannel>;
  let mockChannelManager: ReturnType<typeof aMockChannelManager>;

  beforeEach(() => {
    mockChannel = aMockAmqpChannel();
    mockChannelManager = aMockChannelManager(mockChannel);
    receiver = getTestInstance(container, RabbitMqModuleReceiver, {
      config: aSystemConfigWithAmqp(),
      channelManager: mockChannelManager,
      deadLetterPublisher: aMockDeadLetterPublisher(),
      module: undefined,
    });
  });

  describe('constructor', () => {
    it('should throw when AMQP exchange is not configured', () => {
      expect(() =>
        getTestInstance(container, RabbitMqModuleReceiver, {
          config: aSystemConfigWithAmqp({ noAmqp: true }),
          channelManager: mockChannelManager,
          deadLetterPublisher: aMockDeadLetterPublisher(),
          module: undefined,
        }),
      ).toThrow('RabbitMQ exchange is not configured');
    });
  });

  describe('subscribe()', () => {
    it('should return true and skip all queue operations for an empty actions array', async () => {
      const result = await receiver.subscribe('NoOp', [], {});

      expect(result).toBe(true);
      expect(mockChannel.assertQueue).not.toHaveBeenCalled();
      expect(mockChannel.consume).not.toHaveBeenCalled();
    });

    it('should create a dedicated queue and start one consumer per subscribe call', async () => {
      await receiver.subscribe('Provisioning', [OCPP_CallAction.BootNotification], {});

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'rabbit_queue_Provisioning',
        expect.objectContaining({ durable: true, autoDelete: true, exclusive: false }),
      );
      const mainQueueConsumers = (mockChannel.consume as any).mock.calls.filter(
        ([queue]: [string]) => queue === 'rabbit_queue_Provisioning',
      );
      expect(mainQueueConsumers).toHaveLength(1);
    });

    it('should bind one entry per action when multiple actions are provided', async () => {
      await receiver.subscribe(
        'Transactions',
        [OCPP_CallAction.TransactionEvent, OCPP_CallAction.StatusNotification],
        { origin: 'CS' },
      );

      expect(mockChannel.bindQueue).toHaveBeenCalledTimes(2);
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'rabbit_queue_Transactions',
        'test-exchange',
        '',
        expect.objectContaining({ action: OCPP_CallAction.TransactionEvent }),
      );
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'rabbit_queue_Transactions',
        'test-exchange',
        '',
        expect.objectContaining({ action: OCPP_CallAction.StatusNotification }),
      );
    });

    it('should bind a single filter-only entry when no actions are provided', async () => {
      await receiver.subscribe('Router', undefined, {
        ocppConnectionName: 'CS001',
        state: 'Request',
      });

      expect(mockChannel.bindQueue).toHaveBeenCalledTimes(1);
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'rabbit_queue_Router',
        'test-exchange',
        '',
        expect.objectContaining({
          'x-match': 'all',
          ocppConnectionName: 'CS001',
          state: 'Request',
        }),
      );
    });

    it('should accumulate consumer tags when the same identifier subscribes more than once', async () => {
      (mockChannel.consume as any)
        .mockResolvedValueOnce({ consumerTag: 'tag-req' })
        .mockResolvedValueOnce({ consumerTag: 'tag-res' });

      await receiver.subscribe('Router', undefined, { state: 'Request' });
      await receiver.subscribe('Router', undefined, { state: 'Response' });

      // Both tags should be cancelled on unsubscribe
      await receiver.unsubscribe('Router');
      expect(mockChannel.cancel).toHaveBeenCalledWith('tag-req');
      expect(mockChannel.cancel).toHaveBeenCalledWith('tag-res');
    });
  });

  describe('channels and prefetch', () => {
    it('should open a separate channel for each identifier', async () => {
      await receiver.subscribe('Provisioning', [OCPP_CallAction.BootNotification], {});
      await receiver.subscribe('Provisioning_responses', [OCPP_CallAction.BootNotification], {});

      expect(mockChannelManager.getChannel).toHaveBeenCalledWith('module-receiver-Provisioning');
      expect(mockChannelManager.getChannel).toHaveBeenCalledWith(
        'module-receiver-Provisioning_responses',
      );
    });

    it('should set the configured module prefetch before starting the consumer', async () => {
      const configured = getTestInstance(container, RabbitMqModuleReceiver, {
        config: aSystemConfigWithAmqp({ prefetch: { module: 7 } }),
        channelManager: mockChannelManager,
        deadLetterPublisher: aMockDeadLetterPublisher(),
        module: undefined,
      });

      await configured.subscribe('Provisioning', [OCPP_CallAction.BootNotification], {});

      expect(mockChannel.prefetch).toHaveBeenCalledWith(7);
      expect(vi.mocked(mockChannel.prefetch).mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(mockChannel.consume).mock.invocationCallOrder[0],
      );
    });
  });

  describe('unsubscribe()', () => {
    it('should cancel the consumer and return true for a known identifier', async () => {
      (mockChannel.consume as any).mockResolvedValueOnce({ consumerTag: 'tag-abc' });
      await receiver.subscribe('Provisioning', [OCPP_CallAction.BootNotification], {});

      const result = await receiver.unsubscribe('Provisioning');

      expect(result).toBe(true);
      expect(mockChannel.cancel).toHaveBeenCalledWith('tag-abc');
    });

    it('should return false and log a warning for an unknown identifier', async () => {
      const warnSpy = vi.spyOn((receiver as any)._logger, 'warn');

      const result = await receiver.unsubscribe('NonExistent');

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No consumer tag found'));
    });
  });

  describe('shutdown()', () => {
    it('should cancel every tracked consumer across all identifiers', async () => {
      (mockChannel.consume as any)
        .mockResolvedValueOnce({ consumerTag: 'tag-A' })
        .mockResolvedValueOnce({ consumerTag: 'tag-B' });

      await receiver.subscribe('ModuleA', [OCPP_CallAction.BootNotification], {});
      await receiver.subscribe('ModuleB', [OCPP_CallAction.StatusNotification], {});

      await receiver.shutdown();

      expect(mockChannel.cancel).toHaveBeenCalledWith('tag-A');
      expect(mockChannel.cancel).toHaveBeenCalledWith('tag-B');
    });
  });

  // A station Call a module reaches after the station has timed it out goes to <queue>.stale.
  describe('catch-up queue', () => {
    const REQUESTS = 'Transactions_requests';
    const REQUESTS_QUEUE = `rabbit_queue_${REQUESTS}`;
    const CATCH_UP_QUEUE = `${REQUESTS_QUEUE}.stale`;
    const REQUEST_FILTER = {
      origin: MessageOrigin.ChargingStation.toString(),
      state: MessageState.Request.toString(),
    };

    function aStationCall(ageMs: number) {
      return aConsumeMessage({
        origin: MessageOrigin.ChargingStation,
        state: MessageState.Request,
        action: OCPP_CallAction.TransactionEvent,
        context: {
          correlationId: 'corr-1',
          ocppConnectionName: 'CS001',
          tenantId: 1,
          timestamp: new Date(Date.now() - ageMs).toISOString(),
        },
        headers: { action: 'TransactionEvent' },
      });
    }

    beforeEach(() => {
      vi.spyOn(receiver, 'handle').mockResolvedValue(undefined);
    });

    it('should declare and consume a catch-up queue for a queue that receives station Calls', async () => {
      await receiver.subscribe(REQUESTS, [OCPP_CallAction.TransactionEvent], REQUEST_FILTER);

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        CATCH_UP_QUEUE,
        expect.objectContaining({ durable: true, autoDelete: true, exclusive: false }),
      );
      expect(mockChannel.consume).toHaveBeenCalledWith(CATCH_UP_QUEUE, expect.any(Function));
    });

    it('should give the catch-up consumer the moduleStale prefetch', async () => {
      const configured = getTestInstance(container, RabbitMqModuleReceiver, {
        config: aSystemConfigWithAmqp({ prefetch: { module: 10, moduleStale: 2 } }),
        channelManager: mockChannelManager,
        deadLetterPublisher: aMockDeadLetterPublisher(),
        module: undefined,
      });

      await configured.subscribe(REQUESTS, [OCPP_CallAction.TransactionEvent], REQUEST_FILTER);

      const order = [
        ...(mockChannel.prefetch as any).mock.invocationCallOrder.map((n: number, i: number) => ({
          n,
          call: `prefetch ${(mockChannel.prefetch as any).mock.calls[i][0]}`,
        })),
        ...(mockChannel.consume as any).mock.invocationCallOrder.map((n: number, i: number) => ({
          n,
          call: `consume ${(mockChannel.consume as any).mock.calls[i][0]}`,
        })),
      ]
        .sort((a, b) => a.n - b.n)
        .map(({ call }) => call);
      expect(order).toEqual([
        'prefetch 10',
        `consume ${REQUESTS_QUEUE}`,
        'prefetch 2',
        `consume ${CATCH_UP_QUEUE}`,
      ]);
    });

    it('should not declare a catch-up queue for a queue that only receives responses', async () => {
      await receiver.subscribe('Transactions_responses', [OCPP_CallAction.GetTransactionStatus], {
        origin: MessageOrigin.ChargingStation.toString(),
        state: MessageState.Response.toString(),
      });

      expect(mockChannel.assertQueue).not.toHaveBeenCalledWith(
        'rabbit_queue_Transactions_responses.stale',
        expect.anything(),
      );
    });

    it('should start only one catch-up consumer when an identifier subscribes twice', async () => {
      await receiver.subscribe(REQUESTS, [OCPP_CallAction.TransactionEvent], REQUEST_FILTER);
      await receiver.subscribe(REQUESTS, [OCPP_CallAction.StatusNotification], REQUEST_FILTER);

      const catchUpConsumers = (mockChannel.consume as any).mock.calls.filter(
        ([queue]: [string]) => queue === CATCH_UP_QUEUE,
      );
      expect(catchUpConsumers).toHaveLength(1);
    });

    it('should move a station Call older than maxCallLengthSeconds to the catch-up queue', async () => {
      await receiver.subscribe(REQUESTS, [OCPP_CallAction.TransactionEvent], REQUEST_FILTER);
      const late = aStationCall(21_000); // maxCallLengthSeconds is 20 in the test config

      await (receiver as any)._onMessage(late, mockChannel, REQUESTS_QUEUE);

      expect(receiver.handle).not.toHaveBeenCalled();
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        CATCH_UP_QUEUE,
        late.content,
        late.properties,
      );
      expect(mockChannel.ack).toHaveBeenCalledWith(late);
    });

    it('should handle a station Call still within maxCallLengthSeconds straight away', async () => {
      await receiver.subscribe(REQUESTS, [OCPP_CallAction.TransactionEvent], REQUEST_FILTER);
      const fresh = aStationCall(1_000);

      await (receiver as any)._onMessage(fresh, mockChannel, REQUESTS_QUEUE);

      expect(receiver.handle).toHaveBeenCalledTimes(1);
      expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
    });

    it('should handle a late Call consumed from the catch-up queue instead of moving it again', async () => {
      await receiver.subscribe(REQUESTS, [OCPP_CallAction.TransactionEvent], REQUEST_FILTER);
      const late = aStationCall(60_000);

      await (receiver as any)._onMessage(late, mockChannel, CATCH_UP_QUEUE);

      expect(receiver.handle).toHaveBeenCalledTimes(1);
      expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(late);
    });

    it('should handle a late station response straight away: nothing waits on it', async () => {
      await receiver.subscribe(REQUESTS, [OCPP_CallAction.TransactionEvent], REQUEST_FILTER);
      const lateResponse = aConsumeMessage({
        origin: MessageOrigin.ChargingStation,
        state: MessageState.Response,
        context: {
          correlationId: 'corr-1',
          ocppConnectionName: 'CS001',
          tenantId: 1,
          timestamp: new Date(Date.now() - 60_000).toISOString(),
        },
      });

      await (receiver as any)._onMessage(lateResponse, mockChannel, REQUESTS_QUEUE);

      expect(receiver.handle).toHaveBeenCalledTimes(1);
      expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
    });

    it('should restore the catch-up consumer after a reconnect', async () => {
      const connectionManager = aMockConnectionManager();
      const reconnecting = getTestInstance(container, RabbitMqModuleReceiver, {
        config: aSystemConfigWithAmqp(),
        channelManager: aMockChannelManager(mockChannel, connectionManager),
        deadLetterPublisher: aMockDeadLetterPublisher(),
        module: undefined,
      });
      await reconnecting.subscribe(REQUESTS, [OCPP_CallAction.TransactionEvent], REQUEST_FILTER);
      (mockChannel.consume as any).mockClear();

      const [, onConnected] = connectionManager.on.mock.calls.find(
        ([event]) => event === 'connected',
      ) ?? [undefined, async () => {}];
      await onConnected();

      expect(mockChannel.consume).toHaveBeenCalledWith(REQUESTS_QUEUE, expect.any(Function));
      expect(mockChannel.consume).toHaveBeenCalledWith(CATCH_UP_QUEUE, expect.any(Function));
    });
  });
});
