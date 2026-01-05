// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

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
  CircuitBreakerState,
  CircuitBreaker,
} from '@citrineos/base';
import { plainToInstance } from 'class-transformer';

/**
 * Subscription metadata stored in cache for re-subscription after reconnect.
 */
interface SubscriptionMetadata {
  identifier: string;
  actions?: CallAction[];
  filter?: { [k: string]: string };
}

/**
 * Implementation of a {@link IMessageHandler} using RabbitMQ as the underlying transport.
 */
export class RabbitMqReceiver extends AbstractMessageHandler {
  /**
   * Constants
   */
  private static readonly QUEUE_PREFIX = 'rabbit_queue_';
  private static readonly CACHE_PREFIX = 'rabbit_subscription_';
  private static readonly METADATA_PREFIX = 'rabbit_subscription_metadata_';
  private static readonly REGISTRY_KEY = 'rabbit_subscription_registry';
  private static readonly RECONNECT_DELAY = 5000;

  /**
   * Fields
   */
  protected _cache: ICache;
  protected _connection?: amqplib.Connection;
  protected _channel?: amqplib.Channel;
  private _abortReconnectController?: AbortController;
  private _circuitBreaker: CircuitBreaker;
  private _reconnectInterval?: NodeJS.Timeout;

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    module?: IModule,
    cache?: ICache,
    circuitBreaker?: CircuitBreaker,
  ) {
    super(config, logger, module);
    this._cache = cache || new MemoryCache();
    this._circuitBreaker = circuitBreaker ?? new CircuitBreaker();
    this._circuitBreaker.onStateChange(this._onCircuitBreakerStateChange.bind(this));
  }

  async initConnection(): Promise<any> {
    if (this._circuitBreaker.state === 'CLOSED') {
      throw new Error('Circuit breaker is CLOSED. Cannot initialize RabbitMQ connection.');
    }
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

    // Define cache keys
    const cacheKey = `${RabbitMqReceiver.CACHE_PREFIX}${identifier}`;
    const metadataKey = `${RabbitMqReceiver.METADATA_PREFIX}${identifier}`;

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

    // Store subscription metadata for re-subscription after reconnect
    const subscriptionMetadata: SubscriptionMetadata = {
      identifier,
      actions,
      filter,
    };
    await this._cache.set(metadataKey, JSON.stringify(subscriptionMetadata), CacheNamespace.Other);

    // Add identifier to registry (list of all active subscriptions)
    const registry = await this._cache
      .get<Array<string>>(RabbitMqReceiver.REGISTRY_KEY, CacheNamespace.Other, () => Array<string>)
      .then((value) => {
        if (value && !value.includes(identifier)) {
          value.push(identifier);
          return value;
        } else if (!value) {
          return new Array<string>(identifier);
        }
        return value; // Already in registry
      });
    await this._cache.set(
      RabbitMqReceiver.REGISTRY_KEY,
      JSON.stringify(registry),
      CacheNamespace.Other,
    );

    return true;
  }

  unsubscribe(identifier: string): Promise<boolean> {
    const cacheKey = `${RabbitMqReceiver.CACHE_PREFIX}${identifier}`;
    const metadataKey = `${RabbitMqReceiver.METADATA_PREFIX}${identifier}`;
    return this._cache
      .get<Array<string>>(cacheKey, CacheNamespace.Other, () => Array<string>)
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
          // Remove the cache entries after successfully deleting all queues
          await this._cache.remove(cacheKey, CacheNamespace.Other);
          await this._cache.remove(metadataKey, CacheNamespace.Other);

          // Remove identifier from registry
          const registry = await this._cache.get<Array<string>>(
            RabbitMqReceiver.REGISTRY_KEY,
            CacheNamespace.Other,
            () => Array<string>,
          );
          if (registry) {
            const updatedRegistry = registry.filter((id) => id !== identifier);
            if (updatedRegistry.length === 0) {
              await this._cache.remove(RabbitMqReceiver.REGISTRY_KEY, CacheNamespace.Other);
            } else {
              await this._cache.set(
                RabbitMqReceiver.REGISTRY_KEY,
                JSON.stringify(updatedRegistry),
                CacheNamespace.Other,
              );
            }
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
    const url = this._config.util.messageBroker.amqp?.url;
    if (!url) {
      throw new Error('RabbitMQ URL is not configured');
    }
    while (true) {
      if (abortSignal?.aborted) {
        this._logger.warn('RabbitMQ reconnect aborted by signal.');
        throw new Error('RabbitMQ reconnect aborted');
      }
      if (this._circuitBreaker.state === 'CLOSED') {
        throw new Error('Circuit breaker is CLOSED. Cannot connect to RabbitMQ.');
      }
      try {
        const connection = await amqplib.connect(url, { heartbeat: 10 });
        this._connection = connection;
        const channel = await connection.createChannel();
        const exchange = this._config.util.messageBroker.amqp?.exchange as string;
        if (exchange) {
          await channel.assertExchange(exchange, 'headers', { durable: false });
        }
        channel.on('error', (err) => {
          this._logger.error('AMQP channel error', err);
        });
        this._setupConnectionListeners();
        this._circuitBreaker.triggerSuccess();
        // Re-subscribe to all cached subscriptions after successful reconnection
        await this._resubscribeAll();
        return channel;
      } catch (err) {
        this._logger.error('RabbitMQ connect failed, triggering circuit breaker failure', err);
        this._circuitBreaker.triggerFailure((err as Error)?.message);
        // Wait for circuit breaker to allow retry (exponential backoff handled by circuit breaker)
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }

  private _startReconnectInterval() {
    if (this._reconnectInterval) {
      clearInterval(this._reconnectInterval);
    }
    const delay = (this._config.maxReconnectDelay || 30) * 1000;
    this._logger.warn(
      `Starting continuous reconnect attempts every ${delay / 1000} seconds while circuit breaker is CLOSED.`,
    );
    this._reconnectInterval = setInterval(() => {
      this._logger.info('Attempting RabbitMQ reconnect due to circuit breaker CLOSED...');
      this._connectWithRetry()
        .then((channel) => {
          this._logger.info('RabbitMQ reconnect attempt succeeded.');
          this._channel = channel;
          this._circuitBreaker.triggerSuccess();
        })
        .catch((err) => {
          this._logger.error('RabbitMQ reconnect attempt failed.', err);
        });
    }, delay);
  }

  private _onCircuitBreakerStateChange(state: CircuitBreakerState, reason?: string) {
    this._logger.info(`[CircuitBreaker] State changed to ${state}${reason ? `: ${reason}` : ''}`);

    switch (state) {
      case 'CLOSED': {
        this._logger.error(
          'Circuit breaker CLOSED: shutting down RabbitMQ receiver. Reason:',
          reason,
        );
        void this.shutdown();
        this._startReconnectInterval();
        break;
      }
      case 'OPEN': {
        this._logger.info(
          'Circuit breaker is OPEN. Will attempt to (re)initialize RabbitMQ connection.',
        );
        if (this._reconnectInterval) {
          this._logger.info('Clearing reconnect interval as circuit breaker is now OPEN.');
          clearInterval(this._reconnectInterval);
          this._reconnectInterval = undefined;
        }
        this._connectWithRetry()
          .then((channel) => {
            this._logger.info('RabbitMQ connection (re)initialized.');
            this._channel = channel;
            this._circuitBreaker.triggerSuccess();
          })
          .catch((err) => {
            this._logger.error('RabbitMQ (re)init failed.', err);
          });
        break;
      }
      case 'FAILING': {
        this._logger.warn(
          'Circuit breaker is FAILING. RabbitMQ receiver will not receive messages until recovery. Reason:',
          reason,
        );
        break;
      }
      default:
        this._logger.warn('Unknown circuit breaker state:', state);
        break;
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
    this._logger.warn('RabbitMQ connection lost. Triggering circuit breaker failure.');
    this._connection = undefined;
    this._channel = undefined;
    this._circuitBreaker.triggerFailure('RabbitMQ connection lost');
    if (this._circuitBreaker.state === 'CLOSED') {
      this._startReconnectInterval();
    }
    if (this._circuitBreaker.state === 'FAILING') {
      this._logger.warn(
        'Circuit breaker is FAILING. RabbitMQ receiver will not receive messages until recovery.',
      );
      this._startReconnectInterval();
    }
  }

  /**
   * Re-subscribe to all cached subscriptions after reconnection.
   * This ensures queues are recreated with the same bindings.
   * Uses cache to retrieve subscription metadata.
   */
  private async _resubscribeAll(): Promise<void> {
    if (!this._channel) {
      this._logger.warn('Cannot re-subscribe: channel not available.');
      return;
    }

    try {
      // Get registry of all active subscription identifiers
      const registry = await this._cache.get<Array<string>>(
        RabbitMqReceiver.REGISTRY_KEY,
        CacheNamespace.Other,
        () => Array<string>,
      );

      if (!registry || registry.length === 0) {
        this._logger.debug('No active subscriptions found in cache to re-subscribe.');
        return;
      }

      this._logger.info(
        `Re-subscribing ${registry.length} active subscription(s) after RabbitMQ reconnection.`,
      );

      // Re-subscribe to all subscriptions in registry
      const resubscribePromises: Promise<boolean>[] = [];
      for (const identifier of registry) {
        // Get subscription metadata from cache
        const metadataKey = `${RabbitMqReceiver.METADATA_PREFIX}${identifier}`;
        const metadataJson = await this._cache.get<string>(metadataKey, CacheNamespace.Other);

        if (!metadataJson) {
          this._logger.warn(
            `Subscription metadata not found for ${identifier}, skipping re-subscription.`,
          );
          continue;
        }

        try {
          // Parse the JSON metadata to ensure proper deserialization
          const metadata: SubscriptionMetadata = JSON.parse(metadataJson);

          // Validate metadata structure
          if (!metadata.identifier || metadata.identifier !== identifier) {
            this._logger.warn(
              `Subscription metadata identifier mismatch for ${identifier}, skipping re-subscription.`,
            );
            continue;
          }

          this._logger.debug(
            `Re-subscribing identifier: ${identifier} with actions: ${JSON.stringify(metadata.actions)} and filter: ${JSON.stringify(metadata.filter)}`,
          );

          resubscribePromises.push(
            this._resubscribe(identifier, metadata.actions, metadata.filter).catch((error) => {
              this._logger.error(`Failed to re-subscribe ${identifier}:`, error);
              return false;
            }),
          );
        } catch (parseError) {
          this._logger.error(
            `Failed to parse subscription metadata for ${identifier}:`,
            parseError,
            metadataJson,
          );
        }
      }

      const results = await Promise.all(resubscribePromises);
      const successCount = results.filter((r) => r === true).length;
      this._logger.info(
        `Re-subscription complete: ${successCount}/${registry.length} subscriptions recreated successfully.`,
      );
    } catch (error) {
      this._logger.error('Error during re-subscription:', error);
    }
  }

  /**
   * Internal method to re-subscribe without the channel check.
   * Used during reconnection to recreate queues.
   */
  private async _resubscribe(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<boolean> {
    // If actions are a defined but empty list, skip (modules with no actions shouldn't have queues)
    if (actions && actions.length === 0) {
      this._logger.debug(`Skipping re-subscription for ${identifier}: actions array is empty.`);
      return true;
    }

    // Log warning if actions is undefined for module subscriptions (should have actions)
    // Router subscriptions (like "1_cp001") can have undefined actions, but module subscriptions should have them
    if ((!actions && identifier.includes('_requests')) || identifier.includes('_responses')) {
      this._logger.warn(
        `Re-subscribing module subscription ${identifier} without actions filter - this may cause messages to be routed incorrectly!`,
      );
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
      throw new Error('RabbitMQ is down: cannot re-subscribe.');
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
          `Re-bind ${queueName} on ${exchange} for ${action} with filter ${JSON.stringify(filter)}.`,
        );
        await channel.bindQueue(queueName, exchange, '', { action, ...filter });
      }
    } else {
      this._logger.debug(
        `Re-bind ${queueName} on ${exchange} with filter ${JSON.stringify(filter)}.`,
      );
      await channel.bindQueue(queueName, exchange, '', filter);
    }

    // Start consuming messages
    await channel.consume(queueName, (msg) => this._onMessage(msg, channel));

    // Update cache with new queue name
    const cacheKey = `${RabbitMqReceiver.CACHE_PREFIX}${identifier}`;
    const cachedQueues = await this._cache
      .get<Array<string>>(cacheKey, CacheNamespace.Other, () => Array<string>)
      .then((value) => {
        if (value) {
          value.push(queueName);
          return value;
        }
        return new Array<string>(queueName);
      });

    await this._cache.set(cacheKey, JSON.stringify(cachedQueues), CacheNamespace.Other);

    this._logger.debug(`Successfully re-subscribed ${identifier} with queue ${queueName}`);
    return true;
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
