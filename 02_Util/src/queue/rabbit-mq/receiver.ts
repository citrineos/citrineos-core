// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction, IModule } from '@citrineos/base';
import { AbstractMessageHandler, Message, RetryMessageError } from '@citrineos/base';
import * as amqplib from 'amqplib';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { RabbitMQChannelManager } from './ChannelManager.js';

/**
 * Implementation of a {@link IMessageHandler} using RabbitMQ as the underlying transport.
 */
export class RabbitMqReceiver extends AbstractMessageHandler {
  /**
   * Constants
   */
  private static readonly QUEUE_PREFIX = 'rabbit_queue_';
  private static readonly CHANNEL_ID = 'receiver';

  /**
   * Fields
   */
  protected _channelManager: RabbitMQChannelManager;
  protected _consumerTags = new Map<string, string[]>(); // Map of identifier to consumerTags for unsubscribing

  constructor(
    private exchange: string,
    channelManager: RabbitMQChannelManager,
    logger?: Logger<ILogObj>,
    module?: IModule,
  ) {
    super(logger, module);
    this._channelManager = channelManager;
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

    const queueName = `${RabbitMqReceiver.QUEUE_PREFIX}${identifier}`;

    // Ensure that filter includes the x-match header set to all
    filter = filter
      ? {
          'x-match': 'all',
          ...filter,
        }
      : { 'x-match': 'all' };

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
