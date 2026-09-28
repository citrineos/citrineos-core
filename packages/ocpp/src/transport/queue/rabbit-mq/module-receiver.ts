// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IModule } from '@citrineos/base';
import { type CallAction, type SystemConfig } from '@citrineos/types';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { RabbitMQChannelManager } from './channel-manager.js';
import { RabbitMqReceiver } from './receiver.js';

/**
 * {@link RabbitMqReceiver} used by modules.
 *
 * Each identifier (a module's event group, or its `_responses` counterpart) maps to a named queue
 * (`rabbit_queue_<identifier>`). Every pod running that module consumes from the same queue, so
 * RabbitMQ load balances incoming messages across them as competing consumers. Each identifier
 * gets its own channel, so a channel error on one queue does not take down the others.
 */
export class RabbitMqModuleReceiver extends RabbitMqReceiver {
  protected static readonly QUEUE_PREFIX = 'rabbit_queue_';
  protected static readonly CHANNEL_PREFIX = 'module-receiver-';

  protected readonly _prefetch: number;

  protected _consumerTags = new Map<string, string[]>();
  protected _moduleSubscriptions = new Map<
    string,
    Array<{ actions?: CallAction[]; filter?: Record<string, string> }>
  >();

  constructor(deps: {
    config: SystemConfig;
    channelManager: RabbitMQChannelManager;
    logger?: Logger<ILogObj>;
    module?: IModule;
  }) {
    super(deps);
    this._prefetch = deps.config.messageBroker.amqp.prefetch.module;
  }

  /**
   * Re-establishes all module queues, bindings, and consumers after a reconnection.
   * No-op when no module subscriptions have been registered.
   */
  protected async _onReconnect(): Promise<void> {
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
    // A defined but empty list is a module with no available actions, which should not have a queue.
    if (actions && actions.length === 0) {
      this._logger.debug(
        `Skipping queue binding for module ${identifier} as there are no available actions.`,
      );
      return true;
    }

    const existing = this._moduleSubscriptions.get(identifier) ?? [];
    this._moduleSubscriptions.set(identifier, [...existing, { actions, filter }]);

    return this._subscribePerIdentifierQueue(identifier, actions, filter);
  }

  protected async _subscribePerIdentifierQueue(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<boolean> {
    const queueName = `${RabbitMqModuleReceiver.QUEUE_PREFIX}${identifier}`;

    // Ensure that filter includes the x-match header set to all
    filter = filter ? { 'x-match': 'all', ...filter } : { 'x-match': 'all' };

    const channel = await this._channelManager.getChannel(this._channelId(identifier));
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

    const consumerTag = await this._consume(channel, queueName, this._prefetch);
    const existing = this._consumerTags.get(identifier) ?? [];
    this._consumerTags.set(identifier, [...existing, consumerTag]);

    return true;
  }

  async unsubscribe(identifier: string): Promise<boolean> {
    this._moduleSubscriptions.delete(identifier);

    const channel = await this._channelManager.getChannel(this._channelId(identifier));
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
    for (const [identifier, consumerTags] of this._consumerTags) {
      const channel = await this._channelManager.getChannel(this._channelId(identifier));
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

  protected _channelId(identifier: string): string {
    return `${RabbitMqModuleReceiver.CHANNEL_PREFIX}${identifier}`;
  }
}
