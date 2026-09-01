// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  createIdentifier,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
  type ICache,
} from '@citrineos/base';
import {
  FrameDirection,
  type FrameEvent,
  MessageOrigin,
  type SubscriptionDto,
  type SystemConfig,
} from '@citrineos/types';
import type {
  IOCPPMessageRepository,
  ISubscriptionRepository,
} from '@dal/interfaces/repositories.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class WebhookDispatcher {
  protected static readonly SUBSCRIPTION_REFRESH_INTERVAL_MS = 3 * 60 * 1000;

  protected _logger: Logger<ILogObj>;
  protected _subscriptionRepository: ISubscriptionRepository;
  protected _identifiers: Set<string> = new Set();

  // Structure of the maps: key = identifier, value = array of callbacks
  protected _onConnectionCallbacks: Map<string, OnConnectionCallback[]> = new Map();
  protected _onCloseCallbacks: Map<string, OnCloseCallback[]> = new Map();
  protected _onMessageCallbacks: Map<string, OnMessageCallback[]> = new Map();
  protected _sentMessageCallbacks: Map<string, OnSentMessageCallback[]> = new Map();

  private _refreshTimer?: ReturnType<typeof setInterval>;

  constructor({
    subscriptionRepository,
    logger,
  }: {
    ocppMessageRepository: IOCPPMessageRepository;
    subscriptionRepository: ISubscriptionRepository;
    cache: ICache;
    logger?: Logger<ILogObj>;
    config?: SystemConfig;
  }) {
    this._subscriptionRepository = subscriptionRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._refreshTimer = setInterval(async () => {
      await this._refreshSubscriptions();
    }, WebhookDispatcher.SUBSCRIPTION_REFRESH_INTERVAL_MS);
    this._refreshTimer.unref?.();
  }

  shutdown(): void {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
  }

  async register(tenantId: number, ocppConnectionName: string) {
    const identifier = createIdentifier(tenantId, ocppConnectionName);
    try {
      await this._loadSubscriptionsForConnection(tenantId, ocppConnectionName);
      await Promise.all(
        this._onConnectionCallbacks.get(identifier)?.map((callback) => callback()) ?? [],
      );
      this._identifiers.add(identifier);
    } catch (error) {
      this._logger.error(`Failed to register ${identifier}`, error);
    }
  }

  async deregister(tenantId: number, ocppConnectionName: string) {
    const identifier = createIdentifier(tenantId, ocppConnectionName);
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

  async dispatchFrame(event: FrameEvent, resolvedAction?: string): Promise<void> {
    const identifier = createIdentifier(event.tenantId, event.ocppConnectionName);

    // The connect event may not have been processed yet — it travels a different queue. Load this
    // station's subscriptions now rather than dropping the frame's webhook on a race.
    if (!this._identifiers.has(identifier)) {
      await this._loadSubscriptionsForConnection(event.tenantId, event.ocppConnectionName);
      this._identifiers.add(identifier);
    }

    const inbound = event.direction === FrameDirection.Inbound;
    const callbacks = inbound
      ? this._onMessageCallbacks.get(identifier)
      : this._sentMessageCallbacks.get(identifier);

    if (!callbacks?.length) return;

    const info = new Map<string, string>([
      ['correlationId', event.correlationId],
      ['origin', event.origin],
      ['timestamp', event.timestamp],
      ['protocol', event.protocol],
    ]);
    const action = event.action ?? resolvedAction;
    if (action) info.set('action', action);
    if (event.type !== undefined) info.set('type', event.type.toString());

    await Promise.all(
      callbacks.map((callback) =>
        callback(event.raw, info).catch((reason) => {
          this._logger.error(
            `Failed to execute ${inbound ? 'onMessage' : 'sentMessage'} callback for ${identifier} ` +
              `with correlationId ${event.correlationId}: ${reason}`,
          );
          return false;
        }),
      ),
    );
  }

  protected async _refreshSubscriptions() {
    if (this._identifiers.size === 0) {
      return;
    }
    this._logger.debug(`Refreshing subscriptions for ${this._identifiers.size} identifiers`);
    for (const identifier of this._identifiers) {
      await this._loadSubscriptionsForConnection(
        getTenantIdFromIdentifier(identifier),
        getStationIdFromIdentifier(identifier),
      ).catch((error) =>
        this._logger.error(`Failed to refresh subscriptions for ${identifier}`, error),
      );
    }
  }

  /**
   * Loads all subscriptions for a given connection into memory
   */
  protected async _loadSubscriptionsForConnection(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<void> {
    const onConnectionCallbacks: OnConnectionCallback[] = [];
    const onCloseCallbacks: OnCloseCallback[] = [];
    const onMessageCallbacks: OnMessageCallback[] = [];
    const sentMessageCallbacks: OnSentMessageCallback[] = [];

    const subscriptions = await this._subscriptionRepository.readAllByStationId(
      tenantId,
      ocppConnectionName,
    );

    for (const subscription of subscriptions) {
      if (subscription.onConnect) {
        onConnectionCallbacks.push(this._onConnectionCallback(subscription));
      }
      if (subscription.onClose) {
        onCloseCallbacks.push(this._onCloseCallback(subscription));
      }
      if (subscription.onMessage) {
        onMessageCallbacks.push(this._onMessageReceivedCallback(subscription));
      }
      if (subscription.sentMessage) {
        sentMessageCallbacks.push(this._onMessageSentCallback(subscription));
      }
    }

    const connectionIdentifier = createIdentifier(tenantId, ocppConnectionName);
    this._onConnectionCallbacks.set(connectionIdentifier, onConnectionCallbacks);
    this._onCloseCallbacks.set(connectionIdentifier, onCloseCallbacks);
    this._onMessageCallbacks.set(connectionIdentifier, onMessageCallbacks);
    this._sentMessageCallbacks.set(connectionIdentifier, sentMessageCallbacks);

    this._logger.debug(
      `Loaded ${subscriptions.length} subscription(s) for ${connectionIdentifier}`,
    );
  }

  protected _onConnectionCallback(subscription: SubscriptionDto) {
    return (info?: Map<string, string>) =>
      this._subscriptionCallback(
        {
          ocppConnectionName: subscription.ocppConnectionName,
          event: 'connected',
          info: info ? Object.fromEntries(info) : info,
        },
        subscription.url,
      );
  }

  protected _onCloseCallback(subscription: SubscriptionDto) {
    return (info?: Map<string, string>) =>
      this._subscriptionCallback(
        {
          ocppConnectionName: subscription.ocppConnectionName,
          event: 'closed',
          info: info ? Object.fromEntries(info) : info,
        },
        subscription.url,
      );
  }

  protected _onMessageReceivedCallback(subscription: SubscriptionDto) {
    return async (message: string, info?: Map<string, string>) => {
      if (
        !subscription.messageRegexFilter ||
        new RegExp(subscription.messageRegexFilter).test(message)
      ) {
        return this._subscriptionCallback(
          {
            ocppConnectionName: subscription.ocppConnectionName,
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

  protected _onMessageSentCallback(subscription: SubscriptionDto) {
    return async (message: string, info?: Map<string, string>) => {
      if (
        !subscription.messageRegexFilter ||
        new RegExp(subscription.messageRegexFilter).test(message)
      ) {
        return this._subscriptionCallback(
          {
            ocppConnectionName: subscription.ocppConnectionName,
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
   */
  protected async _subscriptionCallback(
    requestBody: {
      ocppConnectionName: string;
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
          `Route to subscription ${url} on charging station ${requestBody.ocppConnectionName} failed.
            Event: ${requestBody.event}, ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
      return response.ok;
    } catch (error) {
      this._logger.error(
        `Route to subscription ${url} on charging station ${requestBody.ocppConnectionName} failed.
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

export default WebhookDispatcher;
