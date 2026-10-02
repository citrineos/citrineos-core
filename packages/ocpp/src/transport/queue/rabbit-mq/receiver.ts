// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IModule, AbstractMessageHandler, Message } from '@citrineos/base';
import { type SystemConfig, RetryMessageError } from '@citrineos/types';
import * as amqplib from 'amqplib';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { RabbitMQChannelManager } from './channel-manager.js';

/**
 * AMQP header carrying how many times a message has been retried. Lives on the delivery rather
 * than in the message body: it is transport bookkeeping that no handler should see, and keeping
 * it out of the body means the republished content is byte-identical to the original.
 */
const RETRY_HEADER = 'x-retries';

/**
 * Base {@link IMessageHandler} using RabbitMQ as the underlying transport: message parsing,
 * ack/retry handling, and the reconnect hook. How queues and consumers are laid out on the
 * broker is left to the subclasses:
 *
 * - {@link RabbitMqModuleReceiver} — used by modules; competing consumers on shared queues.
 * - {@link RabbitMqRouterReceiver} — used by the OCPP router; one queue per router instance.
 */
export abstract class RabbitMqReceiver extends AbstractMessageHandler {
  protected _channelManager: RabbitMQChannelManager;
  protected exchange: string;
  protected _messageMaxAgeSeconds: number;

  constructor({
    config,
    channelManager,
    logger,
    module,
  }: {
    config: SystemConfig;
    channelManager: RabbitMQChannelManager;
    logger?: Logger<ILogObj>;
    module?: IModule;
  }) {
    super(logger, module);
    this._channelManager = channelManager;
    // Upper bound on how long a message may be retried for. Unlike the stale-Call guard in
    // AbstractRouter -- which is opt-in, and only drops on delivery -- this cap always applies:
    // a message that can never be handled within `maxCallLengthSeconds` is not worth retrying
    // regardless of deployment, and without a bound a permanently blocked station would have us
    // requeueing forever. It falls back to `maxCallLengthSeconds` when the operator has not
    // opted into a stricter staleness policy.
    this._messageMaxAgeSeconds =
      config.timeouts.staleCallMaxAgeSeconds ?? config.timeouts.maxCallLengthSeconds;
    const exchange = config.messageBroker.amqp?.exchange;
    if (!exchange) {
      throw new Error('RabbitMQ exchange is not configured');
    }
    this.exchange = exchange;

    this._channelManager.getConnectionManager().on('connected', async () => {
      try {
        await this._onReconnect();
      } catch (err) {
        this._logger.error('Failed to reinitialize after reconnect:', err);
      }
    });
  }

  /**
   * Re-establishes this receiver's queues, bindings, and consumers on a fresh channel.
   */
  protected abstract _onReconnect(): Promise<void>;

  /**
   * Starts a consumer on `queueName` that allows at most `prefetch` unacked deliveries.
   *
   * @return The consumer tag.
   */
  protected async _consume(
    channel: amqplib.Channel,
    queueName: string,
    prefetch: number,
  ): Promise<string> {
    // basic.qos only applies to consumers started after it, so it is set ahead of each consume.
    await channel.prefetch(prefetch);
    const { consumerTag } = await channel.consume(queueName, (msg) =>
      this._onMessage(msg, channel, queueName),
    );
    return consumerTag;
  }

  /**
   * Underlying RabbitMQ message handler.
   *
   * @param message The AMQPMessage to process
   * @param channel
   * @param queueName The queue `message` was consumed from, used to requeue retries
   */
  protected async _onMessage(
    message: amqplib.ConsumeMessage | null,
    channel: amqplib.Channel,
    queueName: string,
  ): Promise<void> {
    if (message) {
      try {
        this._logger.debug(
          '_onMessage:Message from broker:',
          message.properties,
          message.content.toString(),
        );
        const messageData = JSON.parse(message.content.toString());

        // Create Message instance with generic payload (no type transformation needed)
        const parsed = new Message(
          messageData.origin || messageData._origin,
          messageData.eventGroup || messageData._eventGroup,
          messageData.action || messageData._action,
          messageData.state || messageData._state,
          messageData.context || messageData._context,
          messageData.payload || messageData._payload, // Keep payload as generic object
          messageData.protocol || messageData._protocol,
        );

        try {
          await this.handle(parsed, message.properties);
        } catch (error) {
          if (error instanceof RetryMessageError) {
            const attempt = Number(message.properties.headers?.[RETRY_HEADER]) || 0;
            const backoff = this._backoff(attempt);

            if (!this._willStillBeFresh(parsed.context.timestamp, backoff)) {
              this._logger.error(
                `Dropping ${parsed.action} for ${parsed.context.ocppConnectionName} after ` +
                  `${attempt} retries: would exceed the ${this._messageMaxAgeSeconds}s retry ` +
                  `window. correlationId=${parsed.context.correlationId}`,
              );
              channel.nack(message, false, false); // discarded: no DLQ is configured
              return;
            }
            if (attempt === 0) this._logger.warn('Retrying message: ', error.message);

            await new Promise((resolve) => setTimeout(resolve, backoff));

            channel.sendToQueue(queueName, message.content, {
              ...message.properties,
              headers: { ...message.properties.headers, [RETRY_HEADER]: attempt + 1 },
            });
            channel.ack(message);
            return;
          } else {
            this._logger.error('Error while processing message:', error, message);
          }
        }
      } catch (error) {
        this._logger.error('Error while parsing message:', error, message);
      }
      channel.ack(message);
    }
  }

  private _backoff(attempt: number): number {
    const base = Math.min(50 * 2 ** attempt, 1000);
    return base * (0.75 + Math.random() * 0.5); // ±25% jitter
  }

  private _willStillBeFresh(timestamp: string, backoff: number): boolean {
    const age = Date.now() - new Date(timestamp).getTime();
    return age + backoff < this._messageMaxAgeSeconds * 1000;
  }
}
