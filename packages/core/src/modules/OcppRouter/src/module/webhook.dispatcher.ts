// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  BootstrapConfig,
  ICache,
  OCPPVersion,
  OCPPVersionType,
  SystemConfig,
} from '@citrineos/base';
import {
  AbstractModule,
  createIdentifier,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
  MessageOrigin,
  MessageState,
} from '@citrineos/base';
import type {
  IOCPPMessageRepository,
  ISubscriptionRepository,
} from '@dal/interfaces/repositories.js';
import { Subscription } from '@dal/layers/sequelize/model/Subscription/index.js';
import { OidcTokenProvider } from '@util/authorization/index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';

export class WebhookDispatcher {
  protected static readonly SUBSCRIPTION_REFRESH_INTERVAL_MS = 3 * 60 * 1000;

  protected _logger: Logger<ILogObj>;
  protected _ocppMessageRepository: IOCPPMessageRepository;
  protected _subscriptionRepository: ISubscriptionRepository;

  protected _cache: ICache;
  protected readonly _oidcTokenProvider?: OidcTokenProvider;
  protected _identifiers: Set<string> = new Set();

  // Structure of the maps: key = identifier, value = array of callbacks
  protected _onConnectionCallbacks: Map<string, OnConnectionCallback[]> = new Map();
  protected _onCloseCallbacks: Map<string, OnCloseCallback[]> = new Map();
  protected _onMessageCallbacks: Map<string, OnMessageCallback[]> = new Map();
  protected _sentMessageCallbacks: Map<string, OnSentMessageCallback[]> = new Map();

