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
 * {@link RabbitMqReceiver} used by the OCPP router.
 *
 * Each router instance owns a single queue, created lazily on the first {@link subscribe} call.
 * Charging station connections add and remove header bindings on that queue rather than creating
 * queues and consumers of their own, so only messages for stations connected to this instance
 * reach it. Consumer count stays constant (1) regardless of how many stations are connected,
 * which keeps it clear of the broker's per-channel consumer limit at thousands of stations.
 *
 * The instance queue name is derived from `amqpConfig.instanceIdentifier`, defaulting to
 * `router-<Date.now()>` when not set. This value should be set to a stable, unique identifier
 * per process (e.g. the ECS task hostname or Kubernetes pod name) via the `INSTANCE_IDENTIFIER`
 * environment variable wired into `SystemConfig.messageBroker.amqp.instanceIdentifier`.
 */
export class RabbitMqRouterReceiver extends RabbitMqReceiver {
  protected static readonly CHANNEL_ID = 'router-receiver';

  protected readonly _instanceQueueName: string;
  protected readonly _prefetch: number;
  protected _instanceQueueReady?: Promise<void>;
  protected _instanceConsumerTags: string[] = [];
  protected _instanceBindings = new Map<string, Array<Record<string, string>>>();

  constructor(deps: {
    config: SystemConfig;
    channelManager: RabbitMQChannelManager;
    logger?: Logger<ILogObj>;
    module?: IModule;
  }) {
    super(deps);
    const id = deps.config.messageBroker.amqp?.instanceIdentifier ?? `router-${Date.now()}`;
    this._instanceQueueName = `rabbit_queue_router_${id}`;
    this._prefetch = deps.config.messageBroker.amqp.prefetch.router;
  }

  protected _lazyInitInstanceQueue(): Promise<void> {
    if (!this._instanceQueueReady) {
      this._instanceQueueReady = this.initializeInstanceQueue(this._instanceQueueName).catch(
        (err) => {
          this._instanceQueueReady = undefined;
          throw err;
        },
      );
    }
    return this._instanceQueueReady;
  }

  /**
   * Creates the per-instance queue and its single consumer. That consumer handles all messages
   * for all connected stations — requests and responses, all origins — with routing done in
   * application code via the ocppConnectionName in each message.
   *
   * @param queueName  Stable, instance-unique name (e.g. `rabbit_queue_router_<hostname>`).
   */
  async initializeInstanceQueue(queueName: string): Promise<void> {
    const channel = await this._channelManager.getChannel(RabbitMqRouterReceiver.CHANNEL_ID);
    await channel.assertExchange(this.exchange, 'headers', { durable: false });
    await channel.assertQueue(queueName, {
      durable: true,
      autoDelete: true,
      exclusive: false,
    });

    this._instanceConsumerTags.push(await this._consume(channel, queueName, this._prefetch));

    this._logger.info(`[instance-queue] Initialized ${queueName} with 1 consumer`);
  }

  /**
   * Re-establishes the instance queue and its consumer after a reconnection.
   * Re-adds all currently tracked bindings (idempotent — handles the edge case
   * where the queue was deleted and needs to be fully rebuilt).
   */
  protected async _onReconnect(): Promise<void> {
    if (!this._instanceQueueReady) return; // no charger has connected yet, nothing to reinitialize

    const queueName = this._instanceQueueName;
    const channel = await this._channelManager.getChannel(RabbitMqRouterReceiver.CHANNEL_ID);

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
    this._instanceConsumerTags = [await this._consume(channel, queueName, this._prefetch)];

    this._logger.info(
      `[instance-queue] Reinitialized ${queueName} after reconnect: ` +
        `1 consumer, ${reboundCount} binding(s) restored`,
    );
  }

  /**
   * Adds header bindings to the instance queue for this identifier. No new queue or consumer
   * is created.
   * Note: Due to the nature of AMQP 0-9-1 model, if you need to filter for the identifier, you **MUST** provide it in the filter object.
   *
   * @param {string} identifier - The identifier the bindings are tracked under, for {@link unsubscribe}.
   * @param {CallAction[]} actions - Optional. An array of actions to filter the messages.
   * @param {{ [k: string]: string; }} filter - Optional. An object representing the filter to apply on the messages.
   * @return {Promise<boolean>} A promise that resolves to true if the subscription is successful, false otherwise.
   */
  async subscribe(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<boolean> {
    if (actions && actions.length === 0) {
      this._logger.debug(`Skipping queue binding for ${identifier} as there are no actions.`);
      return true;
    }

    await this._lazyInitInstanceQueue();

    const baseArgs: Record<string, string> = { 'x-match': 'all', ...filter };
    const channel = await this._channelManager.getChannel(RabbitMqRouterReceiver.CHANNEL_ID);
    const addedBindings: Array<Record<string, string>> = [];

    if (actions && actions.length > 0) {
      for (const action of actions) {
        const args = { action: action.toString(), ...baseArgs };
        await channel.bindQueue(this._instanceQueueName, this.exchange, '', args);
        addedBindings.push(args);
      }
    } else {
      await channel.bindQueue(this._instanceQueueName, this.exchange, '', baseArgs);
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

  async unsubscribe(identifier: string): Promise<boolean> {
    const bindings = this._instanceBindings.get(identifier);
    if (!bindings?.length) {
      this._logger.warn(`No bindings found for ${identifier} during unsubscribe.`);
      return false;
    }

    // Remove from map first — prevents reconnect from re-adding bindings for a disconnected charger
    this._instanceBindings.delete(identifier);

    try {
      const channel = await this._channelManager.getChannel(RabbitMqRouterReceiver.CHANNEL_ID);
      for (const args of bindings) {
        try {
          await channel.unbindQueue(this._instanceQueueName, this.exchange, '', args);
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

  async shutdown(): Promise<void> {
    try {
      const channel = await this._channelManager.getChannel(RabbitMqRouterReceiver.CHANNEL_ID);
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
  }
}
