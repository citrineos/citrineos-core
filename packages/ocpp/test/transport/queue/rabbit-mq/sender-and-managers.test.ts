// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { EventEmitter } from 'events';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
  type MockInstance,
} from 'vitest';
import amqp from 'amqplib';
import type { IConnectionManager, IMessage, IMessageSender } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
  type OcppRequest,
} from '@citrineos/types';
import { RabbitMqSender } from '@/transport/queue/rabbit-mq/sender.js';
import { RabbitMQChannelManager } from '@/transport/queue/rabbit-mq/channel-manager.js';
import { RabbitMQConnectionManager } from '@/transport/queue/rabbit-mq/connection-manager.js';
import { BrokerAwareMessageSender } from '@/transport/queue/broker-aware-message-sender.js';
import { aMockAmqpChannel, aMockChannelManager } from '../../../providers/rabbit-mq-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

vi.mock('amqplib', () => ({
  default: { connect: vi.fn() },
}));

const mockAmqpConnect = amqp.connect as unknown as Mock;

const { container, logger } = createTestContainer();

/** Plain IMessage with a full context; state and payload left unset unless overridden. */
function aMessage(override?: Partial<IMessage<OcppRequest>>): IMessage<OcppRequest> {
  return {
    origin: MessageOrigin.ChargingStationManagementSystem,
    eventGroup: EventGroup.All,
    action: OCPP_CallAction.Heartbeat,
    state: undefined,
    context: {
      correlationId: 'corr-1',
      tenantId: 1,
      ocppConnectionName: 'CS001',
      timestamp: '2026-01-01T00:00:00.000Z',
    },
    payload: undefined,
    protocol: OCPPVersion.OCPP2_0_1,
    ...override,
  } as unknown as IMessage<OcppRequest>;
}

type PublishChannel = amqp.Channel & { publish: Mock };

/** Provider channel stub extended with the publish method the sender needs. */
function aPublishChannel(publishResult = true): PublishChannel {
  const channel = aMockAmqpChannel() as PublishChannel;
  channel.publish = vi.fn().mockReturnValue(publishResult);
  return channel;
}

/** amqplib connection stub for the managers: event emitter + createChannel/close. */
function aFakeAmqpConnection() {
  const conn = new EventEmitter() as EventEmitter & { createChannel: Mock; close: Mock };
  conn.createChannel = vi.fn();
  conn.close = vi.fn().mockResolvedValue(undefined);
  return conn;
}

/** Connection manager stub for ChannelManager: real emitter so events reach the handlers. */
function aFakeConnectionManager(connection: ReturnType<typeof aFakeAmqpConnection>) {
  const mgr = new EventEmitter() as EventEmitter & { connect: Mock; isConnected: Mock };
  mgr.connect = vi.fn().mockResolvedValue(connection);
  mgr.isConnected = vi.fn().mockReturnValue(true);
  return mgr;
}

