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
import { RabbitMqReemitter } from '@/transport/queue/rabbit-mq/reemitter.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aMockAmqpChannel,
  aMockChannelManager,
  aMockDeadLetterPublisher,
  aSystemConfigWithAmqp,
  type MockDeadLetterPublisher,
} from '../../../providers/rabbit-mq-provider.js';

const NOW = new Date('2026-09-01T12:00:00.000Z');

describe('RabbitMqReemitter', () => {
  const { container, logger } = createTestContainer();
  let channel: ReturnType<typeof aMockAmqpChannel>;
  let deadLetterPublisher: MockDeadLetterPublisher;

  function aReemitter(override?: Parameters<typeof aSystemConfigWithAmqp>[0]): RabbitMqReemitter {
    return getTestInstance(container, RabbitMqReemitter, {
      config: aSystemConfigWithAmqp(override),
      channelManager: aMockChannelManager(channel),
      deadLetterPublisher,
    });
  }

  function aCall(sentAt: Date = NOW) {
    return RequestBuilder.buildCall(
      'CS001',
      'corr-1',
      1,
      OCPP_CallAction.Reset,
      { type: 'Immediate' } as OcppRequest,
      EventGroup.Configuration,
      MessageOrigin.ChargingStationManagementSystem,
      OCPPVersion.OCPP2_0_1,
      sentAt,
    );
  }

  function publishes() {
    return vi.mocked(channel.publish).mock.calls.map(([exchange, , content, options]) => ({
      exchange,
      content,
      options: options ?? {},
    }));
  }

  /** Hands the n-th publish back as the broker does for a message no binding matched. */
  function returnPublish(n: number): void {
    const listener = vi.mocked(channel.on).mock.calls.find(([event]) => event === 'return');
    if (!listener) throw new Error('no return listener registered');
    const { content, options } = publishes()[n];
    listener[1]({ content, properties: { headers: options.headers }, fields: {} });
  }

  /** Returns each publish as it happens, as the broker would while no router holds the station. */
  async function returnEveryPublish(): Promise<void> {
    for (let n = 0; publishes().length === n + 1 && n < 50; n++) {
      returnPublish(n);
      await vi.advanceTimersByTimeAsync(6_000);
    }
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    logger.info.mockClear();
    channel = aMockAmqpChannel();
    deadLetterPublisher = aMockDeadLetterPublisher();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should publish mandatory to the exchange with what is left of the TTL', async () => {
    const reemitter = aReemitter({ staleCallMaxAgeSeconds: 30 });
    vi.setSystemTime(new Date(NOW.getTime() + 10_000));

    await reemitter.reemit(aCall());

    const [{ exchange, options }] = publishes();
    expect(exchange).toBe('test-exchange');
    expect(options.mandatory).toBe(true);
    expect(options.expiration).toBe('20000');
    expect(options.headers).toMatchObject({
      ocppConnectionName: 'CS001',
      tenantId: '1',
      'x-citrineos-reemit-attempt': 0,
    });
  });

  it('should dead-letter a message that is already stale instead of re-emitting it', async () => {
    const reemitter = aReemitter({ staleCallMaxAgeSeconds: 30 });
    const call = aCall(new Date(NOW.getTime() - 31_000));

    await reemitter.reemit(call);

    expect(channel.publish).not.toHaveBeenCalled();
    expect(deadLetterPublisher.publishMessage).toHaveBeenCalledWith(call, 'stale', 'router');
  });

  it('should retry with backoff when the broker returns it because no router holds the station', async () => {
    const reemitter = aReemitter({ staleCallMaxAgeSeconds: 30 });
    await reemitter.reemit(aCall());

    returnPublish(0);
    await vi.advanceTimersByTimeAsync(5_000);

    expect(channel.publish).toHaveBeenCalledTimes(2);
    expect(publishes()[1].options.headers).toMatchObject({ 'x-citrineos-reemit-attempt': 1 });
  });

  it('should register one return listener per channel', async () => {
    const reemitter = aReemitter({ staleCallMaxAgeSeconds: 30 });

    await reemitter.reemit(aCall());
    await reemitter.reemit(aCall());

    const returnListeners = vi
      .mocked(channel.on)
      .mock.calls.filter(([event]) => event === 'return');
    expect(returnListeners).toHaveLength(1);
  });

  it('should dead-letter as unroutable once no router has taken it before it went stale', async () => {
    const reemitter = aReemitter({ staleCallMaxAgeSeconds: 2 });
    await reemitter.reemit(aCall());

    await returnEveryPublish();

    expect(publishes().length).toBeGreaterThan(1);
    expect(deadLetterPublisher.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({ context: expect.objectContaining({ correlationId: 'corr-1' }) }),
      'unroutable',
      'router',
    );
  });

  it('should stop re-emitting after reemitMaxRetrySeconds, even a message that never goes stale', async () => {
    const reemitter = aReemitter({ staleCallMaxAgeSeconds: 0, reemitMaxRetrySeconds: 20 });
    await reemitter.reemit(aCall(new Date(NOW.getTime() - 3_600_000)));

    await returnEveryPublish();

    expect(Date.now() - NOW.getTime()).toBeGreaterThanOrEqual(20_000);
    expect(Date.now() - NOW.getTime()).toBeLessThan(40_000);
    expect(deadLetterPublisher.publishMessage).toHaveBeenCalledWith(
      expect.anything(),
      'unroutable',
      'router',
    );
  });

  it('should stop at reemitMaxRetrySeconds when that comes before the message goes stale', async () => {
    const reemitter = aReemitter({ staleCallMaxAgeSeconds: 600, reemitMaxRetrySeconds: 20 });
    await reemitter.reemit(aCall());

    await returnEveryPublish();

    expect(Date.now() - NOW.getTime()).toBeLessThan(40_000);
    expect(deadLetterPublisher.publishMessage).toHaveBeenCalledWith(
      expect.anything(),
      'unroutable',
      'router',
    );
  });

  it('should log at info once when a message first finds no router, and when it gives up', async () => {
    const reemitter = aReemitter({ staleCallMaxAgeSeconds: 2 });
    await reemitter.reemit(aCall());

    await returnEveryPublish();

    const infos = logger.info.mock.calls.map(([line]) => String(line));
    expect(infos.filter((line) => line.startsWith('No router holds CS001'))).toHaveLength(1);
    expect(infos.filter((line) => line.startsWith('Dead-lettering Reset for CS001'))).toHaveLength(
      1,
    );
  });

  it('should dead-letter messages still waiting for a retry on shutdown', async () => {
    const reemitter = aReemitter({ staleCallMaxAgeSeconds: 30 });
    await reemitter.reemit(aCall());
    returnPublish(0);

    await reemitter.shutdown();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(channel.publish).toHaveBeenCalledTimes(1);
    expect(deadLetterPublisher.publishMessage).toHaveBeenCalledWith(
      expect.anything(),
      'shutdown',
      'router',
    );
  });
});
