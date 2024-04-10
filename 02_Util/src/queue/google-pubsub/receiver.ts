// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  Message as PubSubMessage,
  PubSub,
  Subscription,
  Topic,
} from '@google-cloud/pubsub';
import { ILogObj, Logger } from 'tslog';
import { MemoryCache } from '../../cache/memory';
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
 * Implementation of a {@link IMessageHandler} using Google PubSub as the underlying transport.
 */
export class PubSubReceiver extends AbstractMessageHandler {
  /**
   * Constants
   */
  private static readonly CACHE_PREFIX = 'pubsub_subscription_';

  /**
   * Fields
   */
  private _cache: ICache;
  private _client: PubSub;
  private _subscriptions: Subscription[] = [];

  /**
   * Constructor
   *
   * @param topicPrefix Custom topic prefix, defaults to "ocpp"
   */
  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    module?: IModule,
    cache?: ICache,
  ) {
    super(config, logger, module);
    this._cache = cache || new MemoryCache();
    this._client = new PubSub({
      servicePath: this._config.util.messageBroker.pubsub?.servicePath,
    });
  }

  /**
   * The init method will create a subscription for each action in the {@link CallAction} array.
   *
   * @param actions All actions to subscribe to
   * @param stateFilter Optional filter for the subscription via {@link MessageState}, must be used to prevent looping of messages in Google PubSub
   * @returns
   */
  subscribe(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<boolean> {
    const topicName = `${this._config.util.messageBroker.pubsub?.topicPrefix}-${this._config.util.messageBroker.pubsub?.topicName}`;

    // Check if topic exists, if not create it
    return this._client
      .topic(topicName)
      .exists()
      .then(([exists]) => {
        if (exists) {
          return this._client.topic(topicName);
        } else {
          return this._client.createTopic(topicName).then(([newTopic]) => {
            this._logger.debug(`Topic ${newTopic.name} created.`);
            return newTopic;
          });
        }
      })
      .then((topic) =>
        this._subscribe(identifier, topic, actions, filter).then((name) => {
          // TODO: fix issue with multiple subscriptions overwriting cache values
          this._cache.set(
            `${PubSubReceiver.CACHE_PREFIX}${identifier}`,
            name,
            CacheNamespace.Other,
          );
          return name !== undefined;
        }),
      )
      .catch((error) => {
        this._logger.error(error);
        return false;
      });
  }

  unsubscribe(identifier: string): Promise<boolean> {
    return this._cache
      .get<string>(
        `${PubSubReceiver.CACHE_PREFIX}${identifier}`,
        CacheNamespace.Other,
      )
      .then((value) => {
        if (value) {
          return this._client
            .subscription(value)
            .detached()
            .then((detached) => {
              this._logger.debug(`Subscription ${value} ${detached}.`);
              if (!detached) {
                return this._client
                  .detachSubscription(value)
                  .then((data) => data !== undefined);
              }
              return true;
            });
        } else {
          return false;
        }
      });
  }

  /**
   * Shutdown the receiver by closing all subscriptions and deleting them.
   */
  shutdown() {
    this._subscriptions.forEach((subscription) => {
      subscription.close().then(() => {
        subscription.delete().then(() => {
          this._logger.debug(`Subscription ${subscription.name} deleted.`);
        });
      });
    });
  }

  /**
   * Underlying PubSub message handler.
   *
   * @param message The PubSubMessage to process
   */
  protected async _onMessage(message: PubSubMessage): Promise<void> {
    try {
      const parsed = plainToInstance(
        Message<OcppRequest | OcppResponse | OcppError>,
        <Message<OcppRequest | OcppResponse | OcppError>>(
          JSON.parse(message.data.toString())
        ),
      );
      await this.handle(parsed, message.id);
    } catch (error) {
      if (error instanceof RetryMessageError) {
        this._logger.warn('Retrying message: ', error.message);
        // Retryable error, usually ongoing call with station when trying to send new call
        message.nack();
        return;
      } else {
        this._logger.error('Error while processing message:', error, message);
      }
    }
    message.ack();
  }

  /**
   * Private Methods
   */

  /**
   *
   * @param action
   * @param stateFilter
   * @returns
   */
  private _subscribe(
    identifier: string,
    topic: Topic,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<string> {
    // Generate topic name
    const subscriptionName = `${topic.name.split('/').pop()}-${identifier}-${Date.now()}`;

    // Create message filter based on actions
    const actionFragments: string[] = [];
    const hasActionFilter: boolean =
      actions !== undefined && actions.length > 0;
    if (hasActionFilter) {
      for (const action of actions as CallAction[]) {
        // Convert into action index due to PubSub limits of 256 characters in filter string
        const index: number = Object.keys(CallAction).indexOf(
          action.toString(),
        );
        actionFragments.push(`attributes.action="${index}"`);
      }
    }

    // Create message filter
    const filterFragments: string[] = [];
    if (filter) {
      for (const key in filter) {
        if (Object.hasOwn(filter, key)) {
          filterFragments.push(`attributes.${key}="${filter[key]}"`);
        }
      }
    }

    const actionFilterString = `(${actionFragments.join(' OR ')})`;
    const otherFilterString = filterFragments.join(' AND ');
    const filterString = `${otherFilterString} ${hasActionFilter ? 'AND ' + actionFilterString : ''}`;

    this._logger.debug('Using filter:', filterString);

    // Create subscription with filter
    return topic
      .createSubscription(subscriptionName, {
        enableExactlyOnceDelivery: true,
        filter: filterString,
      })
      .then(([subscription]) => {
        this._logger.debug(`Subscription ${subscription.name} created.`);
        subscription.on('message', this._onMessage.bind(this));
        this._subscriptions.push(subscription);
        return subscription.name;
      });
  }
}
