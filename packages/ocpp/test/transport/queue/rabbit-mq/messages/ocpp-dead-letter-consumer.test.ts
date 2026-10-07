// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type * as amqplib from 'amqplib';
import { OcppDeadLetterConsumer } from '@/transport/index.js';
import { recordOcppDeadLetterReceived } from '@/transport/metrics.js';
import { aMockAmqpChannel, aSystemConfigWithAmqp } from '@test/providers/rabbit-mq-provider.js';
import { aChannelManagerPerChannelId } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/transport/metrics.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/transport/metrics.js')>()),
  recordOcppDeadLetterReceived: vi.fn(),
}));

const CHANNEL_ID = 'ocpp-dlq-consumer';

/** A dead letter as the router or a module publishes it. */
function aCitrineosDeadLetter(override?: {
  reason?: string;
  action?: string;
  error?: string;
}): amqplib.ConsumeMessage {
  return aDelivery({
    action: override?.action ?? 'Reset',
    tenantId: '1',
    ocppConnectionName: 'CS001',
    correlationId: 'corr-1',
    'x-citrineos-dead-letter-reason': override?.reason ?? 'stale',
    'x-citrineos-dead-letter-source': 'router',
    ...(override?.error && { 'x-citrineos-dead-letter-error': override.error }),
  });
}

/** A message the broker dead-lettered when its TTL ran out on a router's queue. */
function aBrokerExpiredDeadLetter(): amqplib.ConsumeMessage {
  return aDelivery({
    action: 'Reset',
    tenantId: '1',
    ocppConnectionName: 'CS001',
    'x-death': [{ reason: 'expired', queue: 'rabbit_queue_router_pod-1', count: 1 }],
  });
}

function aDelivery(headers: Record<string, unknown>): amqplib.ConsumeMessage {
  return {
    content: Buffer.from('{"action":"Reset"}'),
    properties: { headers } as unknown as amqplib.MessageProperties,
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: 'test-exchange.dlx',
      routingKey: '',
      consumerTag: 'test-consumer',
    },
  };
}

describe('OcppDeadLetterConsumer', () => {
  const { container, logger } = createTestContainer();
  let harness: ReturnType<typeof aChannelManagerPerChannelId>;
  let consumer: OcppDeadLetterConsumer;

  function channel(): amqplib.Channel {
    return harness.channels.get(CHANNEL_ID)!;
  }

  function deliver(message: amqplib.ConsumeMessage): void {
    const [, onDelivery] = vi.mocked(channel().consume).mock.calls[0];
    onDelivery(message);
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    harness = aChannelManagerPerChannelId(aMockAmqpChannel);
    consumer = getTestInstance(container, OcppDeadLetterConsumer, {
      config: aSystemConfigWithAmqp({ prefetch: { messagesDeadLetter: 7 } }),
      channelManager: harness.channelManager,
    });
    await consumer.start();
  });

  afterEach(async () => {
    await consumer.shutdown();
    vi.useRealTimers();
  });

  it('should declare a bounded dead-letter queue on the fanout DLX and drain it', () => {
    expect(channel().assertExchange).toHaveBeenCalledWith('test-exchange.dlx', 'fanout', {
      durable: true,
    });
    expect(channel().assertQueue).toHaveBeenCalledWith('test-exchange.dlq', {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-max-length': 100_000,
        'x-max-length-bytes': 512 * 1024 * 1024,
        'x-overflow': 'drop-head',
      },
    });
    expect(channel().bindQueue).toHaveBeenCalledWith('test-exchange.dlq', 'test-exchange.dlx', '');
    expect(channel().prefetch).toHaveBeenCalledWith(7);
    expect(channel().consume).toHaveBeenCalledWith('test-exchange.dlq', expect.any(Function));
  });

  it('should report why CitrineOS dropped a message, count it, and ack it', () => {
    const message = aCitrineosDeadLetter({ reason: 'handler_error', error: 'boom' });

    deliver(message);

    expect(recordOcppDeadLetterReceived).toHaveBeenCalledWith('handler_error', 'Reset');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('reason: handler_error, source: router'),
      expect.objectContaining({
        reason: 'handler_error',
        source: 'router',
        error: 'boom',
        action: 'Reset',
        tenantId: '1',
        ocppConnectionName: 'CS001',
        correlationId: 'corr-1',
        body: '{"action":"Reset"}',
      }),
    );
    expect(channel().ack).toHaveBeenCalledWith(message);
  });

  it('should take the reason and queue from x-death for a message the broker expired', () => {
    deliver(aBrokerExpiredDeadLetter());

    expect(recordOcppDeadLetterReceived).toHaveBeenCalledWith('expired', 'Reset');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('reason: expired, source: broker'),
      expect.objectContaining({ reason: 'expired', queue: 'rabbit_queue_router_pod-1' }),
    );
  });

  it('should log a kind of dead letter once per minute and summarise the rest', async () => {
    for (let i = 0; i < 5; i++) {
      deliver(aCitrineosDeadLetter());
    }
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(recordOcppDeadLetterReceived).toHaveBeenCalledTimes(5);

    await vi.advanceTimersByTimeAsync(60_000);

    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenLastCalledWith(
      '4 more dead letter(s) of Reset (reason: stale, source: router) in the last minute',
    );

    deliver(aCitrineosDeadLetter());
    expect(logger.error).toHaveBeenCalledTimes(3);
  });

  it('should log different reasons separately within a window', () => {
    deliver(aCitrineosDeadLetter({ reason: 'stale' }));
    deliver(aCitrineosDeadLetter({ reason: 'unroutable' }));
    deliver(aCitrineosDeadLetter({ reason: 'stale', action: 'RequestStartTransaction' }));

    expect(logger.error).toHaveBeenCalledTimes(3);
  });

  it('should consume again after the connection comes back', async () => {
    vi.mocked(channel().consume).mockClear();

    harness.connectionManager.emit('connected');
    await vi.advanceTimersByTimeAsync(0);

    expect(channel().consume).toHaveBeenCalledWith('test-exchange.dlq', expect.any(Function));
  });
});
