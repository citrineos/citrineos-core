// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  isFrameEvent,
  MESSAGES_DLX,
  MESSAGES_EXCHANGE,
  MESSAGES_QUEUES,
  type MessagesEvent,
  messagesEventRoutingKey,
} from '@citrineos/types';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { RabbitMQChannelManager } from '@/transport/index.js';

/**
 * The actual publisher of messages to the messages exchange.
 */
export class MessagesEventPublisher {
  private static readonly CHANNEL_ID = 'messages-publisher';

  private readonly _channelManager: RabbitMQChannelManager;
  private readonly _logger: Logger<ILogObj>;

  private _topologyReady?: Promise<void>;

  /** Events the broker could not take. Surfaced so an outage is visible, not inferred. */
  private _droppedCount = 0;

  constructor({
    channelManager,
    logger,
  }: {
    channelManager: RabbitMQChannelManager;
    logger?: Logger<ILogObj>;
  }) {
    this._channelManager = channelManager;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._channelManager.getConnectionManager().on('connected', () => {
      this._topologyReady = undefined;
    });
  }

  /**
   * @returns true when the broker accepted the event. Never throws: a failure in the messages plane
   * may cost an audit row, but it must not break OCPP traffic.
   */
  async publish(event: MessagesEvent): Promise<boolean> {
    try {
      await this._ensureTopology();
      const channel = await this._channelManager.getChannel(MessagesEventPublisher.CHANNEL_ID);

      const accepted = channel.publish(
        MESSAGES_EXCHANGE,
        messagesEventRoutingKey(event),
        Buffer.from(JSON.stringify(event), 'utf-8'),
        {
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          persistent: true,
          ...(isFrameEvent(event) ? { messageId: event.correlationId } : {}),
          headers: {
            kind: event.kind,
            tenantId: event.tenantId.toString(),
            ...(isFrameEvent(event)
              ? {
                  direction: event.direction,
                  origin: event.origin,
                  parsed: event.parsed.toString(),
                  ...(event.action ? { action: event.action } : {}),
                  ...(event.type !== undefined ? { type: event.type.toString() } : {}),
                }
              : { state: event.state }),
          },
        },
      );

      if (!accepted) {
        // amqplib's write buffer is full — the broker is applying backpressure.
        this._logger.warn(
          `Messages exchange applied backpressure for a ${event.kind} event; buffered in socket.`,
        );
      }
      return accepted;
    } catch (error) {
      this._droppedCount += 1;
      this._logger.error(
        `Dropped ${event.kind} event for tenant ${event.tenantId} / ${event.ocppConnectionName}; ` +
          `dropped so far: ${this._droppedCount}`,
        error,
      );
      return false;
    }
  }

  /** Declares the exchange, both queues, both dead-letter queues, and the bindings. Idempotent. */
  private _ensureTopology(): Promise<void> {
    if (!this._topologyReady) {
      this._topologyReady = this._declareTopology().catch((error) => {
        this._topologyReady = undefined;
        throw error;
      });
    }
    return this._topologyReady;
  }

  private async _declareTopology(): Promise<void> {
    const channel = await this._channelManager.getChannel(MessagesEventPublisher.CHANNEL_ID);

    await channel.assertExchange(MESSAGES_EXCHANGE, 'topic', { durable: true });
    await channel.assertExchange(MESSAGES_DLX, 'topic', { durable: true });

    for (const spec of MESSAGES_QUEUES) {
      await channel.assertQueue(spec.dlq, { durable: true, autoDelete: false });
      await channel.bindQueue(spec.dlq, MESSAGES_DLX, spec.binding);

      await channel.assertQueue(spec.queue, {
        durable: true,
        autoDelete: false,
        arguments: { 'x-dead-letter-exchange': MESSAGES_DLX },
      });
      await channel.bindQueue(spec.queue, MESSAGES_EXCHANGE, spec.binding);
    }

    this._logger.info(
      `Messages-plane topology ready: ${MESSAGES_QUEUES.map((q) => `${q.queue} <- ${q.binding}`).join(', ')}`,
    );
  }
}
