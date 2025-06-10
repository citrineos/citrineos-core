// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractMessageHandler,
  CallAction,
  IMessageHandler,
  IModule,
  Message,
  OcppError,
  OcppRequest,
  OcppResponse,
  RetryMessageError,
  SystemConfig,
} from '@citrineos/base';
import { plainToInstance } from 'class-transformer';
import { Admin, Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { ILogObj, Logger } from 'tslog';

/**
 * Implementation of a {@link IMessageHandler} using Kafka as the underlying transport.
 */
export class KafkaReceiver extends AbstractMessageHandler implements IMessageHandler {
  /**
   * Fields
   */
  private _client: Kafka;
  private _topicName: string;
  private _consumerMap: Map<string, Consumer>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, module?: IModule) {
    super(config, logger, module);

    this._consumerMap = new Map<string, Consumer>();
    this._client = new Kafka({
      brokers: this._config.util.messageBroker.kafka?.brokers || [],
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: this._config.util.messageBroker.kafka?.sasl.username || '',
        password: this._config.util.messageBroker.kafka?.sasl.password || '',
      },
    });

    this._topicName = `${this._config.util.messageBroker.kafka?.topicPrefix}-${this._config.util.messageBroker.kafka?.topicName}`;
    const admin: Admin = this._client.admin();
    admin
      .connect()
      .then(() => admin.listTopics())
      .then((topics) => {
        this._logger.debug('Topics:', topics);
        if (!topics || topics.filter((topic) => topic === this._topicName).length === 0) {
          this._client
            .admin()
            .createTopics({ topics: [{ topic: this._topicName }] })
            .then(() => {
              this._logger.debug(`Topic ${this._topicName} created.`);
            })
            .catch((err) => {
              this._logger.error('Error creating topic', err);
            });
        } else {
          this._logger.debug(`Topic ${this._topicName} already exists.`);
        }
      })
      .then(() => admin.disconnect())
      .catch((err) => {
        this._logger.error(err);
      });
  }

  subscribe(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<boolean> {
    this._logger.debug(`Subscribing to ${this._topicName}...`, identifier, actions, filter);

    const consumer = this._client.consumer({ groupId: 'test-group' });
    return consumer
      .connect()
      .then(() => consumer.subscribe({ topic: this._topicName, fromBeginning: false }))
      .then(() =>
        consumer.run({
          autoCommit: false,
          eachMessage: (payload) => this._onMessage(payload, consumer),
        }),
      ) // TODO: Add filter
      .then(() => this._consumerMap.set(identifier, consumer))
      .then(() => true)
      .catch((err) => {
        this._logger.error(err);
        return false;
      });
  }

  unsubscribe(identifier: string): Promise<boolean> {
    const consumer = this._consumerMap.get(identifier);
    if (!consumer) {
      this._logger.error('Consumer not found', identifier);
      return Promise.resolve(false);
    }
    return consumer
      .disconnect()
      .then(() => this._consumerMap.delete(identifier))
      .catch((err) => {
        this._logger.error(err);
        return false;
      });
  }

  async shutdown(): Promise<void> {
    for (const consumer of this._consumerMap.values()) {
      await consumer.disconnect();
    }
  }

  /**
   * Private Methods
   */

  /**
   * Underlying Kafka message handler.
   *
   * @param message The kafka message to process
   */
  private async _onMessage(
    { topic, partition, message }: EachMessagePayload,
    consumer: Consumer,
  ): Promise<void> {
    this._logger.debug(
      `Received message ${message.value?.toString()} on topic ${topic} partition ${partition}`,
    );
    try {
      const messageValue = message.value;
      if (messageValue) {
        const parsed = plainToInstance(
          Message<OcppRequest | OcppResponse | OcppError>,
          messageValue.toString(),
        );
        await this.handle(parsed, message.key?.toString());
      }
    } catch (error) {
      if (error instanceof RetryMessageError) {
        this._logger.warn('Retrying message: ', error.message);
        // Retryable error, usually ongoing call with station when trying to send new call
        return;
      } else {
        this._logger.error('Error while processing message:', error, message);
      }
    }
    await consumer.commitOffsets([{ topic, partition, offset: message.offset }]);
  }

  initConnection(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
