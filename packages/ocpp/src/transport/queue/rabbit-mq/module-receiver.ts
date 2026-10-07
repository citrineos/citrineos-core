// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DeadLetterSource, recordOcppMessageDivertedStale } from '@/transport/metrics.js';
import { type CallAction, MessageOrigin, MessageState } from '@citrineos/types';
import type * as amqplib from 'amqplib';
import { RabbitMqReceiver, type RabbitMqReceiverDependencies } from './receiver.js';
import type { OCPPMessage } from './util.js';

/**
 * {@link RabbitMqReceiver} used by modules.
 *
 * Each identifier (a module's event group, or its `_responses` counterpart) maps to a named queue
 * (`rabbit_queue_<identifier>`). Every pod running that module consumes from the same queue, so
 * RabbitMQ load balances incoming messages across them as competing consumers. Each identifier
 * gets its own channel, so a channel error on one queue does not take down the others.
 *
 * Every message is processed, however late. A station Call delivered after maxCallLengthSeconds
 * is no longer time sensitive (the station has already timed it out), so it is moved to the
 * queue's catch-up queue (`<queue>.stale`) instead of holding up fresh Calls queued behind it.
 * The catch-up consumer has its own, smaller prefetch.
 */
export class RabbitMqModuleReceiver extends RabbitMqReceiver {
  protected static readonly QUEUE_PREFIX = 'rabbit_queue_';
  protected static readonly CATCH_UP_SUFFIX = '.stale';
  protected static readonly CHANNEL_PREFIX = 'module-receiver-';

  protected readonly _source = DeadLetterSource.Module;
  protected readonly _prefetch: number;
  protected readonly _catchUpPrefetch: number;
  protected readonly _maxCallLengthMs: number;

  protected _catchUpQueues = new Map<string, string>();
  protected _catchUpConsumers = new Set<string>();

  protected _consumerTags = new Map<string, string[]>();
  protected _consumerChannels = new Map<string, amqplib.Channel>();
  protected _moduleSubscriptions = new Map<
    string,
    Array<{ actions?: CallAction[]; filter?: Record<string, string> }>
  >();

  constructor(deps: RabbitMqReceiverDependencies) {
    super(deps);
    this._prefetch = deps.config.messageBroker.amqp.prefetch.module;
    this._catchUpPrefetch = deps.config.messageBroker.amqp.prefetch.moduleStale;
    this._maxCallLengthMs = deps.config.timeouts.maxCallLengthSeconds * 1000;
  }

  /**
   * Re-establishes all module queues, bindings, and consumers after a reconnection.
   * No-op when no module subscriptions have been registered.
   */
  protected async _onReconnect(): Promise<void> {
    if (this._moduleSubscriptions.size === 0) return;

    let restored = 0;
    for (const [identifier, subscriptions] of this._moduleSubscriptions) {
      if (this._isStopping) return;
      const channel = await this._channelManager.getChannel(this._channelId(identifier));
      if (this._hasCurrentConsumers(identifier, subscriptions, channel)) continue;
      await this._discardPartialConsumers(identifier, channel);
      this._consumerTags.delete(identifier);
      this._consumerChannels.delete(identifier);
      this._catchUpConsumers.delete(identifier);
      for (const subscription of subscriptions) {
        if (!this._moduleSubscriptions.get(identifier)?.includes(subscription)) continue;
        await this._subscribePerIdentifierQueue(
          identifier,
          subscription.actions,
          subscription.filter,
          subscription,
        );
        restored++;
      }
    }

    this._logger.info(
      `[module-queues] Reinitialized ${this._moduleSubscriptions.size} queue(s) after reconnect ` +
        `(${restored} subscription(s) restored)`,
    );
  }

  protected async _onChannelInvalidated(channelId: string): Promise<void> {
    if (!channelId.startsWith(RabbitMqModuleReceiver.CHANNEL_PREFIX)) return;
    const identifier = channelId.slice(RabbitMqModuleReceiver.CHANNEL_PREFIX.length);
    const subscriptions = this._moduleSubscriptions.get(identifier);
    if (!subscriptions?.length || this._isStopping) return;

    const replacement = await this._channelManager.getChannel(channelId);
    if (this._isStopping || this._hasCurrentConsumers(identifier, subscriptions, replacement))
      return;
    await this._discardPartialConsumers(identifier, replacement);
    this._consumerTags.delete(identifier);
    this._consumerChannels.delete(identifier);
    this._catchUpConsumers.delete(identifier);

    for (const subscription of subscriptions) {
      if (!this._moduleSubscriptions.get(identifier)?.includes(subscription)) continue;
      if (this._isStopping) return;
      await this._subscribePerIdentifierQueue(
        identifier,
        subscription.actions,
        subscription.filter,
        subscription,
      );
    }
    if (!this._isStopping) {
      this._logger.info(`[module-queues] Restored channel ${channelId} after channel failure`);
    }
  }

