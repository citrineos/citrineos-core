// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  createIdentifier,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
  mapToCallAction,
  MessageOrigin,
  MessageTypeId,
  OCPPVersionType,
} from '@citrineos/base';
import { ISubscriptionRepository, OCPPMessage, Subscription } from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';

export class WebhookDispatcher {
  private static readonly SUBSCRIPTION_REFRESH_INTERVAL_MS = 3 * 60 * 1000;

  private _logger: Logger<ILogObj>;
  private _subscriptionRepository: ISubscriptionRepository;

  private _identifiers: Set<string> = new Set();

  // Structure of the maps: key = identifier, value = array of callbacks
  private _onConnectionCallbacks: Map<string, OnConnectionCallback[]> = new Map();
  private _onCloseCallbacks: Map<string, OnCloseCallback[]> = new Map();
  private _onMessageCallbacks: Map<string, OnMessageCallback[]> = new Map();
  private _sentMessageCallbacks: Map<string, OnSentMessageCallback[]> = new Map();

  constructor(subscriptionRepository: ISubscriptionRepository, logger?: Logger<ILogObj>) {
    this._subscriptionRepository = subscriptionRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    setInterval(async () => {
      await this._refreshSubscriptions();
    }, WebhookDispatcher.SUBSCRIPTION_REFRESH_INTERVAL_MS);
  }

  async register(tenantId: number, stationId: string) {
    const identifier = createIdentifier(tenantId, stationId);
    try {
      await this._loadSubscriptionsForConnection(tenantId, stationId);
      await Promise.all(
        this._onConnectionCallbacks.get(identifier)?.map((callback) => callback()) ?? [],
      );
      this._identifiers.add(identifier);
    } catch (error) {
      this._logger.error(`Failed to register ${identifier}`, error);
    }
  }

