// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction, IModule, SystemConfig } from '@citrineos/base';
import { AbstractMessageHandler, Message, RetryMessageError } from '@citrineos/base';
import * as amqplib from 'amqplib';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { RabbitMQChannelManager } from './ChannelManager.js';

/**
 * Implementation of a {@link IMessageHandler} using RabbitMQ as the underlying transport.
 *
 * Supports two operating modes:
 *
 * MODULE MODE (default): each identifier gets its own queue (`rabbit_queue_<identifier>`).
 * Suitable for the small fixed set of module queues (Provisioning, Transactions, etc.).
 *
 * ROUTER MODE (per-instance queue): activated automatically when `amqpConfig` is supplied
 * to the constructor. A single shared queue is created lazily on the first `subscribe()` call.
 * Charger connections add/remove bindings on that queue rather than creating new queues and
 * consumers. Consumer count stays constant (1) regardless of how many chargers are connected,
 * making it suitable for scaling to thousands of chargers without hitting MQ's per-channel
 * consumer limit.
 *
 * The instance queue name is derived from `amqpConfig.instanceIdentifier`, defaulting to
 * `router-<Date.now()>` when not set. This value should be set to a stable, unique identifier
 * per process (e.g. the ECS task hostname or Kubernetes pod name) via the `INSTANCE_IDENTIFIER`
 * environment variable wired into `SystemConfig.util.messageBroker.amqp.instanceIdentifier`.
 */
export class RabbitMqReceiver extends AbstractMessageHandler {
  protected static readonly QUEUE_PREFIX = 'rabbit_queue_';
  protected static readonly CHANNEL_ID = 'receiver';

  protected _channelManager: RabbitMQChannelManager;
  protected exchange: string;
  protected readonly _isRouterMode: boolean;

  protected _consumerTags = new Map<string, string[]>();
  protected _moduleSubscriptions = new Map<
    string,
    Array<{ actions?: CallAction[]; filter?: Record<string, string> }>
  >();
  protected readonly _instanceQueueName?: string;
  protected _instanceQueueReady?: Promise<void>;
  protected _instanceConsumerTags: string[] = [];
  protected _instanceBindings = new Map<string, Array<Record<string, string>>>();

  constructor({
    config,
    channelManager,
    logger,
    module,
    routerMode,
  }: {
    config: SystemConfig;
    channelManager: RabbitMQChannelManager;
    logger?: Logger<ILogObj>;
    module?: IModule;
    routerMode?: boolean;
  }) {
    super(logger, module);
    this._channelManager = channelManager;
    const exchange = config.util.messageBroker.amqp?.exchange;
    if (!exchange) {
      throw new Error('RabbitMQ exchange is not configured');
    }
    this.exchange = exchange;
    this._isRouterMode = !!routerMode;
    if (this._isRouterMode) {
      const id = config.util.messageBroker.amqp?.instanceIdentifier ?? `router-${Date.now()}`;
      this._instanceQueueName = `rabbit_queue_router_${id}`;
    }

    this._channelManager.getConnectionManager().on('connected', async () => {
      try {
        await this._onReconnect();
      } catch (err) {
        this._logger.error('Failed to reinitialize after reconnect:', err);
      }
    });
  }

  protected _lazyInitInstanceQueue(): Promise<void> {
    if (!this._instanceQueueReady) {
      this._instanceQueueReady = this.initializeInstanceQueue(this._instanceQueueName!).catch(
        (err) => {
          this._instanceQueueReady = undefined;
          throw err;
        },
      );
    }
    return this._instanceQueueReady;
  }

  /**
   * Switches this receiver into router mode by creating a single per-process queue.
   *
   * After this is called, {@link subscribe} adds bindings to this queue instead of
   * creating per-charger queues and consumers. A single consumer handles all messages
   * for all connected chargers — requests and responses, all origins — with routing
   * done in application code via the ocppConnectionName in each message.
   *
   * Call once at router startup, before any chargers connect.
   *
   * @param queueName  Stable, instance-unique name (e.g. `rabbit_queue_router_<hostname>`).
   */
  async initializeInstanceQueue(queueName: string): Promise<void> {
    const channel = await this._channelManager.getChannel(RabbitMqReceiver.CHANNEL_ID);
    await channel.assertExchange(this.exchange, 'headers', { durable: false });
    await channel.assertQueue(queueName, {
      durable: true,
      autoDelete: true,
      exclusive: false,
    });

    const { consumerTag } = await channel.consume(queueName, (msg) =>
      this._onMessage(msg, channel),
    );
    this._instanceConsumerTags.push(consumerTag);

    this._logger.info(`[instance-queue] Initialized ${queueName} with 1 consumer`);
  }

