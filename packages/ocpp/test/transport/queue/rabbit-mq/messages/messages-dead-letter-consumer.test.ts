// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MESSAGES_DLX, MESSAGES_QUEUES } from '@citrineos/types';
import type * as amqplib from 'amqplib';
import { MessagesDeadLetterConsumer } from '@/transport/index.js';
import { aMockAmqpChannel } from '@test/providers/rabbit-mq-provider.js';
import {
  aChannelManagerPerChannelId,
  aConnectionEvent,
  aFrameEvent,
} from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OCPP_DLQ = 'messages.ocpp.dlq';
const CONNECTIONS_DLQ = 'messages.connections.dlq';

function aDeadLetter(
  body: unknown,
  override?: {
    reason?: string;
    originQueue?: string;
    count?: number;
    routingKey?: string;
    noDeathHeader?: boolean;
  },
): amqplib.ConsumeMessage {
  return {
    content: Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)),
    properties: {
      headers: override?.noDeathHeader
        ? {}
        : {
            'x-death': [
              {
                reason: override?.reason ?? 'rejected',
                queue: override?.originQueue ?? 'messages.ocpp',
                count: override?.count ?? 1,
                'routing-keys': [override?.routingKey ?? 'frame.inbound.Heartbeat'],
              },
            ],
          },
    } as unknown as amqplib.MessageProperties,
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: MESSAGES_DLX,
      routingKey: override?.routingKey ?? 'frame.inbound.Heartbeat',
      consumerTag: 'test-consumer',
    } as amqplib.GetMessageFields,
  } as amqplib.ConsumeMessage;
}