// ---------------------------------------------------------------------------
// RabbitMqSender — publish paths (exchange, routing key, headers, payload)
// ---------------------------------------------------------------------------
describe('RabbitMqSender', () => {
  let channel: PublishChannel;
  let channelManager: ReturnType<typeof aMockChannelManager>;
  let connectionManager: { isConnected: Mock };
  let sender: RabbitMqSender;

  beforeEach(() => {
    channel = aPublishChannel();
    channelManager = aMockChannelManager(channel);
    connectionManager = { isConnected: vi.fn().mockReturnValue(true) };
    sender = new RabbitMqSender(
      'test-exchange',
      connectionManager as unknown as RabbitMQConnectionManager,
      channelManager,
      logger,
    );
  });

  it('should publish a request to the exchange with empty routing key and full headers', async () => {
    const message = aMessage();

    const result = await sender.sendRequest(message, { customData: { vendorId: 'v1' } });

    expect(result).toEqual({ success: true });
    expect(channelManager.getChannel).toHaveBeenCalledTimes(1);
    expect(channelManager.getChannel).toHaveBeenCalledWith('sender');
    expect(channel.publish).toHaveBeenCalledTimes(1);

    const [exchange, routingKey, content, options] = channel.publish.mock.calls[0];
    expect(exchange).toBe('test-exchange');
    expect(routingKey).toBe('');
    expect(JSON.parse((content as Buffer).toString('utf-8'))).toEqual({
      origin: MessageOrigin.ChargingStationManagementSystem,
      eventGroup: EventGroup.All,
      action: OCPP_CallAction.Heartbeat,
      state: MessageState.Request,
      context: {
        correlationId: 'corr-1',
        tenantId: 1,
        ocppConnectionName: 'CS001',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
      payload: { customData: { vendorId: 'v1' } },
      protocol: OCPPVersion.OCPP2_0_1,
    });
    expect(options).toEqual({
      contentEncoding: 'utf-8',
      contentType: 'application/json',
      headers: {
        origin: MessageOrigin.ChargingStationManagementSystem,
        eventGroup: EventGroup.All,
        action: OCPP_CallAction.Heartbeat,
        state: '1',
        correlationId: 'corr-1',
        ocppConnectionName: 'CS001',
        timestamp: '2026-01-01T00:00:00.000Z',
        tenantId: '1',
      },
    });
  });

  it('should stamp Response state into the headers on sendResponse', async () => {
    await sender.sendResponse(aMessage(), { currentTime: 'now' });

    const [, , , options] = channel.publish.mock.calls[0];
    expect(options.headers.state).toBe('2');
  });

  it('should publish to the empty-string exchange when none is configured', async () => {
    const noExchangeSender = new RabbitMqSender(
      undefined as unknown as string,
      connectionManager as unknown as RabbitMQConnectionManager,
      channelManager,
      logger,
    );

    await noExchangeSender.sendRequest(aMessage(), {});

    expect(channel.publish.mock.calls[0][0]).toBe('');
  });

  it('should fail without publishing when the connection manager reports disconnected', async () => {
    connectionManager.isConnected.mockReturnValue(false);

    const result = await sender.sendRequest(aMessage(), {});

    expect(result).toEqual({
      success: false,
      payload: 'RabbitMQ disconnected. Cannot send message.',
    });
    expect(channelManager.getChannel).not.toHaveBeenCalled();
    expect(channel.publish).not.toHaveBeenCalled();
  });

  it('should fail when neither the message nor the call sets a state', async () => {
    const result = await sender.send(aMessage({ payload: { ok: true } }));

    expect(result).toEqual({ success: false, payload: 'Message state must be set' });
    expect(channelManager.getChannel).not.toHaveBeenCalled();
  });

  it('should fail when no payload is present on the message', async () => {
    const result = await sender.sendResponse(aMessage());

    expect(result).toEqual({ success: false, payload: 'Message payload must be set' });
    expect(channel.publish).not.toHaveBeenCalled();
  });

  it('should throw when the channel manager yields no channel', async () => {
    (channelManager.getChannel as Mock).mockResolvedValue(null);

    await expect(sender.sendRequest(aMessage(), {})).rejects.toThrow(
      'RabbitMQ is down: cannot send message.',
    );
  });

  it('should surface a false publish result as an unsuccessful confirmation', async () => {
    channel = aPublishChannel(false);
    channelManager = aMockChannelManager(channel);
    sender = new RabbitMqSender(
      'test-exchange',
      connectionManager as unknown as RabbitMQConnectionManager,
      channelManager,
      logger,
    );

    const result = await sender.sendRequest(aMessage(), {});

    expect(result).toEqual({ success: false });
    expect(channel.publish).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// RabbitMQChannelManager — channel caching, error recovery, reconnection
// ---------------------------------------------------------------------------
describe('RabbitMQChannelManager', () => {
  let connection: ReturnType<typeof aFakeAmqpConnection>;
  let connectionManager: ReturnType<typeof aFakeConnectionManager>;
  let manager: RabbitMQChannelManager;

  function aManagedChannel() {
    const ch = new EventEmitter() as EventEmitter & { close: Mock };
    ch.close = vi.fn().mockResolvedValue(undefined);
    return ch;
  }

  beforeEach(() => {
    connection = aFakeAmqpConnection();
    connectionManager = aFakeConnectionManager(connection);
    manager = getTestInstance(container, RabbitMQChannelManager, {
      connectionManager: connectionManager as unknown as RabbitMQConnectionManager,
    });
  });

  it('should create a channel once and reuse it for the same channel id', async () => {
    const ch = aManagedChannel();
    connection.createChannel.mockResolvedValue(ch);

    const first = await manager.getChannel('sender');
    const second = await manager.getChannel('sender');

    expect(first).toBe(ch);
    expect(second).toBe(ch);
    expect(connectionManager.connect).toHaveBeenCalledTimes(1);
    expect(connection.createChannel).toHaveBeenCalledTimes(1);
  });

  it('should create separate channels for distinct channel ids', async () => {
    const chA = aManagedChannel();
    const chB = aManagedChannel();
    connection.createChannel.mockResolvedValueOnce(chA).mockResolvedValueOnce(chB);

    const sender = await manager.getChannel('sender');
    const receiver = await manager.getChannel('receiver');

    expect(sender).toBe(chA);
    expect(receiver).toBe(chB);
    expect(connection.createChannel).toHaveBeenCalledTimes(2);
  });

  it('should recreate the channel after a channel error event', async () => {
    const chA = aManagedChannel();
    const chB = aManagedChannel();
    connection.createChannel.mockResolvedValueOnce(chA).mockResolvedValueOnce(chB);

    await manager.getChannel('sender');
    chA.emit('error', new Error('channel torn down'));
    const replacement = await manager.getChannel('sender');

    expect(replacement).toBe(chB);
    expect(connection.createChannel).toHaveBeenCalledTimes(2);
  });

  it('should recreate the channel after a channel close event', async () => {
    const chA = aManagedChannel();
    const chB = aManagedChannel();
    connection.createChannel.mockResolvedValueOnce(chA).mockResolvedValueOnce(chB);

    await manager.getChannel('sender');
    chA.emit('close');
    const replacement = await manager.getChannel('sender');

    expect(replacement).toBe(chB);
    expect(connection.createChannel).toHaveBeenCalledTimes(2);
  });

  it('should clear channels on disconnect and recreate them when the connection returns', async () => {
    const chA = aManagedChannel();
    const chB = aManagedChannel();
    connection.createChannel.mockResolvedValueOnce(chA).mockResolvedValueOnce(chB);

    await manager.getChannel('sender');
    connectionManager.emit('disconnected');
    connectionManager.emit('connected');
    // recreateChannels runs fire-and-forget; let its promises settle
    await new Promise((resolve) => setImmediate(resolve));

    expect(connection.createChannel).toHaveBeenCalledTimes(2);
    expect(await manager.getChannel('sender')).toBe(chB);
  });

  it('should propagate a connect failure from getChannel', async () => {
    connectionManager.connect.mockRejectedValueOnce(new Error('broker down'));

    await expect(manager.getChannel('sender')).rejects.toThrow('broker down');
  });

  it('should close and forget a channel on closeChannel, then build a fresh one', async () => {
    const chA = aManagedChannel();
    const chB = aManagedChannel();
    connection.createChannel.mockResolvedValueOnce(chA).mockResolvedValueOnce(chB);

    await manager.getChannel('sender');
    await manager.closeChannel('sender');

    expect(chA.close).toHaveBeenCalledTimes(1);
    expect(await manager.getChannel('sender')).toBe(chB);
  });

  it('should ignore closeChannel for an unknown channel id', async () => {
    await expect(manager.closeChannel('nope')).resolves.toBeUndefined();
  });

  it('should close every channel on closeAll and keep going past a close failure', async () => {
    const chA = aManagedChannel();
    const chB = aManagedChannel();
    chA.close.mockRejectedValueOnce(new Error('already closed'));
    connection.createChannel.mockResolvedValueOnce(chA).mockResolvedValueOnce(chB);
    await manager.getChannel('a');
    await manager.getChannel('b');
    logger.error.mockClear();

    await manager.closeAll();

    expect(chA.close).toHaveBeenCalledTimes(1);
    expect(chB.close).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error closing channel a'),
      expect.any(Error),
    );
  });

  it('should expose the connection manager it was built with', () => {
    expect(manager.getConnectionManager()).toBe(connectionManager);
  });
});

// ---------------------------------------------------------------------------
// RabbitMQConnectionManager — connect, reconnect scheduling, close
// ---------------------------------------------------------------------------
describe('RabbitMQConnectionManager', () => {
  let connection: ReturnType<typeof aFakeAmqpConnection>;
  let manager: RabbitMQConnectionManager;
  let randomSpy: MockInstance<() => number>;

  beforeEach(() => {
    mockAmqpConnect.mockReset();
    connection = aFakeAmqpConnection();
    // random=0 makes the reconnect delay exactly the 1000ms base
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    manager = getTestInstance(container, RabbitMQConnectionManager, {
      maxReconnectDelay: 5000,
      amqpUrl: 'amqp://test-host',
    });
  });

  afterEach(() => {
    randomSpy.mockRestore();
    vi.useRealTimers();
  });

  it('should connect to the configured url, emit connected, and report connected state', async () => {
    mockAmqpConnect.mockResolvedValue(connection);
    const connectedSpy = vi.fn();
    manager.on('connected', connectedSpy);
    expect(manager.isConnected()).toBe(false);

    const result = await manager.connect();

    expect(result).toBe(connection);
    expect(mockAmqpConnect).toHaveBeenCalledTimes(1);
    expect(mockAmqpConnect).toHaveBeenCalledWith('amqp://test-host');
    expect(connectedSpy).toHaveBeenCalledWith(connection);
    expect(manager.isConnected()).toBe(true);
    expect(manager.state).toBe('connected');
  });

  it('should return the existing connection without dialing again', async () => {
    mockAmqpConnect.mockResolvedValue(connection);

    const first = await manager.connect();
    const second = await manager.connect();

    expect(second).toBe(first);
    expect(mockAmqpConnect).toHaveBeenCalledTimes(1);
  });

  it('should share one in-flight attempt between concurrent connect calls', async () => {
    let resolveDial!: (value: unknown) => void;
    mockAmqpConnect.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDial = resolve;
        }),
    );

    const p1 = manager.connect();
    const p2 = manager.connect();
    resolveDial(connection);
    const [first, second] = await Promise.all([p1, p2]);

    expect(first).toBe(connection);
    expect(second).toBe(connection);
    expect(mockAmqpConnect).toHaveBeenCalledTimes(1);
  });

  it('should rethrow a dial failure and dial again after the backoff delay', async () => {
    vi.useFakeTimers();
    mockAmqpConnect
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(connection);

    await expect(manager.connect()).rejects.toThrow('ECONNREFUSED');
    expect(manager.isConnected()).toBe(false);

    // attempt 1, random=0 => delay is the flat 1000ms base
    await vi.advanceTimersByTimeAsync(1000);

    expect(mockAmqpConnect).toHaveBeenCalledTimes(2);
    expect(manager.isConnected()).toBe(true);
  });

  it('should emit disconnected on an unexpected close and reconnect on the timer', async () => {
    vi.useFakeTimers();
    mockAmqpConnect.mockResolvedValue(connection);
    const disconnectedSpy = vi.fn();
    manager.on('disconnected', disconnectedSpy);
    await manager.connect();

    connection.emit('close');

    expect(disconnectedSpy).toHaveBeenCalledTimes(1);
    expect(manager.isConnected()).toBe(false);
    expect(manager.state).toBe('disconnected');

    await vi.advanceTimersByTimeAsync(1000);

    expect(mockAmqpConnect).toHaveBeenCalledTimes(2);
    expect(manager.isConnected()).toBe(true);
  });

  it('should re-emit a connection error event on the manager', async () => {
    mockAmqpConnect.mockResolvedValue(connection);
    await manager.connect();
    const errorSpy = vi.fn();
    manager.on('error', errorSpy);

    connection.emit('error', new Error('heartbeat lost'));

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect((errorSpy.mock.calls[0][0] as Error).message).toBe('heartbeat lost');
  });

  it('should close the active connection and report disconnected', async () => {
    mockAmqpConnect.mockResolvedValue(connection);
    await manager.connect();

    await manager.close();

    expect(connection.close).toHaveBeenCalledTimes(1);
    expect(manager.isConnected()).toBe(false);
    expect(manager.state).toBe('closed');
  });

  it('should cancel a pending reconnect timer on close', async () => {
    vi.useFakeTimers();
    mockAmqpConnect.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(manager.connect()).rejects.toThrow('ECONNREFUSED');

    await manager.close();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(mockAmqpConnect).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// BrokerAwareMessageSender — delegation, Call timeouts, buffering and flush
// ---------------------------------------------------------------------------
describe('BrokerAwareMessageSender', () => {
  let inner: { send: Mock; shutdown: Mock };
  let connectionManager: EventEmitter & { isConnected: Mock };
  let sender: BrokerAwareMessageSender;
  let onCallTimeout: Mock;

  const MAX_CALL_LENGTH_SECONDS = 30;

  function flushMicrotasks() {
    return new Promise((resolve) => setImmediate(resolve));
  }

  beforeEach(() => {
    inner = {
      send: vi.fn().mockResolvedValue({ success: true }),
      shutdown: vi.fn().mockResolvedValue(undefined),
    };
    connectionManager = new EventEmitter() as EventEmitter & { isConnected: Mock };
    connectionManager.isConnected = vi.fn().mockReturnValue(true);
    onCallTimeout = vi.fn().mockResolvedValue(undefined);
    sender = new BrokerAwareMessageSender(
      inner as unknown as IMessageSender,
      connectionManager as unknown as IConnectionManager,
      MAX_CALL_LENGTH_SECONDS,
      logger,
    );
    sender.onCallTimeout = onCallTimeout;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delegate sendRequest to the inner sender with payload and Request state applied', async () => {
    const message = aMessage();
    const payload: OcppRequest = { customData: { vendorId: 'v1' } };

    const result = await sender.sendRequest(message, payload);

    expect(result).toEqual({ success: true });
    expect(inner.send).toHaveBeenCalledTimes(1);
    expect(inner.send).toHaveBeenCalledWith(message);
    expect(message.state).toBe(MessageState.Request);
    expect(message.payload).toBe(payload);
  });

  it('should delegate sendResponse with Response state applied', async () => {
    const message = aMessage();

    await sender.sendResponse(message, { currentTime: 'now' });

    expect(inner.send).toHaveBeenCalledTimes(1);
    expect(message.state).toBe(MessageState.Response);
  });

  it('should accept a Call while disconnected and fire onCallTimeout when the timer expires', async () => {
    vi.useFakeTimers();
    connectionManager.isConnected.mockReturnValue(false);

    const result = await sender.sendRequest(aMessage(), {});

    expect(result).toEqual({ success: true });
    expect(inner.send).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(MAX_CALL_LENGTH_SECONDS * 1000);

    expect(onCallTimeout).toHaveBeenCalledTimes(1);
    expect(onCallTimeout).toHaveBeenCalledWith('CS001', 1);
  });

  it('should keep a single timeout for duplicate Calls from the same connection', async () => {
    vi.useFakeTimers();
    connectionManager.isConnected.mockReturnValue(false);

    await sender.sendRequest(aMessage(), {});
    await sender.sendRequest(aMessage(), {});
    await vi.advanceTimersByTimeAsync(MAX_CALL_LENGTH_SECONDS * 1000);

    expect(onCallTimeout).toHaveBeenCalledTimes(1);
  });

  it('should buffer non-Call messages while disconnected and flush them in order on reconnect', async () => {
    connectionManager.isConnected.mockReturnValue(false);
    const first = aMessage({ context: { ...aMessage().context, correlationId: 'corr-A' } });
    const second = aMessage({ context: { ...aMessage().context, correlationId: 'corr-B' } });

    expect(await sender.sendResponse(first, {})).toEqual({ success: true });
    expect(await sender.sendResponse(second, {})).toEqual({ success: true });
    expect(inner.send).not.toHaveBeenCalled();

    connectionManager.isConnected.mockReturnValue(true);
    connectionManager.emit('connected');
    await flushMicrotasks();

    expect(inner.send).toHaveBeenCalledTimes(2);
    expect((inner.send.mock.calls[0][0] as IMessage<OcppRequest>).context.correlationId).toBe(
      'corr-A',
    );
    expect((inner.send.mock.calls[1][0] as IMessage<OcppRequest>).context.correlationId).toBe(
      'corr-B',
    );
  });

  it('should stop flushing and re-buffer the remainder when the broker drops mid-flush', async () => {
    connectionManager.isConnected.mockReturnValue(false);
    const first = aMessage({ context: { ...aMessage().context, correlationId: 'corr-A' } });
    const second = aMessage({ context: { ...aMessage().context, correlationId: 'corr-B' } });
    await sender.sendResponse(first, {});
    await sender.sendResponse(second, {});

    // connected for the first buffered message, gone again for the second
    connectionManager.isConnected.mockReturnValueOnce(true).mockReturnValue(false);
    connectionManager.emit('connected');
    await flushMicrotasks();

    expect(inner.send).toHaveBeenCalledTimes(1);
    expect((inner.send.mock.calls[0][0] as IMessage<OcppRequest>).context.correlationId).toBe(
      'corr-A',
    );

    connectionManager.isConnected.mockReturnValue(true);
    connectionManager.emit('connected');
    await flushMicrotasks();

    expect(inner.send).toHaveBeenCalledTimes(2);
    expect((inner.send.mock.calls[1][0] as IMessage<OcppRequest>).context.correlationId).toBe(
      'corr-B',
    );
  });

  it('should log a flush failure and continue with the next buffered message', async () => {
    connectionManager.isConnected.mockReturnValue(false);
    const first = aMessage({ context: { ...aMessage().context, correlationId: 'corr-A' } });
    const second = aMessage({ context: { ...aMessage().context, correlationId: 'corr-B' } });
    await sender.sendResponse(first, {});
    await sender.sendResponse(second, {});
    inner.send.mockRejectedValueOnce(new Error('publish blew up')).mockResolvedValue({
      success: true,
    });
    logger.error.mockClear();

    connectionManager.isConnected.mockReturnValue(true);
    connectionManager.emit('connected');
    await flushMicrotasks();

    expect(inner.send).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('error flushing message for CS001'),
      expect.any(Error),
    );
  });

  it('should clear Call timeouts and the buffer on shutdown', async () => {
    vi.useFakeTimers();
    connectionManager.isConnected.mockReturnValue(false);
    await sender.sendRequest(aMessage(), {});
    await sender.sendResponse(aMessage(), {});

    await sender.shutdown();

    expect(inner.shutdown).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(MAX_CALL_LENGTH_SECONDS * 1000);
    expect(onCallTimeout).not.toHaveBeenCalled();

    connectionManager.isConnected.mockReturnValue(true);
    connectionManager.emit('connected');
    await vi.advanceTimersByTimeAsync(0);
    expect(inner.send).not.toHaveBeenCalled();
  });
});