  private _hasCurrentConsumers(
    identifier: string,
    subscriptions: Array<{ actions?: CallAction[]; filter?: Record<string, string> }>,
    channel: amqplib.Channel,
  ): boolean {
    const expectedCatchUp = subscriptions.some(
      ({ filter }) => filter?.state !== MessageState.Response.toString(),
    );
    const expectedTags = subscriptions.length + Number(expectedCatchUp);
    return (
      this._consumerChannels.get(identifier) === channel &&
      this._consumerTags.get(identifier)?.length === expectedTags &&
      this._catchUpConsumers.has(identifier) === expectedCatchUp
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

    const subscription = { actions, filter };
    const existing = this._moduleSubscriptions.get(identifier) ?? [];
    this._moduleSubscriptions.set(identifier, [...existing, subscription]);

    return this._subscribePerIdentifierQueue(identifier, actions, filter, subscription);
  }

  protected async _subscribePerIdentifierQueue(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
    expectedSubscription?: { actions?: CallAction[]; filter?: Record<string, string> },
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
    if (this._isStopping) {
      if (consumerTag) await channel.cancel(consumerTag).catch(() => undefined);
      return true;
    }
    if (
      expectedSubscription &&
      !this._moduleSubscriptions.get(identifier)?.includes(expectedSubscription)
    ) {
      if (consumerTag) await channel.cancel(consumerTag).catch(() => undefined);
      return true;
    }
    if (!consumerTag) return true;
    const existing = this._consumerTags.get(identifier) ?? [];
    this._consumerTags.set(identifier, [...existing, consumerTag]);
    this._consumerChannels.set(identifier, channel);

    if (filter.state !== MessageState.Response.toString()) {
      await this._consumeCatchUpQueue(identifier, queueName, channel);
    }

    return true;
  }

  protected async _consumeCatchUpQueue(
    identifier: string,
    queueName: string,
    channel: amqplib.Channel,
  ): Promise<void> {
    if (this._catchUpConsumers.has(identifier)) {
      return;
    }
    const catchUpQueue = `${queueName}${RabbitMqModuleReceiver.CATCH_UP_SUFFIX}`;
    await channel.assertQueue(catchUpQueue, {
      durable: true,
      autoDelete: true,
      exclusive: false,
    });
    const consumerTag = await this._consume(channel, catchUpQueue, this._catchUpPrefetch);
    if (this._isStopping || !this._moduleSubscriptions.has(identifier)) {
      if (consumerTag) await channel.cancel(consumerTag).catch(() => undefined);
      return;
    }
    if (!consumerTag) return;
    this._consumerTags.set(identifier, [
      ...(this._consumerTags.get(identifier) ?? []),
      consumerTag,
    ]);
    this._catchUpQueues.set(queueName, catchUpQueue);
    this._catchUpConsumers.add(identifier);
  }

  protected async _dispatch(
    parsed: OCPPMessage,
    message: amqplib.ConsumeMessage,
    channel: amqplib.Channel,
    queueName: string,
  ): Promise<void> {
    const catchUpQueue = this._catchUpQueues.get(queueName);
    if (catchUpQueue && this._isLateStationCall(parsed)) {
      channel.sendToQueue(catchUpQueue, message.content, message.properties);
      recordOcppMessageDivertedStale(String(parsed.action));
      this._logger.debug(
        `Moved late ${parsed.action} from ${parsed.context.ocppConnectionName} to ${catchUpQueue}. ` +
          `correlationId=${parsed.context.correlationId}`,
      );
      return;
    }
    await super._dispatch(parsed, message, channel, queueName);
  }

  private _isLateStationCall(parsed: OCPPMessage): boolean {
    if (parsed.origin !== MessageOrigin.ChargingStation || parsed.state !== MessageState.Request) {
      return false;
    }
    const ageMs = Date.now() - new Date(parsed.context.timestamp).getTime();
    return ageMs > this._maxCallLengthMs;
  }

  async unsubscribe(identifier: string): Promise<boolean> {
    this._moduleSubscriptions.delete(identifier);
    this._catchUpConsumers.delete(identifier);
    const queueName = `${RabbitMqModuleReceiver.QUEUE_PREFIX}${identifier}`;
    this._catchUpQueues.delete(queueName);

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
      this._consumerChannels.delete(identifier);
      return true;
    } else {
      this._logger.warn(`No consumer tag found for ${identifier} during unsubscribe.`);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    this._stopRecovery();
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
    this._consumerTags.clear();
    this._consumerChannels.clear();
  }

  protected _channelId(identifier: string): string {
    return `${RabbitMqModuleReceiver.CHANNEL_PREFIX}${identifier}`;
  }

  private async _discardPartialConsumers(
    identifier: string,
    channel: amqplib.Channel,
  ): Promise<void> {
    if (this._consumerChannels.get(identifier) !== channel) return;
    for (const consumerTag of this._consumerTags.get(identifier) ?? []) {
      try {
        await channel.cancel(consumerTag);
      } catch {
        // A partially restored consumer may already have disappeared with a channel failure.
      }
    }
  }
}
