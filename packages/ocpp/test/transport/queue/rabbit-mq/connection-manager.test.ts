// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { EventEmitter } from 'events';
import { RabbitMQConnectionManager } from '@/transport/queue/rabbit-mq/connection-manager.js';
import amqp from 'amqplib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('amqplib', () => ({ default: { connect: vi.fn() } }));

describe('RabbitMQConnectionManager', () => {
  let manager: RabbitMQConnectionManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new RabbitMQConnectionManager({ maxReconnectDelay: 1000, amqpUrl: 'amqp://x' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(amqp.connect).mockReset();
  });

  function aFakeConnection(): amqp.ChannelModel {
    return Object.assign(new EventEmitter(), {
      close: vi.fn().mockResolvedValue(undefined),
    }) as unknown as amqp.ChannelModel;
  }

  it('should survive a connection error with no error listener and reconnect', async () => {
    // amqplib emits 'error' then 'close' when the broker drops an established
    // socket ("Unexpected close"). Re-emitting that 'error' with nobody
    // listening used to throw an unhandled 'error' event and kill the process.
    const first = aFakeConnection();
    const second = aFakeConnection();
    vi.mocked(amqp.connect).mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    await manager.connect();

    expect(() => {
      first.emit('error', new Error('Unexpected close'));
      first.emit('close');
    }).not.toThrow();
    expect(manager.isConnected()).toBe(false);

    await vi.runAllTimersAsync();

    expect(amqp.connect).toHaveBeenCalledTimes(2);
    expect(manager.isConnected()).toBe(true);
  });

  it('should still forward connection errors to registered listeners', async () => {
    const connection = aFakeConnection();
    vi.mocked(amqp.connect).mockResolvedValueOnce(connection);
    await manager.connect();
    const onError = vi.fn();
    manager.on('error', onError);

    const err = new Error('boom');
    connection.emit('error', err);

    expect(onError).toHaveBeenCalledWith(err);
  });
});