  constructor({
    ocppMessageRepository,
    subscriptionRepository,
    cache,
    logger,
    config,
  }: {
    ocppMessageRepository: IOCPPMessageRepository;
    subscriptionRepository: ISubscriptionRepository;
    cache: ICache;
    logger?: Logger<ILogObj>;
    config?: BootstrapConfig & SystemConfig;
  }) {
    this._ocppMessageRepository = ocppMessageRepository;
    this._subscriptionRepository = subscriptionRepository;
    this._cache = cache;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    if (config?.oidcClient) {
      this._oidcTokenProvider = new OidcTokenProvider(config.oidcClient, this._logger);
    }

    setInterval(async () => {
      await this._refreshSubscriptions();
    }, WebhookDispatcher.SUBSCRIPTION_REFRESH_INTERVAL_MS);
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

  async dispatchMessageReceivedUnparsed(
    tenantId: number,
    ocppConnectionName: string,
    message: string,
    timestamp: string,
    protocol: OCPPVersionType,
    action: string,
    state: MessageState,
  ) {
    const identifier = createIdentifier(tenantId, ocppConnectionName);
    try {
      // UUID generated so that unparsed messages don't end up referencing each other
      const messageId = uuidv4();

      const origin = MessageOrigin.ChargingStation;
      const info = new Map<string, string>([
        ['correlationId', messageId],
        ['origin', origin],
        ['timestamp', timestamp],
        ['protocol', protocol],
        ['action', action],
      ]);

      const messagePromise = this._ocppMessageRepository.createOCPPMessage(tenantId, {
        tenantId: tenantId,
        ocppConnectionName: ocppConnectionName,
        correlationId: messageId,
        origin: origin,
        state: state,
        protocol: protocol as OCPPVersion,
        action: action,
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
    tenantId: number,
    ocppConnectionName: string,
    timestamp: string,
    protocol: OCPPVersionType,
    action: string,
    state: MessageState,
    rpcMessage: any,
  ) {
    const identifier = createIdentifier(tenantId, ocppConnectionName);
    const messageId = rpcMessage[1];
    const origin = MessageOrigin.ChargingStation;

    const messageRecord = await this._ocppMessageRepository.createOCPPMessage(tenantId, {
      tenantId: tenantId,
      ocppConnectionName: ocppConnectionName,
      correlationId: messageId,
      origin: origin,
      state: state,
      action: action,
      protocol: protocol as OCPPVersion,
      message: rpcMessage,
      timestamp: timestamp,
    });

    if (action === undefined) {
      this._logger.debug(
        `Using action from stored message for correlationId ${messageId} and tenantId ${tenantId}: ${messageRecord.action}`,
      );
      action = messageRecord.action;
    }

    try {
      const info = new Map<string, string>([
        ['correlationId', messageId],
        ['origin', origin],
        ['timestamp', timestamp],
        ['protocol', protocol],
        ['action', action ? action : 'undefined'],
      ]);
      const rawMessage = JSON.stringify(rpcMessage);
      const promises: Promise<any>[] =
        this._onMessageCallbacks.get(identifier)?.map((callback) =>
          callback(rawMessage, info).catch((reason) => {
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
  }

  async dispatchMessageSent(
    identifier: string,
    action: string,
    state: MessageState,
    timestamp: string,
    protocol: OCPPVersionType,
    rpcMessage: any,
  ) {
    const tenantId = getTenantIdFromIdentifier(identifier);
    const ocppConnectionName = getStationIdFromIdentifier(identifier);

    const messageId = rpcMessage[1];
    const origin = MessageOrigin.ChargingStationManagementSystem;

    const messageRecordPromise = this._ocppMessageRepository.createOCPPMessage(tenantId, {
      tenantId: tenantId,
      ocppConnectionName: ocppConnectionName,
      correlationId: messageId,
      origin: origin,
      state: state,
      action: action,
      protocol: protocol as OCPPVersion,
      message: rpcMessage,
      timestamp: timestamp,
    });

    try {
      const info = new Map<string, string>([
        ['correlationId', messageId],
        ['origin', origin],
        ['timestamp', timestamp],
        ['protocol', protocol],
        ['action', action ? action : 'undefined'],
      ]);
      const rawMessage = JSON.stringify(rpcMessage);
      const promises: Promise<any>[] =
        this._sentMessageCallbacks.get(identifier)?.map((callback) =>
          callback(rawMessage, info).catch((reason) => {
            this._logger.error(
              `Failed to execute sentMessage callback for ${identifier} with messageId ${messageId}: ${reason}`,
            );
            return false;
          }),
        ) ?? [];

      await Promise.all([...promises, messageRecordPromise]);
    } catch (err) {
      this._logger.error(`Failed to dispatch message sent for ${identifier} : ${err}`);
    }
  }

  async dispatchCallbackUrl(
    correlationId: string,
    ocppConnectionName: string,
    payload: any,
  ): Promise<void> {
    const url: string | null = await this._cache.get(
      correlationId,
      AbstractModule.CALLBACK_URL_CACHE_PREFIX + ocppConnectionName,
    );
    if (!url) return;

    this._logger.debug(`Sending callback to ${url} for correlationId: ${correlationId}`);

    const headers: { [key: string]: string } = { 'Content-Type': 'application/json' };

    if (this._oidcTokenProvider) {
      try {
        const token = await this._oidcTokenProvider.getToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        this._logger.error('Failed to get OIDC token for callback:', error);
        return;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        this._logger.error(
          `Callback to ${url} failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
    } catch (error) {
      this._logger.error(`Callback to ${url} failed:`, error);
    }
  }

  protected async _refreshSubscriptions() {
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
   * @param ocppConnectionName - The connection name of the charging station
   * @return {Promise<void>} a promise that resolves once all subscriptions are loaded
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
        this._logger.debug(
          `Added onConnect callback to ${subscription.url} for station ${subscription.ocppConnectionName}`,
        );
      }
      if (subscription.onClose) {
        onCloseCallbacks.push(this._onCloseCallback(subscription));
        this._logger.debug(
          `Added onClose callback to ${subscription.url} for station ${subscription.ocppConnectionName}`,
        );
      }
      if (subscription.onMessage) {
        onMessageCallbacks.push(this._onMessageReceivedCallback(subscription));
        this._logger.debug(
          `Added onMessage callback to ${subscription.url} for station ${subscription.ocppConnectionName}`,
        );
      }
      if (subscription.sentMessage) {
        sentMessageCallbacks.push(this._onMessageSentCallback(subscription));
        this._logger.debug(
          `Added sentMessage callback to ${subscription.url} for station ${subscription.ocppConnectionName}`,
        );
      }
    }

    const connectionIdentifier = createIdentifier(tenantId, ocppConnectionName);
    this._onConnectionCallbacks.set(connectionIdentifier, onConnectionCallbacks);
    this._onCloseCallbacks.set(connectionIdentifier, onCloseCallbacks);
    this._onMessageCallbacks.set(connectionIdentifier, onMessageCallbacks);
    this._sentMessageCallbacks.set(connectionIdentifier, sentMessageCallbacks);
  }

  protected _onConnectionCallback(subscription: Subscription) {
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

  protected _onCloseCallback(subscription: Subscription) {
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

  protected _onMessageReceivedCallback(subscription: Subscription) {
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

  protected _onMessageSentCallback(subscription: Subscription) {
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
   *
   * @param {Object} requestBody - request body containing ocppConnectionName, event, origin, message, error, and info
   * @param {string} url - the URL to fetch data from
   * @return {Promise<boolean>} a Promise that resolves to a boolean indicating success
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