describe('MessagesDeadLetterConsumer', () => {
  const { container, logger } = createTestContainer();
  let harness: ReturnType<typeof aChannelManagerPerChannelId>;
  let consumer: MessagesDeadLetterConsumer;

  function channelFor(dlq: string): amqplib.Channel {
    return harness.channels.get(`messages-dlq-consumer-${dlq}`)!;
  }

  async function deliver(dlq: string, message: amqplib.ConsumeMessage | null): Promise<void> {
    const onDelivery = (channelFor(dlq).consume as any).mock.calls[0][1];
    await onDelivery(message);
  }

  function reportOf(call = 0): any {
    return logger.error.mock.calls[call][1];
  }

  function messageOf(call = 0): string {
    return String(logger.error.mock.calls[call][0]);
  }

  beforeEach(() => {
    harness = aChannelManagerPerChannelId(aMockAmqpChannel);
    consumer = getTestInstance(container, MessagesDeadLetterConsumer, {
      channelManager: harness.channelManager,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribe ─────────────────────────────────────────────────────────────

  describe('start', () => {
    it('should consume both dead-letter queues', async () => {
      await consumer.start();

      expect(consumer.consumedQueues).toEqual([OCPP_DLQ, CONNECTIONS_DLQ]);
    });

    it('should never consume the work queues', async () => {
      await consumer.start();

      for (const spec of MESSAGES_QUEUES) {
        expect(consumer.consumedQueues).not.toContain(spec.queue);
      }
      for (const channel of harness.channels.values()) {
        const consumed = (channel.consume as any).mock.calls.map(([queue]: [string]) => queue);
        expect(consumed.every((queue: string) => queue.endsWith('.dlq'))).toBe(true);
      }
    });

    it('should give each dead-letter queue its own channel', async () => {
      await consumer.start();

      expect([...harness.channels.keys()]).toEqual([
        `messages-dlq-consumer-${OCPP_DLQ}`,
        `messages-dlq-consumer-${CONNECTIONS_DLQ}`,
      ]);
      expect(channelFor(OCPP_DLQ)).not.toBe(channelFor(CONNECTIONS_DLQ));
    });

    it('should assert the dead-letter topology so it may start before anything publishes', async () => {
      await consumer.start();

      for (const spec of MESSAGES_QUEUES) {
        const channel = channelFor(spec.dlq);
        expect(channel.assertExchange).toHaveBeenCalledWith(MESSAGES_DLX, 'topic', {
          durable: true,
        });
        expect(channel.assertQueue).toHaveBeenCalledWith(spec.dlq, {
          durable: true,
          autoDelete: false,
        });
        expect(channel.bindQueue).toHaveBeenCalledWith(spec.dlq, MESSAGES_DLX, spec.binding);
      }
    });

    it('should not declare a dead-letter exchange on the dead-letter queues themselves', async () => {
      await consumer.start();

      expect(channelFor(OCPP_DLQ).assertQueue).not.toHaveBeenCalledWith(
        OCPP_DLQ,
        expect.objectContaining({ arguments: expect.anything() }),
      );
    });

    it('should still drain one queue when the other cannot be consumed', async () => {
      const failing = aMockAmqpChannel();
      (failing.consume as any).mockRejectedValue(new Error('queue locked'));
      (harness.channelManager.getChannel as any).mockImplementation(async (channelId: string) => {
        if (channelId.endsWith(OCPP_DLQ)) return failing;
        if (!harness.channels.has(channelId)) harness.channels.set(channelId, aMockAmqpChannel());
        return harness.channels.get(channelId)!;
      });

      await consumer.start();

      expect(consumer.consumedQueues).toEqual([CONNECTIONS_DLQ]);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should not re-consume a queue it is already consuming', async () => {
      await consumer.start();
      await consumer.subscribe();

      expect(channelFor(OCPP_DLQ).consume).toHaveBeenCalledTimes(1);
    });
  });

  describe('reconnect', () => {
    it('should re-subscribe, because the old consumer tags died with the channel', async () => {
      await consumer.start();

      harness.connectionManager.emit('connected');
      await vi.waitFor(() => expect(channelFor(OCPP_DLQ).consume).toHaveBeenCalledTimes(2));
      expect(consumer.consumedQueues).toEqual([OCPP_DLQ, CONNECTIONS_DLQ]);
    });

    it('should ignore a reconnect before it was ever started', () => {
      harness.connectionManager.emit('connected');

      expect(harness.channelManager.getChannel).not.toHaveBeenCalled();
    });

    it('should ignore a reconnect after shutdown', async () => {
      await consumer.start();
      await consumer.shutdown();
      (channelFor(OCPP_DLQ).consume as any).mockClear();

      harness.connectionManager.emit('connected');
      await Promise.resolve();

      expect(channelFor(OCPP_DLQ).consume).not.toHaveBeenCalled();
    });
  });

  // ─── reporting ─────────────────────────────────────────────────────────────

  describe('reporting', () => {
    beforeEach(async () => {
      await consumer.start();
      logger.error.mockClear();
    });

    it('should report why and where the event died', async () => {
      await deliver(
        OCPP_DLQ,
        aDeadLetter(aFrameEvent(), {
          reason: 'rejected',
          originQueue: 'messages.ocpp',
          count: 2,
        }),
      );

      expect(reportOf()).toMatchObject({
        dlq: OCPP_DLQ,
        originQueue: 'messages.ocpp',
        reason: 'rejected',
        deaths: 2,
        routingKey: 'frame.inbound.Heartbeat',
      });
    });

    it('should report the envelope facets when the body was still readable', async () => {
      const event = aFrameEvent();

      await deliver(OCPP_DLQ, aDeadLetter(event));

      expect(reportOf()).toMatchObject({
        kind: 'frame',
        tenantId: event.tenantId,
        ocppConnectionName: event.ocppConnectionName,
        correlationId: event.correlationId,
      });
    });

    it('should carry the whole body, which is all that survives the ack', async () => {
      const event = aFrameEvent();

      await deliver(OCPP_DLQ, aDeadLetter(event));

      expect(JSON.parse(reportOf().body)).toEqual(JSON.parse(JSON.stringify(event)));
    });

    it('should report a connection event off its own queue', async () => {
      await deliver(
        CONNECTIONS_DLQ,
        aDeadLetter(aConnectionEvent(), {
          originQueue: 'messages.connections',
          routingKey: 'connection.connected',
        }),
      );

      expect(reportOf()).toMatchObject({
        dlq: CONNECTIONS_DLQ,
        kind: 'connection',
        routingKey: 'connection.connected',
      });
    });

    it('should say the event is dropped, so the log is not read as a retry', async () => {
      await deliver(OCPP_DLQ, aDeadLetter(aFrameEvent()));

      expect(messageOf()).toContain('no recovery is implemented yet');
    });

    it('should report an unreadable body without any envelope facets', async () => {
      await deliver(OCPP_DLQ, aDeadLetter('}}not json{{'));

      expect(messageOf()).toContain('unreadable event');
      expect(reportOf()).toMatchObject({
        body: '}}not json{{',
        kind: undefined,
        tenantId: undefined,
        correlationId: undefined,
      });
    });

    it('should report a JSON body that is not an object', async () => {
      await deliver(OCPP_DLQ, aDeadLetter('"just a string"'));

      expect(reportOf()).toMatchObject({ body: '"just a string"', kind: undefined });
    });

    it('should report an event published straight to the dead-letter exchange', async () => {
      await deliver(OCPP_DLQ, aDeadLetter(aFrameEvent(), { noDeathHeader: true }));

      expect(reportOf()).toMatchObject({ reason: undefined, originQueue: undefined });
      expect(messageOf()).toContain('reason: unknown');
    });
  });

  // ─── acking ────────────────────────────────────────────────────────────────

  describe('acking', () => {
    beforeEach(async () => {
      await consumer.start();
    });

    it('should ack a reported event, because an unacked delivery is redelivered forever', async () => {
      await deliver(OCPP_DLQ, aDeadLetter(aFrameEvent()));

      expect(channelFor(OCPP_DLQ).ack).toHaveBeenCalled();
    });

    it('should never nack, which would bounce the event around the dead-letter exchange', async () => {
      await deliver(OCPP_DLQ, aDeadLetter('}}not json{{'));

      expect(channelFor(OCPP_DLQ).nack).not.toHaveBeenCalled();
      expect(channelFor(OCPP_DLQ).ack).toHaveBeenCalled();
    });

    it('should still ack when reporting itself throws', async () => {
      logger.error.mockImplementationOnce(() => {
        throw new Error('log transport down');
      });

      await deliver(OCPP_DLQ, aDeadLetter(aFrameEvent()));

      expect(channelFor(OCPP_DLQ).ack).toHaveBeenCalled();
    });

    it('should ignore a null delivery, which is a cancelled consumer rather than an event', async () => {
      await deliver(OCPP_DLQ, null);

      expect(channelFor(OCPP_DLQ).ack).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  // ─── shutdown ──────────────────────────────────────────────────────────────

  describe('shutdown', () => {
    it('should cancel every consumer and forget the queues', async () => {
      await consumer.start();

      await consumer.shutdown();

      expect(channelFor(OCPP_DLQ).cancel).toHaveBeenCalledWith('consumer-tag-1');
      expect(channelFor(CONNECTIONS_DLQ).cancel).toHaveBeenCalledWith('consumer-tag-1');
      expect(consumer.consumedQueues).toEqual([]);
    });

    it('should keep cancelling the rest when one cancel fails', async () => {
      await consumer.start();
      (channelFor(OCPP_DLQ).cancel as any).mockRejectedValue(new Error('channel gone'));

      await expect(consumer.shutdown()).resolves.toBeUndefined();

      expect(channelFor(CONNECTIONS_DLQ).cancel).toHaveBeenCalled();
      expect(consumer.consumedQueues).toEqual([]);
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