  async deregister(tenantId: number, stationId: string) {
    const identifier = createIdentifier(tenantId, stationId);
    try {
      await Promise.all(
        this._onCloseCallbacks.get(identifier)?.map((callback) => callback()) ?? [],
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

  protected async _dispatchMessageReceivedUnparsed(
    tenantId: number,
    stationId: string,
    message: string,
    timestamp: string,
    protocol: OCPPVersionType,
  ) {
    const identifier = createIdentifier(tenantId, stationId);
    try {
      // UUID generated so that unparsed messages don't end up referencing each other
      const messageId = uuidv4();
      const callAction = 'unparsed';

      const origin = MessageOrigin.ChargingStation;
      const info = new Map<string, string>([
        ['correlationId', messageId],
        ['origin', origin],
        ['timestamp', timestamp],
        ['protocol', protocol],
        ['action', callAction],
      ]);

      const messagePromise = OCPPMessage.create({
        tenantId: tenantId,
        stationId: stationId,
        correlationId: messageId,
        origin: origin,
        protocol: protocol,
        action: null,
        message: message,
        timestamp: timestamp,
      });
      const promises: Promise<any>[] =
        this._onMessageCallbacks.get(identifier)?.map((callback) => callback(message, info)) ?? [];
      promises.push(messagePromise);
      await Promise.all(promises);
    } catch (error) {
      this._logger.error(`Failed to dispatch message received for ${identifier}`, error);
    }
  }

  async dispatchMessageReceived(
    identifier: string,
    message: string,
    timestamp: string,
    protocol: OCPPVersionType,
    rpcMessage?: any,
  ) {
    const tenantId = getTenantIdFromIdentifier(identifier);
    const stationId = getStationIdFromIdentifier(identifier);
    if (!rpcMessage) {
      // If rpcMessage is not provided, fallback to unparsed message handling
      return this._dispatchMessageReceivedUnparsed(
        tenantId,
        stationId,
        message,
        timestamp,
        protocol,
      );
    }
    const transaction = await OCPPMessage.sequelize!.transaction();
    try {
      const messageTypeId = rpcMessage[0];
      const messageId = rpcMessage[1];
      const origin = MessageOrigin.ChargingStation;

      const relatedMessage = await OCPPMessage.findOne({
        where: { tenantId: tenantId, stationId: stationId, correlationId: messageId },
        transaction,
      });
      let callAction = undefined;
      switch (messageTypeId) {
        case MessageTypeId.Call:
          try {
            callAction = mapToCallAction(protocol, rpcMessage[2]);
          } catch (error) {
            this._logger.warn(`Failed to map call action ${callAction} for ${messageId}`, error);
          }
          if (relatedMessage && !relatedMessage.action) {
            // Update the related message with the correct action if it was missing
            await relatedMessage.update({ action: callAction }, { transaction });
          }
          break;
        case MessageTypeId.CallResult:
        case MessageTypeId.CallError: {
          callAction = relatedMessage?.action;
          break;
        }
        default:
        // undefined
      }

      await OCPPMessage.create(
        {
          tenantId: tenantId,
          stationId: stationId,
          correlationId: messageId,
          origin: origin,
          protocol: protocol,
          action: callAction,
          message: rpcMessage,
          timestamp: timestamp,
        },
        { transaction },
      );
      await transaction.commit();

      try {
        const info = new Map<string, string>([
          ['correlationId', messageId],
          ['origin', origin],
          ['timestamp', timestamp],
          ['protocol', protocol],
          ['action', callAction ? callAction : 'undefined'],
        ]);

        const promises: Promise<any>[] =
          this._onMessageCallbacks.get(identifier)?.map((callback) =>
            callback(message, info).catch((reason) => {
              this._logger.error(
                `Failed to execute onMessage callback for ${identifier} with messageId ${messageId}: ${reason}`,
              );
              return false;
            }),
          ) ?? [];

        await Promise.all(promises);
      } catch (err) {
        this._logger.error(`Failed to dispatch message received for ${identifier} : ${err}`);
      }
    } catch (err) {
      this._logger.error(`Failed to save message received for ${identifier}`, err);
      await transaction.rollback();
    }
  }

  async dispatchMessageSent(
    identifier: string,
    message: string,
    timestamp: string,
    protocol: OCPPVersionType,
    rpcMessage: any,
  ) {
    const tenantId = getTenantIdFromIdentifier(identifier);
    const stationId = getStationIdFromIdentifier(identifier);
    const transaction = await OCPPMessage.sequelize!.transaction();
    try {
      const messageTypeId = rpcMessage[0];
      const messageId = rpcMessage[1];
      const origin = MessageOrigin.ChargingStationManagementSystem;

      const relatedMessage = await OCPPMessage.findOne({
        where: { tenantId: tenantId, stationId: stationId, correlationId: messageId },
        transaction,
      });
      let callAction = undefined;
      switch (messageTypeId) {
        case MessageTypeId.Call:
          try {
            callAction = mapToCallAction(protocol, rpcMessage[2]);
          } catch (error) {
            this._logger.warn(`Failed to map call action ${callAction} for ${messageId}`, error);
          }
          if (relatedMessage && !relatedMessage.action) {
            // Update the related message with the correct action if it was missing
            await relatedMessage.update({ action: callAction }, { transaction });
          }
          break;
        case MessageTypeId.CallResult:
        case MessageTypeId.CallError: {
          callAction = relatedMessage?.action;
          break;
        }
        default:
        // undefined
      }

      await OCPPMessage.create(
        {
          tenantId: tenantId,
          stationId: stationId,
          correlationId: messageId,
          origin: origin,
          protocol: protocol,
          action: callAction,
          message: rpcMessage,
          timestamp: timestamp,
        },
        { transaction },
      );
      await transaction.commit();

      try {
        const info = new Map<string, string>([
          ['correlationId', messageId],
          ['origin', origin],
          ['timestamp', timestamp],
          ['protocol', protocol],
          ['action', callAction ? callAction : 'undefined'],
        ]);
        const promises: Promise<any>[] =
          this._sentMessageCallbacks.get(identifier)?.map((callback) =>
            callback(message, info).catch((reason) => {
              this._logger.error(
                `Failed to execute sentMessage callback for ${identifier} with messageId ${messageId}: ${reason}`,
              );
              return false;
            }),
          ) ?? [];

        await Promise.all(promises);
      } catch (err) {
        this._logger.error(`Failed to dispatch message sent for ${identifier} : ${err}`);
      }
    } catch (err) {
      this._logger.error(`Failed to save message sent for ${identifier}`, err);
      await transaction.rollback();
    }
  }

  private async _refreshSubscriptions() {
    if (this._identifiers.size === 0) {
      return;
    }
    this._logger.debug(`Refreshing subscriptions for ${this._identifiers.size} identifiers`);
    this._identifiers.forEach((identifier) =>
      this._loadSubscriptionsForConnection(
        getTenantIdFromIdentifier(identifier),
        getStationIdFromIdentifier(identifier),
      ),
    );
  }

  /**
   * Loads all subscriptions for a given connection into memory
   *
   * @param {number} tenantId
   * @param {string} stationId
   * @return {Promise<void>} a promise that resolves once all subscriptions are loaded
   */
  private async _loadSubscriptionsForConnection(tenantId: number, stationId: string) {
    const onConnectionCallbacks: OnConnectionCallback[] = [];
    const onCloseCallbacks: OnCloseCallback[] = [];
    const onMessageCallbacks: OnMessageCallback[] = [];
    const sentMessageCallbacks: OnSentMessageCallback[] = [];

    const subscriptions = await this._subscriptionRepository.readAllByStationId(
      tenantId,
      stationId,
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

    const connectionIdentifier = createIdentifier(tenantId, stationId);
    this._onConnectionCallbacks.set(connectionIdentifier, onConnectionCallbacks);
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
          info: info ? Object.fromEntries(info) : info,
        },
        subscription.url,
      );
  }

  private _onCloseCallback(subscription: Subscription) {
    return (info?: Map<string, string>) =>
      this._subscriptionCallback(
        {
          stationId: subscription.stationId,
          event: 'closed',
          info: info ? Object.fromEntries(info) : info,
        },
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
            info: info ? Object.fromEntries(info) : info,
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
    return async (message: string, info?: Map<string, string>) => {
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
            info: info ? Object.fromEntries(info) : info,
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
      info?: { [k: string]: string };
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

export type OnConnectionCallback = (info?: Map<string, string>) => Promise<boolean>;

export type OnCloseCallback = (info?: Map<string, string>) => Promise<boolean>;

export type OnMessageCallback = (message: string, info?: Map<string, string>) => Promise<boolean>;

export type OnSentMessageCallback = (
  message: string,
  info?: Map<string, string>,
) => Promise<boolean>;
