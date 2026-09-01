// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  MESSAGES_DLX,
  MESSAGES_EXCHANGE,
  MESSAGES_QUEUES,
  type MessagesEvent,
  MessagesEventSchema,
  type MessagesQueueSpec,
} from '@citrineos/types';
import type * as amqplib from 'amqplib';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { RabbitMQChannelManager } from '@/util/index.js';

export type MessagesEventHandler = (event: MessagesEvent) => Promise<void>;

export class MessagesEventConsumer {
  private static readonly CHANNEL_PREFIX = 'messages-consumer-';

  private readonly _channelManager: RabbitMQChannelManager;
  private readonly _logger: Logger<ILogObj>;

  private _handler?: MessagesEventHandler;
  /** queue name -> consumerTag, for queues currently being consumed on this connection. */
  private _consumerTags = new Map<string, string>();
  private _started = false;

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

    // ChannelManager recreates channels after a reconnect but not consumers — the tags it held
    // referenced a dead channel. Re-subscribe from scratch.
    this._channelManager.getConnectionManager().on('connected', () => {
      if (!this._started) return;
      this._consumerTags.clear();
      this.subscribe().catch((error) =>
        this._logger.error('Failed to re-subscribe after reconnect:', error),
      );
    });
  }

  get consumedQueues(): string[] {
    return [...this._consumerTags.keys()];
  }

  async start(handler: MessagesEventHandler): Promise<void> {
    this._handler = handler;
    this._started = true;
    await this.subscribe();
  }

  /** Starts consuming any messages-plane queue not already being consumed. Idempotent. */
  async subscribe(): Promise<void> {
    for (const spec of MESSAGES_QUEUES) {
      if (this._consumerTags.has(spec.queue)) continue;
      try {
        await this._consumeQueue(spec);
      } catch (error) {
        // One queue failing must not stop the other from being served.
        this._logger.error(`Failed to consume ${spec.queue}:`, error);
      }
    }

    if (this._consumerTags.size > 0) {
      this._logger.info(`Consuming messages plane: ${this.consumedQueues.join(', ')}`);
    }
  }

  async shutdown(): Promise<void> {
    this._started = false;

    for (const [queue, consumerTag] of this._consumerTags) {
      try {
        const channel = await this._channelManager.getChannel(this._channelId(queue));
        await channel.cancel(consumerTag);
      } catch (error) {
        this._logger.warn(`Could not cancel consumer for ${queue} during shutdown`, error);
      }
    }
    this._consumerTags.clear();
  }

  private _channelId(queue: string): string {
    return `${MessagesEventConsumer.CHANNEL_PREFIX}${queue}`;
  }

  private async _consumeQueue(spec: MessagesQueueSpec): Promise<void> {
    const channel = await this._channelManager.getChannel(this._channelId(spec.queue));

    await channel.assertExchange(MESSAGES_EXCHANGE, 'topic', { durable: true });
    await channel.assertExchange(MESSAGES_DLX, 'topic', { durable: true });

    await channel.assertQueue(spec.dlq, { durable: true, autoDelete: false });
    await channel.bindQueue(spec.dlq, MESSAGES_DLX, spec.binding);

    await channel.assertQueue(spec.queue, {
      durable: true,
      autoDelete: false,
      arguments: { 'x-dead-letter-exchange': MESSAGES_DLX },
    });
    await channel.bindQueue(spec.queue, MESSAGES_EXCHANGE, spec.binding);

    const { consumerTag } = await channel.consume(spec.queue, (message) =>
      this._onMessage(spec.queue, message, channel),
    );
    this._consumerTags.set(spec.queue, consumerTag);
  }

  private async _onMessage(
    queue: string,
    message: amqplib.ConsumeMessage | null,
    channel: amqplib.Channel,
  ): Promise<void> {
    if (!message) return;

    let event: MessagesEvent;
    try {
      const parsed = MessagesEventSchema.safeParse(JSON.parse(message.content.toString()));
      if (!parsed.success) {
        // Malformed or a future envelope version. Retrying cannot help, so dead-letter it
        // immediately rather than looping — this is the poison-message case.
        this._logger.error(`Unusable event on ${queue}; dead-lettering.`, parsed.error.issues);
        channel.nack(message, false, false);
        return;
      }
      event = parsed.data;
    } catch (error) {
      this._logger.error(`Non-JSON event on ${queue}; dead-lettering.`, error);
      channel.nack(message, false, false);
      return;
    }

    try {
      await this._handler!(event);
      channel.ack(message);
    } catch (error) {
      const requeue = !message.fields.redelivered;
      this._logger.error(
        `Processing failed on ${queue} (${event.kind}, ${event.ocppConnectionName}); ` +
          (requeue ? 'requeueing once.' : 'dead-lettering after retry.'),
        error,
      );
      channel.nack(message, false, requeue);
    }
  }
}
