// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RetryMessageError } from '@citrineos/types';

// amqplib and pg are mocked below; imports must go through the events barrel,
// mirroring how the transports import each other in production.
import type { IDtoEvent, IDtoPayload } from '../../src/events/index.js';
import {
  AbstractDtoModule,
  AsDtoEventHandler,
  DtoEvent,
  DtoEventObjectType,
  DtoEventType,
  PgNotifyEventSubscriber,
  RabbitMqDtoReceiver,
  RabbitMqDtoSender,
} from '../../src/events/index.js';
import { getDtoEventHandlerMetaData } from '../../src/events/as-dto-event-handler.js';

// Shared by the pg fixture and the client-options assertion.
const FIXTURE_VALUE = 'pw';

const amqp = vi.hoisted(() => ({ connect: vi.fn() }));

vi.mock('amqplib', () => ({
  connect: amqp.connect,
  default: { connect: amqp.connect },
}));

const pgMock = vi.hoisted(() => {
  const instances: any[] = [];
  class FakeClient {
    options: any;
    handlers: Record<string, Array<(arg?: any) => void>> = {};
    connect = vi.fn(async () => {});
    query = vi.fn(async () => {});
    end = vi.fn(async () => {});
    constructor(options: any) {
      this.options = options;
      instances.push(this);
    }
    on(event: string, cb: (arg?: any) => void): this {
      (this.handlers[event] ??= []).push(cb);
      return this;
    }
    emit(event: string, arg?: any): void {
      for (const cb of this.handlers[event] ?? []) cb(arg);
    }
  }
  return { instances, FakeClient };
});

vi.mock('pg', () => ({
  Client: pgMock.FakeClient,
  default: { Client: pgMock.FakeClient },
}));

function aLogger() {
  const logger: any = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    settings: { minLevel: 2 },
    getSubLogger: vi.fn(),
  };
  logger.getSubLogger.mockReturnValue(logger);
  return logger;
}

function aChannel() {
  return {
    on: vi.fn(),
    assertExchange: vi.fn().mockResolvedValue(undefined),
    assertQueue: vi.fn().mockResolvedValue(undefined),
    bindQueue: vi.fn().mockResolvedValue(undefined),
    consume: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockReturnValue(true),
    ack: vi.fn(),
    nack: vi.fn(),
  };
}

function aConnection(channel: ReturnType<typeof aChannel>) {
  return {
    connection: { on: vi.fn(), removeAllListeners: vi.fn() },
    createChannel: vi.fn().mockResolvedValue(channel),
  };
}

function amqpConfig() {
  return {
    messageBroker: { amqp: { url: 'amqp://mq.internal:5672', exchange: 'citrine-dto' } },
  } as never;
}

function pgConfig() {
  return {
    database: {
      host: 'db.internal',
      port: 5433,
      username: 'ocpi_user',
      password: FIXTURE_VALUE,
      database: 'citrine',
    },
  } as never;
}

function aDtoEvent() {
  return new DtoEvent(
    'evt-42',
    { eventType: DtoEventType.INSERT, objectType: DtoEventObjectType.Location },
    { id: 7 },
  );
}

