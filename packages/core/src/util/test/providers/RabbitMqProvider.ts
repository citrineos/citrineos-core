// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type * as amqplib from 'amqplib';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
  type SystemConfig,
} from '@citrineos/base';
import { vi } from 'vitest';
import type { RabbitMQChannelManager } from '../../queue/rabbit-mq/ChannelManager.js';

/**
 * Minimal SystemConfig with AMQP configured.
 * Only sets the fields RabbitMqReceiver reads from the config.
 */
export function aSystemConfigWithAmqp(override?: {
  exchange?: string;
  instanceIdentifier?: string;
  noAmqp?: boolean;
}): SystemConfig {
  if (override?.noAmqp) {
    return { util: { messageBroker: { amqp: undefined } } } as unknown as SystemConfig;
  }
  return {
    util: {
      messageBroker: {
        amqp: {
          url: 'amqp://localhost',
          exchange: override?.exchange ?? 'test-exchange',
          ...(override?.instanceIdentifier !== undefined && {
            instanceIdentifier: override.instanceIdentifier,
          }),
        },
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
    ack: vi.fn(),
    nack: vi.fn(),
  } as unknown as amqplib.Channel;
}

/**
 * Minimal mock for RabbitMQConnectionManager — only the `on` event registration
 * is needed by RabbitMqReceiver for reconnect handling.
 */
export function aMockConnectionManager(): { on: ReturnType<typeof vi.fn> } {
  return { on: vi.fn() };
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
  return {
    getChannel: vi.fn().mockResolvedValue(mockChannel),
    getConnectionManager: vi.fn().mockReturnValue(mockConnManager),
  } as unknown as RabbitMQChannelManager;
}

/**
 * Creates a minimal amqplib ConsumeMessage using direct field names
 * (the format published by RabbitMqSender via instanceToPlain).
 */
export function aConsumeMessage(override?: {
  origin?: string;
  eventGroup?: string;
  action?: string;
  state?: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  protocol?: string;
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
        },
        payload: override?.payload ?? {},
        protocol: override?.protocol ?? OCPPVersion.OCPP2_0_1,
      }),
    ),
    properties: {} as amqplib.MessageProperties,
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: 'test-exchange',
      routingKey: '',
      consumerTag: 'test-consumer',
    } as amqplib.GetMessageFields,
  } as amqplib.ConsumeMessage;
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
  state?: string;
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
    } as amqplib.GetMessageFields,
  } as amqplib.ConsumeMessage;
}
