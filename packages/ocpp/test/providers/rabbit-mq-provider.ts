// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { RabbitMQChannelManager } from '@/transport/queue/rabbit-mq/channel-manager.js';
import type { RabbitMqDeadLetterPublisher } from '@/transport/queue/rabbit-mq/dead-letter-publisher.js';
import type { RabbitMqReemitter } from '@/transport/queue/rabbit-mq/reemitter.js';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
  type SystemConfig,
} from '@citrineos/types';
import type * as amqplib from 'amqplib';
import { vi } from 'vitest';

/**
 * Minimal SystemConfig with AMQP configured.
 * Only sets the fields RabbitMqReceiver reads from the config.
 */
export function aSystemConfigWithAmqp(override?: {
  exchange?: string;
  instanceIdentifier?: string;
  noAmqp?: boolean;
  maxCallLengthSeconds?: number;
  staleCallMaxAgeSeconds?: number;
  reemitMaxRetrySeconds?: number;
  prefetch?: {
    router?: number;
    module?: number;
    moduleStale?: number;
    messages?: number;
    messagesDeadLetter?: number;
  };
}): SystemConfig {
  const timeouts = {
    maxCallLengthSeconds: override?.maxCallLengthSeconds ?? 20,
    staleCallMaxAgeSeconds: override?.staleCallMaxAgeSeconds ?? 40,
  };
  if (override?.noAmqp) {
    return { timeouts, messageBroker: { amqp: undefined } } as unknown as SystemConfig;
  }
  return {
    timeouts,
    messageBroker: {
      amqp: {
        url: 'amqp://localhost',
        exchange: override?.exchange ?? 'test-exchange',
        prefetch: {
          router: override?.prefetch?.router ?? 100,
          module: override?.prefetch?.module ?? 10,
          moduleStale: override?.prefetch?.moduleStale ?? 1,
          messages: override?.prefetch?.messages ?? 50,
          messagesDeadLetter: override?.prefetch?.messagesDeadLetter ?? 10,
        },
        reemitMaxRetrySeconds: override?.reemitMaxRetrySeconds ?? 300,
        deadLetterQueue: { maxLength: 100_000, maxLengthBytes: 512 * 1024 * 1024 },
        ...(override?.instanceIdentifier !== undefined && {
          instanceIdentifier: override.instanceIdentifier,
        }),
      },
    },
  } as unknown as SystemConfig;
}

/**
 * Mock amqplib channel with all methods stubbed.
 * `consume` returns incrementing consumer tags so tests can assert
 * on exact tag values when multiple subscribe calls are made.
 */
export function aMockAmqpChannel(): amqplib.Channel {
  let consumerCount = 0;
  return {
    assertExchange: vi.fn().mockResolvedValue({}),
    assertQueue: vi.fn().mockResolvedValue({}),
    bindQueue: vi.fn().mockResolvedValue({}),
    unbindQueue: vi.fn().mockResolvedValue({}),
    consume: vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ consumerTag: `consumer-tag-${++consumerCount}` }),
      ),
    cancel: vi.fn().mockResolvedValue({}),
    prefetch: vi.fn().mockResolvedValue({}),
    ack: vi.fn(),
    nack: vi.fn(),
    sendToQueue: vi.fn().mockReturnValue(true),
    publish: vi.fn().mockReturnValue(true),
    on: vi.fn(),
  } as unknown as amqplib.Channel;
}

/**
 * Minimal mock for the connection lifecycle events used by RabbitMqReceiver.
 */
export function aMockConnectionManager(): {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
} {
  return { on: vi.fn(), off: vi.fn() };
}

/**
 * Mock RabbitMQChannelManager that resolves `getChannel` to the provided
 * channel mock (or a new one) and exposes the connection manager mock
 * so tests can assert on reconnect registration.
 */