beforeEach(() => {
  amqp.connect.mockReset();
  pgMock.instances.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RabbitMqDtoSender', () => {
  it('init connects to the configured url and registers a channel error listener', async () => {
    const channel = aChannel();
    const conn = aConnection(channel);
    amqp.connect.mockResolvedValue(conn);
    const sender = new RabbitMqDtoSender({ config: amqpConfig(), logger: aLogger() } as never);

    await sender.init();

    expect(amqp.connect).toHaveBeenCalledTimes(1);
    expect(amqp.connect).toHaveBeenCalledWith('amqp://mq.internal:5672');
    expect(channel.on).toHaveBeenCalledTimes(1);
    expect(channel.on.mock.calls[0][0]).toBe('error');
    const connEvents = conn.connection.on.mock.calls.map((c) => c[0]);
    expect(connEvents).toEqual(['close', 'error']);
  });

  it('sendEvent publishes the serialized event on the headers exchange', async () => {
    const channel = aChannel();
    amqp.connect.mockResolvedValue(aConnection(channel));
    const sender = new RabbitMqDtoSender({ config: amqpConfig(), logger: aLogger() } as never);
    await sender.init();

    const result = await sender.sendEvent(aDtoEvent());

    expect(result).toBe(true);
    expect(channel.assertExchange).toHaveBeenCalledTimes(1);
    expect(channel.assertExchange).toHaveBeenCalledWith('citrine-dto', 'headers', {
      durable: false,
    });
    expect(channel.publish).toHaveBeenCalledTimes(1);
    const [exchange, routingKey, body, options] = channel.publish.mock.calls[0];
    expect(exchange).toBe('citrine-dto');
    expect(routingKey).toBe('');
    expect(JSON.parse((body as Buffer).toString('utf-8'))).toEqual({
      _eventId: 'evt-42',
      _context: { eventType: 'INSERT', objectType: 'Location' },
      _payload: { id: 7 },
    });
    expect(options).toEqual({
      contentEncoding: 'utf-8',
      contentType: 'application/json',
      headers: { eventType: 'INSERT', objectType: 'Location', eventId: 'evt-42' },
    });
  });

  it('sendEvent without an open channel throws', async () => {
    const sender = new RabbitMqDtoSender({ config: amqpConfig(), logger: aLogger() } as never);

    await expect(sender.sendEvent(aDtoEvent())).rejects.toThrow(
      'RabbitMQ is down. Cannot send message.',
    );
  });

  it('init without a configured url rejects', async () => {
    const sender = new RabbitMqDtoSender({
      config: { messageBroker: {} } as never,
      logger: aLogger(),
    } as never);

    await expect(sender.init()).rejects.toThrow('RabbitMQ URL is not configured');
    expect(amqp.connect).not.toHaveBeenCalled();
  });

  it('init retries a failed connect after the 5s delay', async () => {
    vi.useFakeTimers();
    const channel = aChannel();
    amqp.connect
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(aConnection(channel));
    const logger = aLogger();
    const sender = new RabbitMqDtoSender({ config: amqpConfig(), logger } as never);

    const pending = sender.init();
    await vi.advanceTimersByTimeAsync(5000);
    await pending;

    expect(amqp.connect).toHaveBeenCalledTimes(2);
    expect(amqp.connect).toHaveBeenNthCalledWith(2, 'amqp://mq.internal:5672');
    expect(logger.error.mock.calls[0][0]).toBe(
      'RabbitMQ reconnect attempt 1 failed (context: _connectWithRetry)',
    );
  });

  it('connection close reconnects and publishes on the new channel', async () => {
    const channel1 = aChannel();
    const conn1 = aConnection(channel1);
    const channel2 = aChannel();
    amqp.connect.mockResolvedValueOnce(conn1).mockResolvedValueOnce(aConnection(channel2));
    const logger = aLogger();
    const sender = new RabbitMqDtoSender({ config: amqpConfig(), logger } as never);
    await sender.init();

    const closeHandler = conn1.connection.on.mock.calls.filter((c) => c[0] === 'close')[0][1] as (
      ...args: unknown[]
    ) => void;
    closeHandler();
    await vi.waitFor(() =>
      expect(logger.info).toHaveBeenCalledWith('RabbitMQ reconnected successfully.'),
    );
    expect(amqp.connect).toHaveBeenCalledTimes(2);

    await sender.sendEvent(aDtoEvent());
    expect(channel2.publish).toHaveBeenCalledTimes(1);
    expect(channel1.publish).not.toHaveBeenCalled();
  });
});

