// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, Message, OcppError, outboundDeadline } from '@citrineos/base';
import { type OcppRequest, type OcppResponse, type SystemConfig } from '@citrineos/types';
import type * as amqplib from 'amqplib';
import { instanceToPlain } from 'class-transformer';

export type IOCPPMessage = IMessage<OcppRequest | OcppResponse | OcppError>;

export type OCPPMessage = Message<OcppRequest | OcppResponse | OcppError>;

/** The message body as it is published to the broker. */
export function toAmqpContent(message: IOCPPMessage): Buffer {
  return Buffer.from(JSON.stringify(instanceToPlain(message)), 'utf-8');
}

/**
 * Parses a body published by {@link toAmqpContent}. Throws when it is not JSON.
 */
export function fromAmqpContent(content: Buffer): Message<OcppRequest | OcppResponse | OcppError> {
  const messageData = JSON.parse(content.toString());

  // Create Message instance with generic payload (no type transformation needed)
  return new Message(
    messageData.origin || messageData._origin,
    messageData.eventGroup || messageData._eventGroup,
    messageData.action || messageData._action,
    messageData.state || messageData._state,
    messageData.context || messageData._context,
    messageData.payload || messageData._payload, // Keep payload as generic object
    messageData.protocol || messageData._protocol,
  );
}

/** The headers the exchange routes `message` on. */
export function toAmqpHeaders(message: IOCPPMessage): Record<string, unknown> {
  return {
    origin: message.origin.toString(),
    eventGroup: message.eventGroup.toString(),
    action: message.action.toString(),
    state: message.state.toString(),
    ...message.context,
    tenantId: message.context.tenantId.toString(),
  };
}

export type AmqpPublish = { stale: true } | { stale: false; options: amqplib.Options.Publish };

/**
 * How to publish `message`, or that it is already stale and must be dead-lettered instead. A
 * message the CSMS sends gets an `expiration` of what is left before it goes stale, so a backlog
 * does not reach the station late. One with nothing left is never published: a consumer that is
 * ready can still receive it before the broker gets round to expiring it.
 */
export function toAmqpPublish(
  message: IOCPPMessage,
  timeouts: SystemConfig['timeouts'],
): AmqpPublish {
  const options: amqplib.Options.Publish = {
    contentEncoding: 'utf-8',
    contentType: 'application/json',
    headers: toAmqpHeaders(message),
  };
  const deadline = outboundDeadline(timeouts, message);
  if (deadline !== undefined) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      return { stale: true };
    }
    options.expiration = String(remainingMs);
  }
  return { stale: false, options };
}
