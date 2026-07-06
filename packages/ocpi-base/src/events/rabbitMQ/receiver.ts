// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import * as amqplib from 'amqplib';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { RetryMessageError } from '@citrineos/base';
import type { IDtoEventReceiver, IDtoModule } from '../index.js';
import { AbstractDtoEventReceiver, DtoEventObjectType, DtoEventType } from '../index.js';
import { Inject } from 'typedi';
import type { OcpiConfig } from '../../config/ocpi.types.js';
import { OcpiConfigToken } from '../../config/ocpi.types.js';

/**
 * Implementation of a {@link IEventHandler} using RabbitMQ as the underlying transport.
 */
export class RabbitMqDtoReceiver extends AbstractDtoEventReceiver implements IDtoEventReceiver {
  /**
   * Constants
   */
  private static readonly QUEUE_PREFIX = 'rabbit_queue_';
  private static readonly RECONNECT_DELAY = 5000;

  /**
   * Fields
   */
  protected _connection?: amqplib.Connection;
  protected _channel?: amqplib.Channel;
  private _reconnecting = false;
  private _abortReconnectController?: AbortController;

  constructor(
    @Inject(OcpiConfigToken) config: OcpiConfig,
    logger?: Logger<ILogObj>,
    module?: IDtoModule,
  ) {
    super(config, logger, module);
  }

  async init(): Promise<void> {
    this._abortReconnectController = new AbortController();
    this._channel = await this._connectWithRetry(this._abortReconnectController.signal);
  }

  /**
   * Methods
   */

  async subscribe(
    eventType: DtoEventType,
    objectType: DtoEventObjectType,
    filter?: { [k: string]: string },
  ): Promise<boolean> {
    const exchange = this._config.messageBroker?.amqp?.exchange as string;
    const queueName = `${RabbitMqDtoReceiver.QUEUE_PREFIX}${eventType}_${objectType}_${Date.now()}`;

    // Ensure that filter includes the x-match header set to all
    filter = filter
      ? {
          'x-match': 'all',
          ...filter,
        }
      : { 'x-match': 'all' };
    // Add eventType and objectType to filter
    filter = { eventType, objectType, ...filter };

    if (!this._channel) {
      throw new Error('RabbitMQ is down: cannot subscribe.');
    }
    const channel = this._channel;

    // Assert exchange and queue
    await channel.assertExchange(exchange, 'headers', { durable: false });
    await channel.assertQueue(queueName, {
      durable: false,
      autoDelete: true,
      exclusive: false,
    });

    this._logger.debug(`Bind ${queueName} on ${exchange} with filter ${JSON.stringify(filter)}.`);
    await channel.bindQueue(queueName, exchange, '', filter);

    // Start consuming messages
    await channel.consume(queueName, (msg) => this._onEvent(msg, channel));

    return true;
  }

  shutdown(): Promise<void> {
    this._abortReconnectController?.abort();
    return Promise.resolve();
  }

  /**
   * Protected Methods
   */

  /**
   * Connect to RabbitMQ with retry logic.
   * This method will keep trying to connect until successful, unless aborted.
   *
   * @param {AbortSignal} [abortSignal] - Optional abort signal to stop retrying.
   * @return {Promise<amqplib.Channel>} A promise that resolves to the AMQP channel.
   */
  protected async _connectWithRetry(abortSignal?: AbortSignal): Promise<amqplib.Channel> {
    let reconnectAttempts = 0;
    const url = this._config.messageBroker?.amqp?.url;
    if (!url) {
      throw new Error('RabbitMQ URL is not configured');
    }
    while (!abortSignal?.aborted) {
      try {
        const connection = await amqplib.connect(url);
        this._connection = connection.connection;
        const channel = await connection.createChannel();
        channel.on('error', (err) => {
          this._logger.error('AMQP channel error', err);
          // TODO: add recovery logic
        });
        this._setupConnectionListeners();
        return channel;
      } catch (err) {
        reconnectAttempts++;
        this._logger.error(
          `RabbitMQ reconnect attempt ${reconnectAttempts} failed (context: _connectWithRetry)`,
          err,
        );
        await new Promise((res) => setTimeout(res, RabbitMqDtoReceiver.RECONNECT_DELAY));
      }
    }
    this._logger.warn('RabbitMQ reconnect aborted by signal.');
    throw new Error('RabbitMQ reconnect aborted');
  }

  /**
   * Setup listeners for connection and channel events.
   * This will handle disconnections and errors.
   * Ensures listeners are not attached multiple times to the same connection.
   */
  private _setupConnectionListeners() {
    if (this._connection) {
      // Only attach listeners if not already attached to this connection
      if ((this._connection as any)._listenersAttached) return;
      this._connection.removeAllListeners('close');
      this._connection.removeAllListeners('error');
      this._connection.on('close', () => this._handleDisconnect());
      this._connection.on('error', () => this._handleDisconnect());
      (this._connection as any)._listenersAttached = true;
    }
  }

  /**
   * Handle RabbitMQ disconnection.
   * This method will attempt to reconnect to RabbitMQ when the connection is lost.
   * Debounces concurrent reconnects.
   */
  private async _handleDisconnect() {
    if (this._reconnecting) {
      this._logger.warn('RabbitMQ reconnect already in progress, skipping duplicate reconnect.');
      return;
    }
    this._reconnecting = true;
    this._abortReconnectController?.abort();
    this._abortReconnectController = new AbortController();

    this._logger.warn('RabbitMQ connection lost. Attempting to reconnect...');
    this._channel = undefined;
    this._connection = undefined;
    try {
      this._channel = await this._connectWithRetry(this._abortReconnectController.signal);
      this._logger.info('RabbitMQ reconnected successfully.');
    } catch (err) {
      this._logger.error('Failed to reconnect to RabbitMQ (context: _handleDisconnect)', err);
    } finally {
      this._reconnecting = false;
    }
  }

  /**
   * Underlying RabbitMQ message handler.
   *
   * @param message The AMQPMessage to process
   * @param channel
   */
  protected async _onEvent(
    message: amqplib.ConsumeMessage | null,
    channel: amqplib.Channel,
  ): Promise<void> {
    if (message) {
      try {
        this._logger.debug(
          '_onEvent:Received message:',
          message.properties,
          message.content.toString(),
        );
        const parsed = JSON.parse(message.content.toString());
        await this.handle(parsed);
      } catch (error) {
        if (error instanceof RetryMessageError) {
          this._logger.warn('Retrying message: ', error.message);
          // Retryable error, usually ongoing call with station when trying to send new call
          channel.nack(message);
          return;
        } else {
          this._logger.error('Error while processing message:', error, message);
        }
      }
      channel.ack(message);
    }
  }
}
