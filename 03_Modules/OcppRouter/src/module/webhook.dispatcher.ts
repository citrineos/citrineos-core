// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { MessageOrigin } from '@citrineos/base';
import { ISubscriptionRepository, Subscription } from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';

export class WebhookDispatcher {
  private static readonly SUBSCRIPTION_REFRESH_INTERVAL_MS = 3 * 60 * 1000;

  private _logger: Logger<ILogObj>;
  private _subscriptionRepository: ISubscriptionRepository;

  private _identifiers: Set<string> = new Set();

  // Structure of the maps: key = identifier, value = array of callbacks
  private _onConnectionCallbacks: Map<string, OnConnectionCallback[]> =
    new Map();
  private _onCloseCallbacks: Map<string, OnCloseCallback[]> = new Map();
  private _onMessageCallbacks: Map<string, OnMessageCallback[]> = new Map();
  private _sentMessageCallbacks: Map<string, OnSentMessageCallback[]> =
    new Map();

  constructor(
    subscriptionRepository: ISubscriptionRepository,
    logger?: Logger<ILogObj>,
  ) {
    this._subscriptionRepository = subscriptionRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    setInterval(async () => {
      await this._refreshSubscriptions();
    }, WebhookDispatcher.SUBSCRIPTION_REFRESH_INTERVAL_MS);
  }

  async register(identifier: string) {
    try {
      await this._loadSubscriptionsForConnection(identifier);
      await Promise.all(
        this._onConnectionCallbacks
          .get(identifier)
          ?.map((callback) => callback()) ?? [],
      );
      this._identifiers.add(identifier);
    } catch (error) {
      this._logger.error(`Failed to register ${identifier}`, error);
    }
  }

  async deregister(identifier: string) {
    try {
      await Promise.all(
        this._onCloseCallbacks.get(identifier)?.map((callback) => callback()) ??
          [],
      );
      this._identifiers.delete(identifier);
      this._onConnectionCallbacks.delete(identifier);
      this._onCloseCallbacks.delete(identifier);
      this._onMessageCallbacks.delete(identifier);
      this._sentMessageCallbacks.delete(identifier);
    } catch (error) {
      this._logger.error(`Failed to deregister ${identifier}`, error);
    }
  }

  async dispatchMessageReceived(
    identifier: string,
    message: string,
    info?: Map<string, string>,
  ) {
    try {
      await Promise.all(
        this._onMessageCallbacks
          .get(identifier)
          ?.map((callback) => callback(message, info)) ?? [],
      );
    } catch (error) {
      this._logger.error(
        `Failed to dispatch message received for ${identifier}`,
        error,
      );
    }
  }

  async dispatchMessageSent(
    identifier: string,
    message: string,
    error?: any,
    info?: Map<string, string>,
  ) {
    try {
      await Promise.all(
        this._sentMessageCallbacks
          .get(identifier)
          ?.map((callback) => callback(message, error, info)) ?? [],
      );
    } catch (err) {
      this._logger.error(
        `Failed to dispatch message sent for ${identifier}`,
        err,
      );
    }
  }

  private async _refreshSubscriptions() {
    if (this._identifiers.size === 0) {
      return;
    }
    this._logger.debug(
      `Refreshing subscriptions for ${this._identifiers.size} identifiers`,
    );
    this._identifiers.forEach((identifier) =>
      this._loadSubscriptionsForConnection(identifier),
    );
  }

