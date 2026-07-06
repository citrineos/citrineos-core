// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import * as amqplib from 'amqplib';
import { instanceToPlain } from 'class-transformer';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IDtoEvent, IDtoEventSender, IDtoPayload } from '../index.js';
import { AbstractDtoEventSender } from '../index.js';
import { Inject, Service } from 'typedi';
import type { OcpiConfig } from '../../config/ocpi.types.js';
import { OcpiConfigToken } from '../../config/ocpi.types.js';

/**
 * Implementation of a {@link IEventSender} using RabbitMQ as the underlying transport.
 */
@Service()
export class RabbitMqDtoSender extends AbstractDtoEventSender implements IDtoEventSender {
  /**
   * Constants
   */
  private static readonly QUEUE_PREFIX = 'amqp_queue_';
  private static readonly RECONNECT_DELAY = 5000;

  /**
   * Fields
   */
  protected _connection?: amqplib.Connection;
  protected _channel?: amqplib.Channel;
  private _reconnecting = false;
  private _abortReconnectController?: AbortController;

  /**
   * Constructor for the class.
   *
   * @param {OcpiConfig} config - The system configuration.
   * @param {Logger<ILogObj>} [logger] - The logger object.
   */
  constructor(@Inject(OcpiConfigToken) config: OcpiConfig, logger?: Logger<ILogObj>) {
    super(config, logger);
  }

  async init(): Promise<void> {
    this._abortReconnectController = new AbortController();
    this._channel = await this._connectWithRetry(this._abortReconnectController.signal);
  }

  /**
   * Methods
   */

  /**
   * Sends a Dto event to a RabbitMQ exchange.
   *
   * Publishes the provided event to the configured RabbitMQ exchange using the current channel.
   * Throws an error if the RabbitMQ channel is not available.
   *
   * @param event - The Dto event to be sent.
   * @returns A promise that resolves to an object indicating whether the message was successfully published.
   * @throws {Error} If the RabbitMQ channel is not available.
   */
  async sendEvent(event: IDtoEvent<IDtoPayload>): Promise<boolean> {
    const exchange = this._config.messageBroker?.amqp?.exchange as string;
    if (!this._channel) {
      throw new Error('RabbitMQ is down. Cannot send message.');
    }
    await this._channel.assertExchange(exchange, 'headers', { durable: false });
    /*await channel.assertQueue(queueName, {
      durable: false,
      autoDelete: true,
      exclusive: false,
    });*/
    const channel = this._channel;

    this._logger.debug(`Publishing to ${exchange}:`, event);

    const success = channel.publish(
      exchange || '',
      '',
      Buffer.from(JSON.stringify(instanceToPlain(event)), 'utf-8'),
      {
        contentEncoding: 'utf-8',
        contentType: 'application/json',
        headers: {
          ...event._context,
          eventId: event._eventId,
        },
      },
    );
    return success;
  }

  /**
   * Shuts down the sender by closing the client.
   *
   * @return {Promise<void>} A promise that resolves when the client is closed.
   */
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
        await new Promise((res) => setTimeout(res, RabbitMqDtoSender.RECONNECT_DELAY));
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
}