  protected async _onReconnect(): Promise<void> {
    if (this._isRouterMode) {
      await this._reinitializeInstanceQueue();
    } else {
      await this._reinitializeModuleQueues();
    }
  }

  /**
   * Re-establishes all MODULE MODE queues, bindings, and consumers after a reconnection.
   * No-op when in ROUTER MODE or when no module subscriptions have been registered.
   */
  protected async _reinitializeModuleQueues(): Promise<void> {
    if (this._moduleSubscriptions.size === 0) return;

    // Old consumer tags reference a dead channel — reset before re-subscribing
    this._consumerTags.clear();

    let restored = 0;
    for (const [identifier, subscriptions] of this._moduleSubscriptions) {
      for (const { actions, filter } of subscriptions) {
        await this._subscribePerIdentifierQueue(identifier, actions, filter);
        restored++;
      }
    }

    this._logger.info(
      `[module-queues] Reinitialized ${this._moduleSubscriptions.size} queue(s) after reconnect ` +
        `(${restored} subscription(s) restored)`,
    );
  }

  /**
   * Re-establishes the instance queue and its consumers after a reconnection.
   * Re-adds all currently tracked bindings (idempotent — handles the edge case
   * where the queue was deleted and needs to be fully rebuilt).
   */
  protected async _reinitializeInstanceQueue(): Promise<void> {
    if (!this._instanceQueueReady) return; // no charger has connected yet, nothing to reinitialize

    const queueName = this._instanceQueueName!;
    const channel = await this._channelManager.getChannel(RabbitMqReceiver.CHANNEL_ID);

    await channel.assertExchange(this.exchange, 'headers', { durable: false });
    await channel.assertQueue(queueName, {
      durable: true,
      autoDelete: true,
      exclusive: false,
    });

    // Re-bind all active charger subscriptions (idempotent if queue already has them)
    let reboundCount = 0;
    for (const bindings of this._instanceBindings.values()) {
      for (const args of bindings) {
        await channel.bindQueue(queueName, this.exchange, '', args);
        reboundCount++;
      }
    }

    // Re-create the single consumer on the new channel
    this._instanceConsumerTags = [];
    const { consumerTag } = await channel.consume(queueName, (msg) =>
      this._onMessage(msg, channel),
    );
    this._instanceConsumerTags.push(consumerTag);

    this._logger.info(
      `[instance-queue] Reinitialized ${queueName} after reconnect: ` +
        `1 consumer, ${reboundCount} binding(s) restored`,
    );
  }

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

    if (this._isRouterMode) {
      await this._lazyInitInstanceQueue();
      return this._bindToInstanceQueue(identifier, actions, filter);
    }

    const existing = this._moduleSubscriptions.get(identifier) ?? [];
    this._moduleSubscriptions.set(identifier, [...existing, { actions, filter }]);

