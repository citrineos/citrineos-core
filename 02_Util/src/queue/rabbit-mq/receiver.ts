// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import * as amqplib from "amqplib";
import { ILogObj, Logger } from "tslog";
import { MemoryCache } from "../..";
import { AbstractMessageHandler, ICache, IModule, SystemConfig, CallAction, CacheNamespace, IMessage, OcppError, OcppRequest, OcppResponse, HandlerProperties, Message, RetryMessageError } from "@citrineos/base";
import { plainToInstance } from "class-transformer";

/**
 * Implementation of a {@link IMessageHandler} using RabbitMQ as the underlying transport.
 */
export class RabbitMqReceiver extends AbstractMessageHandler {

  /**
   * Constants
   */
  private static readonly QUEUE_PREFIX = "rabbit_queue_";
  private static readonly CACHE_PREFIX = "rabbit_subscription_";

  /**
   * Fields
   */
  protected _cache: ICache;
  protected _connection?: amqplib.Connection;
  protected _channel?: amqplib.Channel;
  protected _module?: IModule;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, cache?: ICache, module?: IModule) {
    super(config, logger);
    this._cache = cache || new MemoryCache();
    this._module = module;

    this._connect().then(channel => {
      this._channel = channel;
    });
  }

  /**
   * Getter & Setter
   */

  get module(): IModule | undefined {
    return this._module;
  }
  set module(value: IModule | undefined) {
    this._module = value;
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
  async subscribe(identifier: string, actions?: CallAction[], filter?: { [k: string]: string; }): Promise<boolean> {
    const exchange = this._config.util.messageBroker.amqp?.exchange as string;
    const queueName = `${RabbitMqReceiver.QUEUE_PREFIX}${identifier}_${Date.now()}`;

    // Ensure that filter includes the x-match header set to all
    filter = filter ? {
      "x-match": "all",
      ...filter
    } : { "x-match": "all" };

    const channel = this._channel || await this._connect();
    this._channel = channel;

    // Assert exchange and queue
    await channel.assertExchange(exchange, "headers", { durable: false });
    await channel.assertQueue(queueName, { durable: false, autoDelete: true, exclusive: false });

    // Bind queue based on provided actions and filters
    if (actions && actions.length > 0) {
      for (const action of actions) {
        this._logger.debug(`Bind ${queueName} on ${exchange} for ${action} with filter ${JSON.stringify(filter)}.`);
        await channel.bindQueue(queueName, exchange, "", { action, ...filter });
      }
    } else {
      this._logger.debug(`Bind ${queueName} on ${exchange} with filter ${JSON.stringify(filter)}.`);
      await channel.bindQueue(queueName, exchange, "", filter);
    }

    // Start consuming messages
    await channel.consume(queueName, (msg) => this._onMessage(msg, channel));

    // Define cache key
    const cacheKey = `${RabbitMqReceiver.CACHE_PREFIX}${identifier}`;

    // Retrieve cached queue names
    const cachedQueues = await this._cache.get<Array<string>>(cacheKey, CacheNamespace.Other, () => Array<string>)
      .then(value => {
        if (value) {
          value.push(queueName);
          return value;
        }
        return new Array<string>(queueName)
      });


    // Add queue name to cache
    await this._cache.set(cacheKey, JSON.stringify(cachedQueues), CacheNamespace.Other);

    return true;

  }

  unsubscribe(identifier: string): Promise<boolean> {
    return this._cache.get<Array<string>>(`${RabbitMqReceiver.CACHE_PREFIX}${identifier}`, CacheNamespace.Other, () => Array<string>).then(async queues => {
      if (queues) {
        const channel = this._channel || await this._connect();
        this._channel = channel;
        for (const queue of queues) {
          await channel.unbindQueue(queue, this._config.util.messageBroker.amqp?.exchange || "", "");
          const messageCount = await this._channel?.deleteQueue(queue);
          this._logger.info(`Queue ${identifier} deleted with ${messageCount?.messageCount} messages remaining.`);
        }
        return true;
      }
      else {
        this._logger.warn(`Failed to delete queue for ${identifier}, queue name not found in cache.`);
        return false;
      }
    });
  }

  async handle(message: IMessage<OcppRequest | OcppResponse | OcppError>, props?: HandlerProperties): Promise<void> {
    await this._module?.handle(message, props);
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Protected Methods
   */

  /**
   * Connect to RabbitMQ
   */
  protected _connect(): Promise<amqplib.Channel> {
    return amqplib.connect(this._config.util.messageBroker.amqp?.url || "").then((connection) => {
      this._connection = connection;
      return connection.createChannel();
    }).then(channel => {
      // Add listener for channel errors
      channel.on("error", (err) => {
        this._logger.error("AMQP channel error", err);
        // TODO: add recovery logic
      });
      return channel;
    });
  }

  /**
   * Underlying RabbitMQ message handler.
   *
   * @param message The AMQPMessage to process
   */
  protected async _onMessage(message: amqplib.ConsumeMessage | null, channel: amqplib.Channel): Promise<void> {
    if (message) {
      try {
        this._logger.debug("_onMessage:Received message:", message.properties, message.content.toString());
        const parsed = plainToInstance(Message<OcppRequest | OcppResponse | OcppError>, <Message<OcppRequest | OcppResponse | OcppError>>JSON.parse(message.content.toString()));
        await this.handle(parsed, message.properties);
      } catch (error) {
        if (error instanceof RetryMessageError) {
          this._logger.warn("Retrying message: ", error.message);
          // Retryable error, usually ongoing call with station when trying to send new call
          channel.nack(message);
          return;
        } else {
          this._logger.error("Error while processing message:", error, message);
        }
      }
      channel.ack(message);
    }
  }
}