  /**
   * Loads all subscriptions for a given connection into memory
   *
   * @param {string} connectionIdentifier - the identifier of the connection
   * @return {Promise<void>} a promise that resolves once all subscriptions are loaded
   */
  private async _loadSubscriptionsForConnection(connectionIdentifier: string) {
    const onConnectionCallbacks: OnConnectionCallback[] = [];
    const onCloseCallbacks: OnCloseCallback[] = [];
    const onMessageCallbacks: OnMessageCallback[] = [];
    const sentMessageCallbacks: OnSentMessageCallback[] = [];

    const subscriptions =
      await this._subscriptionRepository.readAllByStationId(
        connectionIdentifier,
      );

    for (const subscription of subscriptions) {
      if (subscription.onConnect) {
        onConnectionCallbacks.push(this._onConnectionCallback(subscription));
        this._logger.debug(
          `Added onConnect callback to ${subscription.url} for station ${subscription.stationId}`,
        );
      }
      if (subscription.onClose) {
        onCloseCallbacks.push(this._onCloseCallback(subscription));
        this._logger.debug(
          `Added onClose callback to ${subscription.url} for station ${subscription.stationId}`,
        );
      }
      if (subscription.onMessage) {
        onMessageCallbacks.push(this._onMessageReceivedCallback(subscription));
        this._logger.debug(
          `Added onMessage callback to ${subscription.url} for station ${subscription.stationId}`,
        );
      }
      if (subscription.sentMessage) {
        sentMessageCallbacks.push(this._onMessageSentCallback(subscription));
        this._logger.debug(
          `Added sentMessage callback to ${subscription.url} for station ${subscription.stationId}`,
        );
      }
    }

    this._onConnectionCallbacks.set(
      connectionIdentifier,
      onConnectionCallbacks,
    );
    this._onCloseCallbacks.set(connectionIdentifier, onCloseCallbacks);
    this._onMessageCallbacks.set(connectionIdentifier, onMessageCallbacks);
    this._sentMessageCallbacks.set(connectionIdentifier, sentMessageCallbacks);
  }

  private _onConnectionCallback(subscription: Subscription) {
    return (info?: Map<string, string>) =>
      this._subscriptionCallback(
        {
          stationId: subscription.stationId,
          event: 'connected',
          info: info,
        },
        subscription.url,
      );
  }

  private _onCloseCallback(subscription: Subscription) {
    return (info?: Map<string, string>) =>
      this._subscriptionCallback(
        { stationId: subscription.stationId, event: 'closed', info: info },
        subscription.url,
      );
  }

  private _onMessageReceivedCallback(subscription: Subscription) {
    return async (message: string, info?: Map<string, string>) => {
      if (
        !subscription.messageRegexFilter ||
        new RegExp(subscription.messageRegexFilter).test(message)
      ) {
        return this._subscriptionCallback(
          {
            stationId: subscription.stationId,
            event: 'message',
            origin: MessageOrigin.ChargingStation,
            message: message,
            info: info,
          },
          subscription.url,
        );
      } else {
        // Ignore
        return true;
      }
    };
  }

  private _onMessageSentCallback(subscription: Subscription) {
    return async (message: string, error?: any, info?: Map<string, string>) => {
      if (
        !subscription.messageRegexFilter ||
        new RegExp(subscription.messageRegexFilter).test(message)
      ) {
        return this._subscriptionCallback(
          {
            stationId: subscription.stationId,
            event: 'message',
            origin: MessageOrigin.ChargingStationManagementSystem,
            message: message,
            error: error,
            info: info,
          },
          subscription.url,
        );
      } else {
        // Ignore
        return true;
      }
    };
  }

  /**
   * Sends a message to a given URL that has been subscribed to a station connection event
   *
   * @param {Object} requestBody - request body containing stationId, event, origin, message, error, and info
   * @param {string} url - the URL to fetch data from
   * @return {Promise<boolean>} a Promise that resolves to a boolean indicating success
   */
  private async _subscriptionCallback(
    requestBody: {
      stationId: string;
      event: string;
      origin?: MessageOrigin;
      message?: string;
      error?: any;
      info?: Map<string, string>;
    },
    url: string,
  ): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this._logger.error(
          `Route to subscription ${url} on charging station ${requestBody.stationId} failed.
            Event: ${requestBody.event}, ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
      return response.ok;
    } catch (error) {
      this._logger.error(
        `Route to subscription ${url} on charging station ${requestBody.stationId} failed.
           Event: ${requestBody.event}, ${error}`,
      );
      return false;
    }
  }
}

export type OnConnectionCallback = (
  info?: Map<string, string>,
) => Promise<boolean>;

export type OnCloseCallback = (info?: Map<string, string>) => Promise<boolean>;

export type OnMessageCallback = (
  message: string,
  info?: Map<string, string>,
) => Promise<boolean>;

export type OnSentMessageCallback = (
  message: string,
  error?: any,
  info?: Map<string, string>,
) => Promise<boolean>;