describe('RabbitMqDtoReceiver', () => {
  async function initReceiver() {
    const channel = aChannel();
    amqp.connect.mockResolvedValue(aConnection(channel));
    const logger = aLogger();
    const receiver = new RabbitMqDtoReceiver(amqpConfig(), logger as never);
    await receiver.init();
    return { receiver, channel, logger };
  }

  it('subscribe binds a queue on the exchange with the merged headers filter', async () => {
    const { receiver, channel } = await initReceiver();

    const result = await receiver.subscribe(DtoEventType.INSERT, DtoEventObjectType.Location, {
      eventId: 'loc-1',
    });

    expect(result).toBe(true);
    expect(channel.assertExchange).toHaveBeenCalledTimes(1);
    expect(channel.assertExchange).toHaveBeenCalledWith('citrine-dto', 'headers', {
      durable: false,
    });
    const queueName = channel.assertQueue.mock.calls[0][0] as string;
    expect(queueName).toMatch(/^rabbit_queue_INSERT_Location_\d+$/);
    expect(channel.assertQueue).toHaveBeenCalledWith(queueName, {
      durable: false,
      autoDelete: true,
      exclusive: false,
    });
    expect(channel.bindQueue).toHaveBeenCalledTimes(1);
    expect(channel.bindQueue).toHaveBeenCalledWith(queueName, 'citrine-dto', '', {
      'x-match': 'all',
      eventType: 'INSERT',
      objectType: 'Location',
      eventId: 'loc-1',
    });
    expect(channel.consume).toHaveBeenCalledTimes(1);
    expect(channel.consume.mock.calls[0][0]).toBe(queueName);
  });

  it('subscribe without a filter still requires all headers to match', async () => {
    const { receiver, channel } = await initReceiver();

    await receiver.subscribe(DtoEventType.DELETE, DtoEventObjectType.Tariff);

    expect(channel.bindQueue.mock.calls[0][3]).toEqual({
      'x-match': 'all',
      eventType: 'DELETE',
      objectType: 'Tariff',
    });
  });

  it('subscribe before init throws', async () => {
    const receiver = new RabbitMqDtoReceiver(amqpConfig(), aLogger() as never);

    await expect(
      receiver.subscribe(DtoEventType.INSERT, DtoEventObjectType.Location),
    ).rejects.toThrow('RabbitMQ is down: cannot subscribe.');
  });

  it('consumed message is parsed, dispatched to the module, and acked', async () => {
    const { receiver, channel } = await initReceiver();
    const module = { handle: vi.fn().mockResolvedValue(undefined) };
    receiver.module = module as never;
    await receiver.subscribe(DtoEventType.INSERT, DtoEventObjectType.Location);
    const onMessage = channel.consume.mock.calls[0][1] as (msg: unknown) => Promise<void>;

    const raw = {
      content: Buffer.from(JSON.stringify(aDtoEvent()), 'utf-8'),
      properties: {},
    };
    await onMessage(raw);

    expect(module.handle).toHaveBeenCalledTimes(1);
    expect(module.handle).toHaveBeenCalledWith({
      _eventId: 'evt-42',
      _context: { eventType: 'INSERT', objectType: 'Location' },
      _payload: { id: 7 },
    });
    expect(channel.ack).toHaveBeenCalledTimes(1);
    expect(channel.ack).toHaveBeenCalledWith(raw);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('malformed message body is not dispatched but still acked', async () => {
    const { receiver, channel, logger } = await initReceiver();
    const module = { handle: vi.fn() };
    receiver.module = module as never;
    await receiver.subscribe(DtoEventType.INSERT, DtoEventObjectType.Location);
    const onMessage = channel.consume.mock.calls[0][1] as (msg: unknown) => Promise<void>;

    const raw = { content: Buffer.from('{oops', 'utf-8'), properties: {} };
    await onMessage(raw);

    expect(module.handle).not.toHaveBeenCalled();
    expect(logger.error.mock.calls[0][0]).toBe('Error while processing message:');
    expect(channel.ack).toHaveBeenCalledTimes(1);
    expect(channel.ack).toHaveBeenCalledWith(raw);
  });

  it('RetryMessageError from the module nacks without acking', async () => {
    const { receiver, channel } = await initReceiver();
    const module = { handle: vi.fn().mockRejectedValue(new RetryMessageError('station busy')) };
    receiver.module = module as never;
    await receiver.subscribe(DtoEventType.UPDATE, DtoEventObjectType.Transaction);
    const onMessage = channel.consume.mock.calls[0][1] as (msg: unknown) => Promise<void>;

    const raw = { content: Buffer.from('{"a":1}', 'utf-8'), properties: {} };
    await onMessage(raw);

    expect(channel.nack).toHaveBeenCalledTimes(1);
    expect(channel.nack).toHaveBeenCalledWith(raw);
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it('null delivery is ignored', async () => {
    const { receiver, channel } = await initReceiver();
    const module = { handle: vi.fn() };
    receiver.module = module as never;
    await receiver.subscribe(DtoEventType.INSERT, DtoEventObjectType.Location);
    const onMessage = channel.consume.mock.calls[0][1] as (msg: unknown) => Promise<void>;

    await onMessage(null);

    expect(module.handle).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).not.toHaveBeenCalled();
  });
});

// Concrete module used for decorator metadata and dispatch tests.
class LocationDtoModule extends AbstractDtoModule {
  received: Array<IDtoEvent<IDtoPayload>> = [];

  async init(): Promise<void> {}

  @AsDtoEventHandler(DtoEventType.INSERT, DtoEventObjectType.Location, 'location-insert')
  async onLocationInsert(event: IDtoEvent<IDtoPayload>): Promise<void> {
    this.received.push(event);
  }

  @AsDtoEventHandler(DtoEventType.DELETE, DtoEventObjectType.Tariff, 'tariff-delete')
  async onTariffDelete(): Promise<void> {
    throw new Error('tariff handler failed');
  }
}

function aReceiverMock() {
  return {
    subscribe: vi.fn().mockResolvedValue(true),
    shutdown: vi.fn().mockResolvedValue(undefined),
    module: undefined as unknown,
  };
}

function buildModule() {
  const receiver = aReceiverMock();
  const logger = aLogger();
  const module = new LocationDtoModule(amqpConfig(), receiver as never, logger);
  return { module, receiver, logger };
}

describe('AsDtoEventHandler metadata', () => {
  it('decorator registers one definition per handler method', () => {
    const { module } = buildModule();

    const defs = getDtoEventHandlerMetaData(module);

    expect(defs).toHaveLength(2);
    expect(defs[0].eventType).toBe(DtoEventType.INSERT);
    expect(defs[0].objectType).toBe(DtoEventObjectType.Location);
    expect(defs[0].eventId).toBe('location-insert');
    expect(defs[0].methodName).toBe('onLocationInsert');
    expect(defs[0].method).toBe(LocationDtoModule.prototype.onLocationInsert);
    expect(defs[1].eventId).toBe('tariff-delete');
    expect(defs[1].methodName).toBe('onTariffDelete');
  });

  it('undecorated class yields an empty definition list', () => {
    class Plain {}

    expect(getDtoEventHandlerMetaData(new Plain())).toEqual([]);
  });
});

describe('AbstractDtoModule', () => {
  it('constructor wires itself as the receiver module', () => {
    const { module, receiver } = buildModule();

    expect(receiver.module).toBe(module);
  });

  it('handle dispatches to the handler matching eventType and objectType', async () => {
    const { module } = buildModule();
    const message = {
      _eventId: 'location-insert',
      _context: { eventType: DtoEventType.INSERT, objectType: DtoEventObjectType.Location },
      _payload: { id: 3 },
    };

    await module.handle(message);

    expect(module.received).toHaveLength(1);
    expect(module.received[0]).toBe(message);
  });

  it('handle warns when no handler matches the context', async () => {
    const { module, logger } = buildModule();

    await module.handle({
      _eventId: 'x',
      _context: { eventType: DtoEventType.UPDATE, objectType: DtoEventObjectType.Connector },
      _payload: {},
    });

    expect(module.received).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'No handler found for eventType: UPDATE and objectType: Connector at module LocationDtoModule',
    );
  });

  it('handle swallows a handler error and logs it', async () => {
    const { module, logger } = buildModule();

    await module.handle({
      _eventId: 'tariff-delete',
      _context: { eventType: DtoEventType.DELETE, objectType: DtoEventObjectType.Tariff },
      _payload: {},
    });

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0][0]).toBe('Failed handling GraphQL message: ');
    expect((logger.error.mock.calls[0][1] as Error).message).toBe('tariff handler failed');
  });

  it('initHandlers subscribes the receiver once per registered handler', async () => {
    const { module, receiver } = buildModule();

    await module.initHandlers();

    expect(receiver.subscribe).toHaveBeenCalledTimes(2);
    expect(receiver.subscribe).toHaveBeenNthCalledWith(
      1,
      DtoEventType.INSERT,
      DtoEventObjectType.Location,
      { eventId: 'location-insert' },
    );
    expect(receiver.subscribe).toHaveBeenNthCalledWith(
      2,
      DtoEventType.DELETE,
      DtoEventObjectType.Tariff,
      { eventId: 'tariff-delete' },
    );
  });

  it('initHandlers rejects when a subscription fails', async () => {
    const { module, receiver } = buildModule();
    receiver.subscribe.mockResolvedValueOnce(false);

    await expect(module.initHandlers()).rejects.toThrow(
      'Could not initialize module due to failure in handler initialization.',
    );
    expect(receiver.subscribe).toHaveBeenCalledTimes(1);
  });

  it('shutdown delegates to the receiver', async () => {
    const { module, receiver } = buildModule();

    await module.shutdown();

    expect(receiver.shutdown).toHaveBeenCalledTimes(1);
  });
});

