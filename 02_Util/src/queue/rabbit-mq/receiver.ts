// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import * as amqplib from 'amqplib';
import { ILogObj, Logger } from 'tslog';
import { MemoryCache } from '../..';
import {
  AbstractMessageHandler,
  CacheNamespace,
  CallAction,
  ICache,
  IModule,
  Message,
  OcppError,
  OcppRequest,
  OcppResponse,
  RetryMessageError,
  SystemConfig,
} from '@citrineos/base';
import { plainToInstance } from 'class-transformer';

/**
 * Implementation of a {@link IMessageHandler} using RabbitMQ as the underlying transport.
 */
export class RabbitMqReceiver extends AbstractMessageHandler {
  /**
   * Constants
   */
  private static readonly QUEUE_PREFIX = 'rabbit_queue_';
  private static readonly CACHE_PREFIX = 'rabbit_subscription_';
  private static readonly RECONNECT_DELAY = 5000;

  /**
   * Fields
   */
  protected _cache: ICache;
  protected _connection?: amqplib.Connection;
  protected _channel?: amqplib.Channel;
  private _reconnecting = false;
  private _abortReconnectController?: AbortController;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, module?: IModule, cache?: ICache) {
    super(config, logger, module);
    this._cache = cache || new MemoryCache();
  }

  async initConnection(): Promise<any> {
    this._abortReconnectController = new AbortController();
    this._channel = await this._connectWithRetry(this._abortReconnectController.signal);
  }

  /**
   * Methods
   */

  /**
   * Binds queue to an exchange given identifier and optional actions and filter.
   * Note: Due to the nature of AMQP 0-9-1 model, if you need to filter for the identifier, you **MUST** provide it in the filter object.
   *
   * @param {string} identifier - The identifier of the channel to subscribe to.
   * @param {CallAction[]} actions - Optional. An array of actions to filter the messages.
   * @param {{ [k: string]: string; }} filter - Optional. An object representing the filter to apply on the messages.
   * @return {Promise<boolean>} A promise that resolves to true if the subscription is successful, false otherwise.
   */
  async subscribe(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<boolean> {
    // If actions are a defined but empty list, it is likely a module
    // with no available actions and should not have a queue.
    //
    // If actions are undefined, it is likely a charger,
    // which is "allowed" not to have actions.
    if (actions && actions.length === 0) {
      this._logger.debug(
        `Skipping queue binding for module ${identifier} as there are no available actions.`,
      );

      return true;
    }

    const exchange = this._config.util.messageBroker.amqp?.exchange as string;
    const queueName = `${RabbitMqReceiver.QUEUE_PREFIX}${identifier}_${Date.now()}`;

    // Ensure that filter includes the x-match header set to all
    filter = filter
      ? {
          'x-match': 'all',
          ...filter,
        }
      : { 'x-match': 'all' };

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

    // Bind queue based on provided actions and filters
    if (actions && actions.length > 0) {
      for (const action of actions) {
        this._logger.debug(
          `Bind ${queueName} on ${exchange} for ${action} with filter ${JSON.stringify(filter)}.`,
        );
        await channel.bindQueue(queueName, exchange, '', { action, ...filter });
      }
    } else {
      this._logger.debug(`Bind ${queueName} on ${exchange} with filter ${JSON.stringify(filter)}.`);
      await channel.bindQueue(queueName, exchange, '', filter);
    }

    // Start consuming messages
    await channel.consume(queueName, (msg) => this._onMessage(msg, channel));

    // Define cache key
    const cacheKey = `${RabbitMqReceiver.CACHE_PREFIX}${identifier}`;

    // Retrieve cached queue names
    const cachedQueues = await this._cache
      .get<Array<string>>(cacheKey, CacheNamespace.Other, () => Array<string>)
      .then((value) => {
        if (value) {
          value.push(queueName);
          return value;
        }
        return new Array<string>(queueName);
      });

    // Add queue name to cache
    await this._cache.set(cacheKey, JSON.stringify(cachedQueues), CacheNamespace.Other);

    return true;
  }

  unsubscribe(identifier: string): Promise<boolean> {
    return this._cache
      .get<Array<string>>(
        `${RabbitMqReceiver.CACHE_PREFIX}${identifier}`,
        CacheNamespace.Other,
        () => Array<string>,
      )
      .then(async (queues) => {
        if (queues) {
          if (!this._channel) {
            throw new Error('RabbitMQ is down: cannot unsubscribe.');
          }
          const channel = this._channel;
          this._channel = channel;
          for (const queue of queues) {
            await channel.unbindQueue(
              queue,
              this._config.util.messageBroker.amqp?.exchange || '',
              '',
            );
            const messageCount = await this._channel?.deleteQueue(queue);
            this._logger.info(
              `Queue ${identifier} deleted with ${messageCount?.messageCount} messages remaining.`,
            );
          }
          return true;
        } else {
          this._logger.warn(
            `Failed to delete queue for ${identifier}, queue name not found in cache.`,
          );
          return false;
        }
      });
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
    const url = this._config.util.messageBroker.amqp?.url;
    if (!url) {
      throw new Error('RabbitMQ URL is not configured');
    }
    while (true) {
      if (abortSignal?.aborted) {
        this._logger.warn('RabbitMQ reconnect aborted by signal.');
        throw new Error('RabbitMQ reconnect aborted');
      }
      try {
        const connection = await amqplib.connect(url);
        this._connection = connection;
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
        await new Promise((res) => setTimeout(res, RabbitMqReceiver.RECONNECT_DELAY));
      }
    }
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
  protected async _onMessage(
    message: amqplib.ConsumeMessage | null,
    channel: amqplib.Channel,
  ): Promise<void> {
    if (message) {
      try {
        this._logger.debug(
          '_onMessage:Received message:',
          message.properties,
          message.content.toString(),
        );
        const parsed = plainToInstance(
          Message<OcppRequest | OcppResponse | OcppError>,
          <Message<OcppRequest | OcppResponse | OcppError>>JSON.parse(message.content.toString()),
        );
        await this.handle(parsed, message.properties);
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
