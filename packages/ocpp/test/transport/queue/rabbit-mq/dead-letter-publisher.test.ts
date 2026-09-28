// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { RequestBuilder } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  OCPP_CallAction,
  type OcppRequest,
  OCPPVersion,
} from '@citrineos/types';
import { RabbitMqDeadLetterPublisher } from '@/transport/queue/rabbit-mq/dead-letter-publisher.js';
import { recordOcppMessageDeadLettered } from '@/transport/metrics.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aMockAmqpChannel,
  aMockChannelManager,
  aSystemConfigWithAmqp,
} from '../../../providers/rabbit-mq-provider.js';

vi.mock('@/transport/metrics.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/transport/metrics.js')>()),
  recordOcppMessageDeadLettered: vi.fn(),
}));

describe('RabbitMqDeadLetterPublisher', () => {
  const { container, logger } = createTestContainer();
  let channel: ReturnType<typeof aMockAmqpChannel>;
  let channelManager: ReturnType<typeof aMockChannelManager>;
  let publisher: RabbitMqDeadLetterPublisher;

  function published() {
    const [exchange, routingKey, content, options] = vi.mocked(channel.publish).mock.calls[0];
    return { exchange, routingKey, content, options: options ?? {} };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    channel = aMockAmqpChannel();
    channelManager = aMockChannelManager(channel);
    publisher = getTestInstance(container, RabbitMqDeadLetterPublisher, {
      config: aSystemConfigWithAmqp(),
      channelManager,
    });
  });

  it('should publish the body unchanged to the fanout DLX, tagged with why and where', async () => {
    const content = Buffer.from('{"action":"Heartbeat"}');

    await publisher.publishRaw(
      content,
      { action: 'Heartbeat', tenantId: '1' },
      'handler_error',
      'module',
      { queue: 'rabbit_queue_Provisioning_requests', error: new Error('boom') },
    );

    expect(channel.assertExchange).toHaveBeenCalledWith('test-exchange.dlx', 'fanout', {
      durable: true,
    });
    const { exchange, routingKey, content: body, options } = published();
    expect(exchange).toBe('test-exchange.dlx');
    expect(routingKey).toBe('');
    expect(body).toBe(content);
    expect(options).toEqual({
      contentEncoding: 'utf-8',
      contentType: 'application/json',
      persistent: true,
      headers: {
        action: 'Heartbeat',
        tenantId: '1',
        'x-citrineos-dead-letter-reason': 'handler_error',
        'x-citrineos-dead-letter-source': 'module',
        'x-citrineos-dead-letter-queue': 'rabbit_queue_Provisioning_requests',
        'x-citrineos-dead-letter-error': 'boom',
      },
    });
    expect(recordOcppMessageDeadLettered).toHaveBeenCalledWith('handler_error', 'module');
  });

  it('should declare the DLX once per channel', async () => {
    await publisher.publishRaw(Buffer.from('{}'), {}, 'poison', 'router');
    await publisher.publishRaw(Buffer.from('{}'), {}, 'poison', 'router');

    expect(channel.assertExchange).toHaveBeenCalledTimes(1);
    expect(channel.publish).toHaveBeenCalledTimes(2);
  });

  it('should publish a message with its routing headers but without the TTL it was sent with', async () => {
    const call = RequestBuilder.buildCall(
      'CS001',
      'corr-1',
      1,
      OCPP_CallAction.Reset,
      { type: 'Immediate' } as OcppRequest,
      EventGroup.Configuration,
      MessageOrigin.ChargingStationManagementSystem,
      OCPPVersion.OCPP2_0_1,
    );

    await publisher.publishMessage(call, 'stale', 'router');

    const { content, options } = published();
    expect(JSON.parse(content.toString())).toMatchObject({
      action: OCPP_CallAction.Reset,
      context: { correlationId: 'corr-1', ocppConnectionName: 'CS001' },
    });
    expect(options.expiration).toBeUndefined();
    expect(options.headers).toMatchObject({
      action: OCPP_CallAction.Reset,
      ocppConnectionName: 'CS001',
      tenantId: '1',
      'x-citrineos-dead-letter-reason': 'stale',
      'x-citrineos-dead-letter-source': 'router',
    });
  });

  it('should log and swallow a failure to publish, so the caller still settles its delivery', async () => {
    vi.mocked(channelManager.getChannel).mockRejectedValueOnce(new Error('broker down'));

    await expect(
      publisher.publishRaw(Buffer.from('lost'), {}, 'stale', 'router'),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to dead-letter a message (stale) from router'),
      expect.anything(),
      'lost',
      expect.any(Error),
    );
  });
});