export function aMockChannelManager(
  channel?: amqplib.Channel,
  connectionManager?: ReturnType<typeof aMockConnectionManager>,
): RabbitMQChannelManager {
  const mockChannel = channel ?? aMockAmqpChannel();
  const mockConnManager = connectionManager ?? aMockConnectionManager();
  let invalidationListener: ((channelId: string) => void) | undefined;
  const on = vi.fn((event: string, listener: (channelId: string) => void) => {
    if (event === 'channelInvalidated') invalidationListener = listener;
  });
  return {
    getChannel: vi.fn().mockResolvedValue(mockChannel),
    getConnectionManager: vi.fn().mockReturnValue(mockConnManager),
    on,
    off: vi.fn(),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      if (event === 'channelInvalidated' && typeof args[0] === 'string') {
        invalidationListener?.(args[0]);
      }
    }),
  } as unknown as RabbitMQChannelManager;
}

export type MockDeadLetterPublisher = RabbitMqDeadLetterPublisher & {
  publishRaw: ReturnType<typeof vi.fn>;
  publishMessage: ReturnType<typeof vi.fn>;
};

/** Dead-letter publisher whose publishes resolve without touching a broker. */
export function aMockDeadLetterPublisher(): MockDeadLetterPublisher {
  return {
    publishRaw: vi.fn().mockResolvedValue(undefined),
    publishMessage: vi.fn().mockResolvedValue(undefined),
  } as unknown as MockDeadLetterPublisher;
}

export type MockReemitter = RabbitMqReemitter & {
  reemit: ReturnType<typeof vi.fn>;
  shutdown: ReturnType<typeof vi.fn>;
};

export function aMockReemitter(): MockReemitter {
  return {
    reemit: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
  } as unknown as MockReemitter;
}

/**
 * Creates a minimal amqplib ConsumeMessage using direct field names
 * (the format published by RabbitMqSender via instanceToPlain).
 */
export function aConsumeMessage(override?: {
  origin?: string;
  eventGroup?: string;
  action?: string;
  state?: string | MessageState;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  protocol?: string;
  headers?: Record<string, unknown>;
}): amqplib.ConsumeMessage {
  return {
    content: Buffer.from(
      JSON.stringify({
        origin: override?.origin ?? MessageOrigin.ChargingStationManagementSystem,
        eventGroup: override?.eventGroup ?? EventGroup.All,
        action: override?.action ?? OCPP_CallAction.Heartbeat,
        state: override?.state ?? MessageState.Response,
        context: override?.context ?? {
          correlationId: 'test-correlation-id',
          ocppConnectionName: 'CS001',
          tenantId: '1',
          timestamp: new Date().toISOString(),
        },
        payload: override?.payload ?? {},
        protocol: override?.protocol ?? OCPPVersion.OCPP2_0_1,
      }),
    ),
    properties: { headers: override?.headers ?? {} } as unknown as amqplib.MessageProperties,
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: 'test-exchange',
      routingKey: '',
      consumerTag: 'test-consumer',
    },
  };
}

/**
 * Creates a ConsumeMessage using the underscore-prefixed field format
 * (the format produced by class-transformer's instanceToPlain on a Message instance).
 * Used to verify that the receiver handles both serialisation formats.
 */
export function aConsumeMessageWithPrefixedFields(override?: {
  origin?: string;
  eventGroup?: string;
  action?: string;
  state?: string | MessageState;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  protocol?: string;
}): amqplib.ConsumeMessage {
  return {
    content: Buffer.from(
      JSON.stringify({
        _origin: override?.origin ?? MessageOrigin.ChargingStationManagementSystem,
        _eventGroup: override?.eventGroup ?? EventGroup.All,
        _action: override?.action ?? OCPP_CallAction.Heartbeat,
        _state: override?.state ?? MessageState.Response,
        _context: override?.context ?? {
          correlationId: 'test-correlation-id',
          ocppConnectionName: 'CS001',
          tenantId: '1',
        },
        _payload: override?.payload ?? {},
        _protocol: override?.protocol ?? OCPPVersion.OCPP2_0_1,
      }),
    ),
    properties: {} as amqplib.MessageProperties,
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: 'test-exchange',
      routingKey: '',
      consumerTag: 'test-consumer',
    },
  };
}
