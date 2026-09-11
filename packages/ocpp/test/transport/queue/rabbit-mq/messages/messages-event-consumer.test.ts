// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MESSAGES_DLX, MESSAGES_EXCHANGE, MESSAGES_QUEUES } from '@citrineos/types';
import type * as amqplib from 'amqplib';
import { MessagesEventConsumer, type MessagesEventHandler } from '@/transport/index.js';
import { aMockAmqpChannel } from '@test/providers/rabbit-mq-provider.js';
import {
  aChannelManagerPerChannelId,
  aConnectionEvent,
  aFrameEvent,
  aMessagesDelivery,
} from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OCPP_QUEUE = 'messages.ocpp';
const CONNECTIONS_QUEUE = 'messages.connections';

describe('MessagesEventConsumer', () => {
  const { container, logger } = createTestContainer();
  let harness: ReturnType<typeof aChannelManagerPerChannelId>;
  let handler: ReturnType<typeof vi.fn> & MessagesEventHandler;
  let consumer: MessagesEventConsumer;

  function channelFor(queue: string): amqplib.Channel {
    return harness.channels.get(`messages-consumer-${queue}`)!;
  }

  async function deliver(queue: string, message: amqplib.ConsumeMessage | null): Promise<void> {
    const channel = channelFor(queue);
    const onDelivery = (channel.consume as any).mock.calls[0][1];
    await onDelivery(message);
  }

  beforeEach(() => {
    harness = aChannelManagerPerChannelId(aMockAmqpChannel);
    handler = vi.fn().mockResolvedValue(undefined) as any;
    consumer = getTestInstance(container, MessagesEventConsumer, {
      channelManager: harness.channelManager,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribe ─────────────────────────────────────────────────────────────

  describe('start', () => {
    it('should consume both messages-plane queues', async () => {
      await consumer.start(handler);

      expect(consumer.consumedQueues).toEqual([OCPP_QUEUE, CONNECTIONS_QUEUE]);
    });

    it('should give each queue its own channel, so one slow queue cannot block the other', async () => {
      await consumer.start(handler);

      expect([...harness.channels.keys()]).toEqual([
        `messages-consumer-${OCPP_QUEUE}`,
        `messages-consumer-${CONNECTIONS_QUEUE}`,
      ]);
      expect(channelFor(OCPP_QUEUE)).not.toBe(channelFor(CONNECTIONS_QUEUE));
    });

    it('should assert the same topology the publisher declares, so either side may start first', async () => {
      await consumer.start(handler);

      for (const spec of MESSAGES_QUEUES) {
        const channel = channelFor(spec.queue);
        expect(channel.assertExchange).toHaveBeenCalledWith(MESSAGES_EXCHANGE, 'topic', {
          durable: true,
        });
        expect(channel.assertQueue).toHaveBeenCalledWith(spec.queue, {
          durable: true,
          autoDelete: false,
          arguments: { 'x-dead-letter-exchange': MESSAGES_DLX },
        });
        expect(channel.bindQueue).toHaveBeenCalledWith(spec.queue, MESSAGES_EXCHANGE, spec.binding);
        expect(channel.assertQueue).toHaveBeenCalledWith(spec.dlq, {
          durable: true,
          autoDelete: false,
        });
        expect(channel.bindQueue).toHaveBeenCalledWith(spec.dlq, MESSAGES_DLX, spec.binding);
      }
    });

    it('should still serve one queue when the other cannot be consumed', async () => {
      const failing = aMockAmqpChannel();
      (failing.consume as any).mockRejectedValue(new Error('queue locked'));
      (harness.channelManager.getChannel as any).mockImplementation(async (channelId: string) => {
        if (channelId.endsWith(OCPP_QUEUE)) return failing;
        if (!harness.channels.has(channelId)) harness.channels.set(channelId, aMockAmqpChannel());
        return harness.channels.get(channelId)!;
      });

      await consumer.start(handler);

      expect(consumer.consumedQueues).toEqual([CONNECTIONS_QUEUE]);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should not re-consume a queue it is already consuming', async () => {
      await consumer.start(handler);
      await consumer.subscribe();

      expect(channelFor(OCPP_QUEUE).consume).toHaveBeenCalledTimes(1);
      expect(consumer.consumedQueues).toEqual([OCPP_QUEUE, CONNECTIONS_QUEUE]);
    });
  });

  describe('reconnect', () => {
    it('should re-subscribe from scratch, because the old consumer tags died with the channel', async () => {
      await consumer.start(handler);

      harness.connectionManager.emit('connected');
      await vi.waitFor(() => expect(channelFor(OCPP_QUEUE).consume).toHaveBeenCalledTimes(2));
      expect(consumer.consumedQueues).toEqual([OCPP_QUEUE, CONNECTIONS_QUEUE]);
    });

    it('should ignore a reconnect before it was ever started', () => {
      harness.connectionManager.emit('connected');

      expect(harness.channelManager.getChannel).not.toHaveBeenCalled();
    });

    it('should ignore a reconnect after shutdown', async () => {
      await consumer.start(handler);
      await consumer.shutdown();
      (channelFor(OCPP_QUEUE).consume as any).mockClear();

      harness.connectionManager.emit('connected');
      await Promise.resolve();

      expect(channelFor(OCPP_QUEUE).consume).not.toHaveBeenCalled();
    });
  });

  // ─── delivery ──────────────────────────────────────────────────────────────

  describe('delivery', () => {
    beforeEach(async () => {
      await consumer.start(handler);
    });

    it('should hand a valid frame envelope to the handler and ack it', async () => {
      const event = aFrameEvent();

      await deliver(OCPP_QUEUE, aMessagesDelivery(event));

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ kind: 'frame' }));
      expect(handler.mock.calls[0][0]).toMatchObject({
        correlationId: event.correlationId,
        raw: event.raw,
      });
      expect(channelFor(OCPP_QUEUE).ack).toHaveBeenCalled();
    });

    it('should hand a valid connection envelope to the handler and ack it', async () => {
      await deliver(
        CONNECTIONS_QUEUE,
        aMessagesDelivery(aConnectionEvent(), { routingKey: 'connection.connected' }),
      );

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ kind: 'connection' }));
      expect(channelFor(CONNECTIONS_QUEUE).ack).toHaveBeenCalled();
    });

    it('should ignore a null delivery, which is a cancelled consumer rather than an event', async () => {
      await deliver(OCPP_QUEUE, null);

      expect(handler).not.toHaveBeenCalled();
      expect(channelFor(OCPP_QUEUE).ack).not.toHaveBeenCalled();
      expect(channelFor(OCPP_QUEUE).nack).not.toHaveBeenCalled();
    });
  });

  describe('poison messages', () => {
    beforeEach(async () => {
      await consumer.start(handler);
    });

    it('should dead-letter non-JSON immediately rather than looping on it', async () => {
      await deliver(OCPP_QUEUE, aMessagesDelivery('}}not json{{'));

      expect(handler).not.toHaveBeenCalled();
      expect(channelFor(OCPP_QUEUE).nack).toHaveBeenCalledWith(expect.anything(), false, false);
    });

    it('should dead-letter an envelope the schema rejects', async () => {
      await deliver(OCPP_QUEUE, aMessagesDelivery(JSON.stringify({ kind: 'telemetry', a: 1 })));

      expect(handler).not.toHaveBeenCalled();
      expect(channelFor(OCPP_QUEUE).nack).toHaveBeenCalledWith(expect.anything(), false, false);
    });

    it('should dead-letter a frame envelope missing a required field', async () => {
      const { correlationId: _dropped, ...incomplete } = aFrameEvent();

      await deliver(OCPP_QUEUE, aMessagesDelivery(JSON.stringify(incomplete)));

      expect(handler).not.toHaveBeenCalled();
      expect(channelFor(OCPP_QUEUE).nack).toHaveBeenCalledWith(expect.anything(), false, false);
    });
  });

  describe('processing failures', () => {
    beforeEach(async () => {
      await consumer.start(handler);
      handler.mockRejectedValue(new Error('database down'));
    });

    it('should requeue a first failure, giving a transient fault one more chance', async () => {
      await deliver(OCPP_QUEUE, aMessagesDelivery(aFrameEvent(), { redelivered: false }));

      expect(channelFor(OCPP_QUEUE).nack).toHaveBeenCalledWith(expect.anything(), false, true);
    });

    it('should dead-letter a second failure rather than requeueing forever', async () => {
      await deliver(OCPP_QUEUE, aMessagesDelivery(aFrameEvent(), { redelivered: true }));

      expect(channelFor(OCPP_QUEUE).nack).toHaveBeenCalledWith(expect.anything(), false, false);
    });

    it('should not ack an event it failed to process', async () => {
      await deliver(OCPP_QUEUE, aMessagesDelivery(aFrameEvent()));

      expect(channelFor(OCPP_QUEUE).ack).not.toHaveBeenCalled();
    });
  });

  // ─── shutdown ──────────────────────────────────────────────────────────────

  describe('shutdown', () => {
    it('should cancel every consumer and forget the queues', async () => {
      await consumer.start(handler);

      await consumer.shutdown();

      expect(channelFor(OCPP_QUEUE).cancel).toHaveBeenCalledWith('consumer-tag-1');
      expect(channelFor(CONNECTIONS_QUEUE).cancel).toHaveBeenCalledWith('consumer-tag-1');
      expect(consumer.consumedQueues).toEqual([]);
    });

    it('should keep cancelling the rest when one cancel fails', async () => {
      await consumer.start(handler);
      (channelFor(OCPP_QUEUE).cancel as any).mockRejectedValue(new Error('channel gone'));

      await expect(consumer.shutdown()).resolves.toBeUndefined();

      expect(channelFor(CONNECTIONS_QUEUE).cancel).toHaveBeenCalled();
      expect(consumer.consumedQueues).toEqual([]);
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
