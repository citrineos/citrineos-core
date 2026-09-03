// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type ConnectionEvent,
  ConnectionEventState,
  FrameDirection,
  type FrameEvent,
  MessageOrigin,
  type MessagesEvent,
  MessagesEventKind,
  MessageTypeId,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type * as amqplib from 'amqplib';
import { EventEmitter } from 'events';
import { vi } from 'vitest';
import type { RabbitMQChannelManager } from '@/transport/queue/rabbit-mq/channel-manager.js';

export const TENANT_ID = 1;
export const STATION_ID = 'CS001';

export function aFrameEvent(override?: Partial<FrameEvent>): FrameEvent {
  return {
    kind: MessagesEventKind.Frame,
    tenantId: TENANT_ID,
    ocppConnectionName: STATION_ID,
    direction: FrameDirection.Inbound,
    correlationId: 'msg-123',
    origin: MessageOrigin.ChargingStation,
    type: MessageTypeId.Call,
    action: OCPP_CallAction.Heartbeat,
    protocol: OCPPVersion.OCPP2_0_1,
    raw: JSON.stringify([MessageTypeId.Call, 'msg-123', OCPP_CallAction.Heartbeat, {}]),
    payload: {},
    frame: [MessageTypeId.Call, 'msg-123', OCPP_CallAction.Heartbeat, {}],
    timestamp: '2026-01-01T00:00:00.000Z',
    parsed: true,
    ...override,
  } as FrameEvent;
}

export function aConnectionEvent(override?: Partial<ConnectionEvent>): ConnectionEvent {
  return {
    kind: MessagesEventKind.Connection,
    tenantId: TENANT_ID,
    ocppConnectionName: STATION_ID,
    state: ConnectionEventState.Connected,
    protocol: OCPPVersion.OCPP2_0_1,
    timestamp: '2026-01-01T00:00:00.000Z',
    ...override,
  } as ConnectionEvent;
}

export function anEmittingConnectionManager(): {
  on: EventEmitter['on'];
  emit: EventEmitter['emit'];
} {
  const emitter = new EventEmitter();
  return {
    on: emitter.on.bind(emitter),
    emit: emitter.emit.bind(emitter),
  };
}

export function aChannelManagerPerChannelId(channelFor: () => amqplib.Channel): {
  channelManager: RabbitMQChannelManager;
  channels: Map<string, amqplib.Channel>;
  connectionManager: ReturnType<typeof anEmittingConnectionManager>;
} {
  const channels = new Map<string, amqplib.Channel>();
  const connectionManager = anEmittingConnectionManager();

  const channelManager = {
    getChannel: vi.fn(async (channelId: string) => {
      if (!channels.has(channelId)) channels.set(channelId, channelFor());
      return channels.get(channelId)!;
    }),
    getConnectionManager: vi.fn().mockReturnValue(connectionManager),
  } as unknown as RabbitMQChannelManager;

  return { channelManager, channels, connectionManager };
}

export function aMessagesDelivery(
  event: MessagesEvent | string,
  override?: { redelivered?: boolean; routingKey?: string },
): amqplib.ConsumeMessage {
  return {
    content: Buffer.from(typeof event === 'string' ? event : JSON.stringify(event)),
    properties: {} as amqplib.MessageProperties,
    fields: {
      deliveryTag: 1,
      redelivered: override?.redelivered ?? false,
      exchange: 'messages',
      routingKey: override?.routingKey ?? 'frame.inbound.Heartbeat',
      consumerTag: 'test-consumer',
    } as amqplib.GetMessageFields,
  } as amqplib.ConsumeMessage;
}
