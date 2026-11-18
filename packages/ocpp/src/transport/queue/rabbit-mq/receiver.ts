// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DeadLetterReason, type DeadLetterSource } from '@/transport/metrics.js';
import { AbstractMessageHandler, type IModule } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import * as amqplib from 'amqplib';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { RabbitMQChannelManager } from './channel-manager.js';
import { RabbitMqDeadLetterPublisher } from './dead-letter-publisher.js';
import { fromAmqpContent, type OCPPMessage } from './util.js';

export interface RabbitMqReceiverDependencies {
  config: SystemConfig;
  channelManager: RabbitMQChannelManager;
  deadLetterPublisher: RabbitMqDeadLetterPublisher;
  logger?: Logger<ILogObj>;
  module?: IModule;
}

/**
 * Base {@link IMessageHandler} using RabbitMQ as the underlying transport: message parsing,
 * settling deliveries, and the reconnect hook. How queues and consumers are laid out on the
 * broker is left to the subclasses:
 *
 * - {@link RabbitMqModuleReceiver} — used by modules; competing consumers on shared queues.
 * - {@link RabbitMqRouterReceiver} — used by the OCPP router; one queue per router instance.
 *
 * Every delivery is acked. A message that fails once is not retried, since it is unlikely to
 * succeed the second time; it goes to the dead-letter exchange with the reason instead.
 */
export abstract class RabbitMqReceiver extends AbstractMessageHandler {
  protected _channelManager: RabbitMQChannelManager;
  protected _deadLetterPublisher: RabbitMqDeadLetterPublisher;
  protected exchange: string;
  protected abstract readonly _source: DeadLetterSource;
  private _stopping = false;
  private _channelRecoveries = new Map<string, Promise<void>>();
  private _pendingChannelRecoveries = new Set<string>();
  private readonly _channelInvalidationListener: (channelId: string) => void;
  private readonly _connectionConnectedListener: () => Promise<void>;

  constructor({
    config,
    channelManager,
    deadLetterPublisher,
    logger,
    module,
  }: RabbitMqReceiverDependencies) {
    super(logger, module);
    this._channelManager = channelManager;
    this._deadLetterPublisher = deadLetterPublisher;
    const exchange = config.messageBroker.amqp?.exchange;
    if (!exchange) {
      throw new Error('RabbitMQ exchange is not configured');
    }
    this.exchange = exchange;

    this._channelInvalidationListener = (channelId) => {
      if (this._stopping) return;
      this._pendingChannelRecoveries.add(channelId);
      if (!this._channelRecoveries.has(channelId)) {
        const recovery = this._drainChannelRecoveries(channelId).finally(() => {
          if (this._channelRecoveries.get(channelId) === recovery) {
            this._channelRecoveries.delete(channelId);
          }
        });
        this._channelRecoveries.set(channelId, recovery);
      }
    };
    this._channelManager.on('channelInvalidated', this._channelInvalidationListener);

    this._connectionConnectedListener = async () => {
      if (this._stopping) return;
      try {
        await Promise.allSettled([...this._channelRecoveries.values()]);
        if (this._stopping) return;
        await this._onReconnect();
      } catch (err) {
        this._logger.error('Failed to reinitialize after reconnect:', err);
      }
    };
    this._channelManager.getConnectionManager().on('connected', this._connectionConnectedListener);
  }

  /**
   * Re-establishes this receiver's queues, bindings, and consumers on a fresh channel.
   */
  protected abstract _onReconnect(): Promise<void>;

  /** Restores only subscriptions owned by this receiver on the invalidated channel. */
  protected abstract _onChannelInvalidated(channelId: string): Promise<void>;

  protected _stopRecovery(): void {
    this._stopping = true;
    this._channelManager.off('channelInvalidated', this._channelInvalidationListener);
    this._channelManager.getConnectionManager().off('connected', this._connectionConnectedListener);
  }

  protected get _isStopping(): boolean {
    return this._stopping;
  }

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
    if (this._stopping) return '';
    const { consumerTag } = await channel.consume(queueName, (msg) =>
      this._onMessage(msg, channel, queueName),
    );
    return consumerTag;
  }

  private async _drainChannelRecoveries(channelId: string): Promise<void> {
    while (this._pendingChannelRecoveries.delete(channelId)) {
      if (this._stopping) return;
      const retryDelaysMs = [100, 250, 500, 1_000, 2_000, 5_000];
      let attempt = 0;
      while (!this._stopping) {
        try {
          await this._onChannelInvalidated(channelId);
          break;
        } catch (error) {
          this._logger.error(`Failed to restore receiver channel ${channelId}:`, error);
          const delay = retryDelaysMs[Math.min(attempt, retryDelaysMs.length - 1)];
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delay ?? 5_000));
        }
      }
    }
  }

  /**
   * Underlying RabbitMQ message handler.
   *
   * @param message The AMQPMessage to process
   * @param channel
   * @param queueName The queue `message` was consumed from
   */
  protected async _onMessage(
    message: amqplib.ConsumeMessage | null,
    channel: amqplib.Channel,
    queueName: string,
  ): Promise<void> {
    if (!message) {
      return;
    }
    this._logger.debug(
      '_onMessage:Message from broker:',
      message.properties,
      message.content.toString(),
    );

    let parsed: OCPPMessage;
    try {
      parsed = fromAmqpContent(message.content);
    } catch (error) {
      this._logger.error('Error while parsing message:', error, message);
      await this._deadLetter(message, DeadLetterReason.Poison, queueName, error);
      channel.ack(message);
      return;
    }

    try {
      await this._dispatch(parsed, message, channel, queueName);
    } catch (error) {
      this._logger.error('Error while processing message:', error, message);
      await this._deadLetter(message, DeadLetterReason.HandlerError, queueName, error);
    }
    channel.ack(message);
  }

  /**
   * Hands a parsed delivery to the module. The delivery is acked once this settles.
   */
  protected async _dispatch(
    parsed: OCPPMessage,
    message: amqplib.ConsumeMessage,
    _channel: amqplib.Channel,
    _queueName: string,
  ): Promise<void> {
    await this.handle(parsed, message.properties);
  }

  protected _deadLetter(
    message: amqplib.ConsumeMessage,
    reason: DeadLetterReason,
    queueName: string,
    error?: unknown,
  ): Promise<void> {
    return this._deadLetterPublisher.publishRaw(
      message.content,
      message.properties.headers ?? {},
      reason,
      this._source,
      { queue: queueName, error },
    );
  }
}