describe('PgNotifyEventSubscriber', () => {
  function buildSubscriber() {
    const logger = aLogger();
    const subscriber = new PgNotifyEventSubscriber({ config: pgConfig(), logger } as never);
    const client = pgMock.instances[pgMock.instances.length - 1];
    return { subscriber, client, logger };
  }

  it('constructor maps the database config onto the pg client options', () => {
    const { client } = buildSubscriber();

    expect(client.options).toEqual({
      host: 'db.internal',
      port: 5433,
      user: 'ocpi_user',
      password: FIXTURE_VALUE,
      database: 'citrine',
    });
  });

  it('init connects and registers notification, error, and end listeners', async () => {
    const { subscriber, client } = buildSubscriber();

    await subscriber.init();

    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(Object.keys(client.handlers)).toEqual(['notification', 'error', 'end']);
  });

  it('subscribe issues LISTEN once per channel and replaces the handler', async () => {
    const { subscriber, client } = buildSubscriber();
    await subscriber.init();
    const first = { handleEvent: vi.fn(), handleError: vi.fn() };
    const second = { handleEvent: vi.fn(), handleError: vi.fn() };

    const ok1 = await subscriber.subscribe('session-events', first.handleEvent, first.handleError);
    const ok2 = await subscriber.subscribe(
      'session-events',
      second.handleEvent,
      second.handleError,
    );

    expect(ok1).toBe(true);
    expect(ok2).toBe(true);
    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenCalledWith('LISTEN "session-events"');

    client.emit('notification', {
      channel: 'session-events',
      payload: JSON.stringify({ operation: 'INSERT', data: { id: 1 } }),
    });
    expect(first.handleEvent).not.toHaveBeenCalled();
    expect(second.handleEvent).toHaveBeenCalledTimes(1);
  });

  it('notification payload is parsed into eventType and payload', async () => {
    const { subscriber, client } = buildSubscriber();
    await subscriber.init();
    const handleEvent = vi.fn();
    await subscriber.subscribe('tariff-events', handleEvent, vi.fn());

    client.emit('notification', {
      channel: 'tariff-events',
      payload: JSON.stringify({ operation: 'UPDATE', data: { id: 7, price: 2.5 } }),
    });

    expect(handleEvent).toHaveBeenCalledTimes(1);
    expect(handleEvent).toHaveBeenCalledWith({
      eventType: 'UPDATE',
      payload: { id: 7, price: 2.5 },
    });
  });

  it('malformed notification payload goes to handleError only', async () => {
    const { subscriber, client } = buildSubscriber();
    await subscriber.init();
    const handleEvent = vi.fn();
    const handleError = vi.fn();
    await subscriber.subscribe('tariff-events', handleEvent, handleError);

    client.emit('notification', { channel: 'tariff-events', payload: '{oops' });

    expect(handleEvent).not.toHaveBeenCalled();
    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError.mock.calls[0][0]).toBeInstanceOf(SyntaxError);
  });

  it('notification on a channel without a handler is dropped', async () => {
    const { subscriber, client } = buildSubscriber();
    await subscriber.init();
    const handleEvent = vi.fn();
    await subscriber.subscribe('tariff-events', handleEvent, vi.fn());

    client.emit('notification', {
      channel: 'other-events',
      payload: JSON.stringify({ operation: 'INSERT', data: {} }),
    });

    expect(handleEvent).not.toHaveBeenCalled();
  });

  it('subscribe returns false and reports the error when LISTEN fails', async () => {
    const { subscriber, client } = buildSubscriber();
    await subscriber.init();
    const listenError = new Error('connection lost');
    client.query.mockRejectedValueOnce(listenError);
    const handleError = vi.fn();

    const ok = await subscriber.subscribe('session-events', vi.fn(), handleError);

    expect(ok).toBe(false);
    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError).toHaveBeenCalledWith(listenError);
  });

  it('client error calls a shared handleDisconnect once', async () => {
    const { subscriber, client } = buildSubscriber();
    await subscriber.init();
    const handleDisconnect = vi.fn();
    await subscriber.subscribe('a-events', vi.fn(), vi.fn(), handleDisconnect);
    await subscriber.subscribe('b-events', vi.fn(), vi.fn(), handleDisconnect);

    client.emit('error', new Error('socket reset'));

    expect(handleDisconnect).toHaveBeenCalledTimes(1);
  });

  it('shutdown ends the client and clears handlers', async () => {
    const { subscriber, client } = buildSubscriber();
    await subscriber.init();
    const handleEvent = vi.fn();
    await subscriber.subscribe('tariff-events', handleEvent, vi.fn());

    await subscriber.shutdown();

    expect(client.end).toHaveBeenCalledTimes(1);
    client.emit('notification', {
      channel: 'tariff-events',
      payload: JSON.stringify({ operation: 'INSERT', data: {} }),
    });
    expect(handleEvent).not.toHaveBeenCalled();
  });
});
