/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */


import {
  PubSub,
  Message as PubSubMessage,
  Subscription,
  Topic,
} from "@google-cloud/pubsub";
import { ILogObj, Logger } from "tslog";
import { MemoryCache } from "../../cache/memory";
import { AbstractMessageHandler, ICache, IModule, SystemConfig, CallAction, CacheNamespace, IMessage, OcppRequest, OcppResponse, HandlerProperties, Message, OcppError } from "@citrineos/base";
import { plainToInstance } from "class-transformer";

/**
 * Implementation of a {@link IMessageHandler} using Google PubSub as the underlying transport.
 */
export class PubSubReceiver extends AbstractMessageHandler {
  /**
   * Constants
   */
  private static readonly CACHE_PREFIX = "pubsub_subscription_";

  /**
   * Fields
   */
  private _cache: ICache;
  private _client: PubSub;
  private _module?: IModule;
  private _subscriptions: Subscription[] = [];

  /**
   * Constructor
   *
   * @param topicPrefix Custom topic prefix, defaults to "ocpp"
   */
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, cache?: ICache, module?: IModule) {
    super(config, logger);
    this._cache = cache || new MemoryCache();
    this._client = new PubSub({ servicePath: this._config.util.messageBroker.pubsub?.servicePath });
    this._module = module;
  }

  /**
     * The init method will create a subscription for each action in the {@link CallAction} array.
     *
     * @param actions All actions to subscribe to
     * @param stateFilter Optional filter for the subscription via {@link MessageState}, must be used to prevent looping of messages in Google PubSub
     * @returns
     */
  subscribe(identifier: string, actions?: CallAction[], filter?: { [k: string]: string }): Promise<boolean> {

    const topicName = `${this._config.util.messageBroker.pubsub?.topicPrefix}-${this._config.util.messageBroker.pubsub?.topicName}`;

    // Check if topic exists, if not create it
    return this._client.topic(topicName).exists().then(([exists]) => {
      if (exists) {
        return this._client.topic(topicName);
      } else {
        return this._client.createTopic(topicName).then(([newTopic]) => {
          this._logger.debug(`Topic ${newTopic.name} created.`);
          return newTopic;
        });
      }
    }).then(topic => {
      return this._subscribe(identifier, topic, actions, filter).then(name => {
        // TODO: fix issue with multiple subscriptions overwriting cache values
        this._cache.set(`${PubSubReceiver.CACHE_PREFIX}${identifier}`, name, CacheNamespace.Other);
        return name !== undefined;
      });
    }).catch((error) => { this._logger.error(error); return false; });
  }

  unsubscribe(identifier: string): Promise<boolean> {
    return this._cache.get<string>(`${PubSubReceiver.CACHE_PREFIX}${identifier}`, CacheNamespace.Other).then(value => {
      if (value) {
        return this._client.subscription(value).detached().then((detached) => {
          this._logger.debug(`Subscription ${value} ${detached}.`);
          if (!detached) {
            return this._client.detachSubscription(value).then(data => data !== undefined);
          }
          return true;
        });
      }
      else {
        return false;
      }
    });
  }

  /**
   * Method to handle incoming messages. Forwarding to OCPP module.
   *
   * @param message The incoming {@link IMessage}
   * @param context The context of the incoming message, in this implementation it's the PubSub message id
   */
  handle(message: IMessage<OcppRequest | OcppResponse | OcppError>, props?: HandlerProperties): void {
    this._module?.handle(message, props);
  }

  /**
   * Shutdown the receiver by closing all subscriptions and deleting them.
   */
  shutdown() {
    this._subscriptions.forEach((subscription) => {
      subscription.close().then(() => {
        subscription.delete().then(() => {
          this._logger.debug(
            `Subscription ${subscription.name} deleted.`
          );
        });
      });
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
    filter?: { [k: string]: string }
  ): Promise<string> {
    // Generate topic name
    const subscriptionName = `${topic.name.split("/").pop()}-${identifier}-${Date.now()}`;

    // Create message filter based on actions
    const actionFragments: string[] = [];
    const hasActionFilter: boolean = actions !== undefined && actions.length > 0;
    if (hasActionFilter) {
      for (const _action of actions!) {
        // Convert into action index due to PubSub limits of 256 characters in filter string
        const index: number = Object.keys(CallAction).indexOf(_action.toString());
        actionFragments.push(`attributes.action="${index}"`);
      }
    }

    // Create message filter
    const filterFragments: string[] = [];
    if (filter) {
      for (const _key in filter) {
        filterFragments.push(`attributes.${_key}="${filter[_key]}"`);
      }
    }

    const actionFilterString = `(${actionFragments.join(" OR ")})`;
    const otherFilterString = filterFragments.join(" AND ");
    const filterString = `${otherFilterString} ${hasActionFilter ? ("AND " + actionFilterString) : ""}`;

    this._logger.debug("Using filter:", filterString);

    // Create subscription with filter
    return topic
      .createSubscription(subscriptionName, { enableExactlyOnceDelivery: true, filter: filterString })
      .then(([subscription]) => {
        this._logger.debug(`Subscription ${subscription.name} created.`);
        subscription.on("message", this._onMessage.bind(this));
        this._subscriptions.push(subscription);
        return subscription.name;
      });
  }

  /**
   * Underlying PubSub message handler.
   *
   * @param message The PubSubMessage to process
   */
  private _onMessage(message: PubSubMessage): void {
    try {
      const parsed = plainToInstance(Message<OcppRequest | OcppResponse | OcppError>, <Message<OcppRequest | OcppResponse | OcppError>>JSON.parse(message.data.toString()));
      this.handle(parsed, message.id);
    } catch (error) {
      this._logger.error("Error while processing message:", error);
    } finally {
      // TODO: Ensure message is processed without errors before acking if implementing retry
      message.ack();
    }
  }
}