    return this._subscribePerIdentifierQueue(identifier, actions, filter);
  }

  /**
   * ROUTER MODE: adds header bindings to the shared instance queue for this charger.
   * No new queue or consumer is created.
   */
  protected async _bindToInstanceQueue(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<boolean> {
    const baseArgs: Record<string, string> = { 'x-match': 'all', ...filter };
    const channel = await this._channelManager.getChannel(RabbitMqReceiver.CHANNEL_ID);
    const addedBindings: Array<Record<string, string>> = [];

    if (actions && actions.length > 0) {
      for (const action of actions) {
        const args = { action: action.toString(), ...baseArgs };
        await channel.bindQueue(this._instanceQueueName!, this.exchange, '', args);
        addedBindings.push(args);
      }
    } else {
      await channel.bindQueue(this._instanceQueueName!, this.exchange, '', baseArgs);
      addedBindings.push(baseArgs);
    }

    const existing = this._instanceBindings.get(identifier) ?? [];
    this._instanceBindings.set(identifier, [...existing, ...addedBindings]);

    this._logger.debug(
      `[instance-queue] Added ${addedBindings.length} binding(s) for ${identifier} ` +
        `(chargers tracked: ${this._instanceBindings.size})`,
    );
    return true;
  }

  /**
   * MODULE MODE: creates a dedicated queue per identifier with its own consumer(s).
   * Original behavior, unchanged.
   */
  protected async _subscribePerIdentifierQueue(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<boolean> {
    const queueName = `${RabbitMqReceiver.QUEUE_PREFIX}${identifier}`;

    // Ensure that filter includes the x-match header set to all
    filter = filter ? { 'x-match': 'all', ...filter } : { 'x-match': 'all' };

    const channel = await this._channelManager.getChannel(RabbitMqReceiver.CHANNEL_ID);
    if (!channel) {
      throw new Error('RabbitMQ is down: cannot subscribe.');
    }

    // Assert exchange and queue
    await channel.assertExchange(this.exchange, 'headers', { durable: false });
    await channel.assertQueue(queueName, {
      durable: true,
      autoDelete: true,
      exclusive: false,
    });

    // Bind queue based on provided actions and filters
    if (actions && actions.length > 0) {
      for (const action of actions) {
        this._logger.debug(
          `Bind ${queueName} on ${this.exchange} for ${action} with filter ${JSON.stringify(filter)}.`,
        );
        await channel.bindQueue(queueName, this.exchange, '', { action, ...filter });
        this._logger.info(
          `Queue ${queueName} bound to exchange ${this.exchange} for action ${action} with filter ${JSON.stringify(filter)}.`,
        );
      }
    } else {
      this._logger.debug(
        `Bind ${queueName} on ${this.exchange} with filter ${JSON.stringify(filter)}.`,
      );
      await channel.bindQueue(queueName, this.exchange, '', filter);
      this._logger.info(
        `Queue ${queueName} bound to exchange ${this.exchange} with filter ${JSON.stringify(filter)}.`,
      );
    }

    // Start consuming messages
    const consume = await channel.consume(queueName, (msg) => this._onMessage(msg, channel));
    const existing = this._consumerTags.get(identifier) ?? [];
    this._consumerTags.set(identifier, [...existing, consume.consumerTag]);

    return true;
  }

  async unsubscribe(identifier: string): Promise<boolean> {
    // ROUTER MODE: remove bindings from shared queue
    if (this._isRouterMode) {
      const bindings = this._instanceBindings.get(identifier);
      if (!bindings?.length) {
        this._logger.warn(`No bindings found for ${identifier} during unsubscribe.`);
        return false;
      }

      // Remove from map first — prevents reconnect from re-adding bindings for a disconnected charger
      this._instanceBindings.delete(identifier);

      try {
        const channel = await this._channelManager.getChannel(RabbitMqReceiver.CHANNEL_ID);
        for (const args of bindings) {
          try {
            await channel.unbindQueue(this._instanceQueueName!, this.exchange, '', args);
          } catch {
            this._logger.warn(`Could not unbind ${identifier} binding — may already be gone.`);
          }
        }
        this._logger.debug(
          `[instance-queue] Removed ${bindings.length} binding(s) for ${identifier} ` +
            `(chargers tracked: ${this._instanceBindings.size})`,
        );
      } catch {
        this._logger.warn(
          `Channel unavailable during unsubscribe for ${identifier} — bindings removed from local map only`,
        );
      }

      return true;
    }

    // MODULE MODE: cancel consumers
    this._moduleSubscriptions.delete(identifier);

    const channel = await this._channelManager.getChannel(RabbitMqReceiver.CHANNEL_ID);
    if (!channel) {
      this._logger.error('RabbitMQ is down: cannot unsubscribe.');
      return false;
    }
    const consumerTags = this._consumerTags.get(identifier);
    if (consumerTags && consumerTags.length > 0) {
      for (const consumerTag of consumerTags) {
        await channel.cancel(consumerTag);
        this._logger.debug(`Unsubscribed from ${identifier} with consumer tag ${consumerTag}.`);
      }
      this._consumerTags.delete(identifier);
      return true;
    } else {
      this._logger.warn(`No consumer tag found for ${identifier} during unsubscribe.`);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    // ROUTER MODE: cancel all tracked consumers on the shared queue
    if (this._isRouterMode) {
      try {
        const channel = await this._channelManager.getChannel(RabbitMqReceiver.CHANNEL_ID);
        for (const tag of this._instanceConsumerTags) {
          try {
            await channel.cancel(tag);
            this._logger.debug(`[instance-queue] Cancelled consumer ${tag} during shutdown.`);
          } catch (error) {
            this._logger.error(
              `[instance-queue] Error cancelling consumer ${tag} during shutdown.`,
              error,
            );
          }
        }
      } catch {
        this._logger.warn('[instance-queue] Channel unavailable during shutdown.');
      }
      return;
    }

    // MODULE MODE: cancel all tracked consumers
    for (const consumerTags of this._consumerTags.values()) {
      const channel = await this._channelManager.getChannel(RabbitMqReceiver.CHANNEL_ID);
      if (channel) {
        for (const consumerTag of consumerTags) {
          try {
            await channel.cancel(consumerTag);
            this._logger.debug(`Cancelled consumer with tag ${consumerTag} during shutdown.`);
          } catch (error) {
            this._logger.error(
              `Error cancelling consumer with tag ${consumerTag} during shutdown.`,
              error,
            );
          }
        }
      }
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
