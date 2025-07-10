// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
/* eslint-disable */

import {
  AbstractMessageRouter,
  AbstractModule,
  Ajv,
  BOOT_STATUS,
  BootstrapConfig,
  CacheNamespace,
  Call,
  CallAction,
  CallError,
  CallResult,
  ErrorCode,
  EventGroup,
  ICache,
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageRouter,
  IMessageSender,
  mapToCallAction,
  MessageOrigin,
  MessageState,
  MessageTypeId,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OcppError,
  OcppRequest,
  OcppResponse,
  OCPPVersion,
  OCPPVersionType,
  RequestBuilder,
  RetryMessageError,
  SystemConfig,
} from '@citrineos/base';
import { v4 as uuidv4 } from 'uuid';
import { ILogObj, Logger } from 'tslog';
import { ILocationRepository, ISubscriptionRepository, sequelize } from '@citrineos/data';
import { WebhookDispatcher } from './webhook.dispatcher';
import {
  createIdentifier,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
} from '@citrineos/base';

/**
 * Implementation of the ocpp router
 */
export class MessageRouterImpl extends AbstractMessageRouter implements IMessageRouter {
  /**
   * Fields
   */

  private _webhookDispatcher: WebhookDispatcher;
  protected _cache: ICache;
  protected _sender: IMessageSender;
  protected _handler: IMessageHandler;
  protected _networkHook: (identifier: string, message: string) => Promise<void>;
  protected _locationRepository: ILocationRepository;
  public subscriptionRepository: ISubscriptionRepository;

  /**
   * Constructor for the class.
   *
   * @param {BootstrapConfig & SystemConfig} config - the system configuration
   * @param {ICache} cache - the cache object
   * @param {IMessageSender} [sender] - the message sender
   * @param {IMessageHandler} [handler] - the message handler
   * @param {WebhookDispatcher} [dispatcher] - the webhook dispatcher
   * @param {Function} networkHook - the network hook needed to send messages to chargers
   * @param {ILocationRepository} [locationRepository] - An optional parameter of type {@link ILocationRepository} which
   * represents a repository for accessing and manipulating variable data.
   * If no `locationRepository` is provided, a default {@link sequelize.LocationRepository} instance is created and used.
   *
   * @param {ISubscriptionRepository} [subscriptionRepository] - the subscription repository
   * @param {Logger<ILogObj>} [logger] - the logger object (optional)
   * @param {Ajv} [ajv] - the Ajv object, for message validation (optional)
   */
  constructor(
    config: BootstrapConfig & SystemConfig,
    cache: ICache,
    sender: IMessageSender,
    handler: IMessageHandler,
    dispatcher: WebhookDispatcher,
    networkHook: (identifier: string, message: string) => Promise<void>,
    logger?: Logger<ILogObj>,
    ajv?: Ajv,
    locationRepository?: ILocationRepository,
    subscriptionRepository?: ISubscriptionRepository,
  ) {
    super(config, cache, handler, sender, networkHook, logger, ajv);

    this._cache = cache;
    this._sender = sender;
    this._handler = handler;
    this._webhookDispatcher = dispatcher;
    this._networkHook = networkHook;
    this._locationRepository =
      locationRepository || new sequelize.SequelizeLocationRepository(config, logger);
    this.subscriptionRepository =
      subscriptionRepository || new sequelize.SequelizeSubscriptionRepository(config, this._logger);
    this._handler.initConnection();
  }

  // TODO: Below method should lock these tables so that a rapid connect-disconnect cannot result in race condition.
  async registerConnection(
    tenantId: number,
    stationId: string,
    protocol: OCPPVersion,
  ): Promise<boolean> {
    const dispatcherRegistration = this._webhookDispatcher.register(tenantId, stationId);

    const connectionIdentifier = createIdentifier(tenantId, stationId);
    const requestSubscription = this._handler.subscribe(connectionIdentifier, undefined, {
      tenantId: tenantId.toString(),
      stationId,
      state: MessageState.Request.toString(),
      origin: MessageOrigin.ChargingStationManagementSystem.toString(),
    });

    const responseSubscription = this._handler.subscribe(connectionIdentifier, undefined, {
      tenantId: tenantId.toString(),
      stationId,
      state: MessageState.Response.toString(),
      origin: MessageOrigin.ChargingStationManagementSystem.toString(),
    });

    const onlineCharger = this._locationRepository.setChargingStationIsOnlineAndOCPPVersion(
      tenantId,
      stationId,
      true,
      protocol,
    );

    return Promise.all([
      dispatcherRegistration,
      requestSubscription,
      responseSubscription,
      onlineCharger,
    ])
      .then((resolvedArray) => resolvedArray[1] && resolvedArray[2])
      .catch((error) => {
        this._logger.error(`Error registering connection for ${connectionIdentifier}: ${error}`);
        return false;
      });
  }

  async deregisterConnection(tenantId: number, stationId: string): Promise<boolean> {
    this._webhookDispatcher.deregister(tenantId, stationId);

    const offlineCharger = await this._locationRepository.setChargingStationIsOnlineAndOCPPVersion(
      tenantId,
      stationId,
      false,
      null,
    );

    const connectionIdentifier = createIdentifier(tenantId, stationId);
    // TODO: ensure that all queue implementations in 02_Util only unsubscribe 1 queue per call
    // ...which will require refactoring this method to unsubscribe request and response queues separately
    return await this._handler.unsubscribe(connectionIdentifier);
  }

  async onMessage(
    identifier: string,
    message: string,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<boolean> {
    let success = true;
    let rpcMessage: any;
    let messageTypeId: MessageTypeId | undefined = undefined;
    let messageId: string = '-1'; // OCPP 2.0.1 part 4, section 4.2.3, "When also the MessageId cannot be read, the CALLERROR SHALL contain "-1" as MessageId."
    try {
      try {
        rpcMessage = JSON.parse(message);
      } catch (error) {
        this._logger.error(
          `Error parsing ${message} from websocket, unable to reply: ${JSON.stringify(error)}`,
        );
        throw error;
      }
      messageTypeId = rpcMessage[0];
      messageId = rpcMessage[1];
      switch (messageTypeId) {
        case MessageTypeId.Call:
          await this._onCall(identifier, rpcMessage as Call, timestamp, protocol);
          break;
        case MessageTypeId.CallResult:
          await this._onCallResult(identifier, rpcMessage as CallResult, timestamp, protocol);
          break;
        case MessageTypeId.CallError:
          await this._onCallError(identifier, rpcMessage as CallError, timestamp, protocol);
          break;
        default:
          let errorCode;
          switch (protocol) {
            case 'ocpp1.6':
              errorCode = ErrorCode.FormationViolation;
              break;
            case 'ocpp2.0.1':
              errorCode = ErrorCode.FormatViolation;
              break;
            default:
              throw new Error('Unknown protocol: ' + protocol);
          }
          throw new OcppError(
            messageId,
            errorCode,
            'Unknown message type id: ' + messageTypeId,
            {},
          );
      }
    } catch (error) {
      success = false; // ensure we return false in case of an error
      this._logger.error('Error processing message:', message, error);
      if (messageTypeId != MessageTypeId.CallResult && messageTypeId != MessageTypeId.CallError) {
        let callError =
          error instanceof OcppError
            ? error.asCallError()
            : [
                MessageTypeId.CallError,
                messageId,
                ErrorCode.InternalError,
                'Unable to process message',
                { error: error },
              ];
        callError = this.removeNulls(callError);
        const rawMessage = JSON.stringify(callError);
        this._sendMessage(identifier, protocol, rawMessage, callError);
      }
    }
    await this._webhookDispatcher.dispatchMessageReceived(
      identifier,
      message,
      timestamp.toISOString(),
      protocol,
      rpcMessage,
    );
    return success;
  }

  /**
   * Sends a Call message to a charging station with given identifier.
   *
   * @param {string} stationId - The identifier of the station.
   * @param {number} tenantId - The identifier of the tenant.
   * @param {OCPPVersionType} protocol The OCPP protocol version of the message.
   * @param {CallAction} action - The action to be called.
   * @param {OcppRequest} payload - The payload of the call.
   * @param {string} correlationId - The correlation ID of the message.
   * @param {MessageOrigin} _origin - The origin of the message.
   * @return {Promise<boolean>} A promise that resolves to a boolean indicating if the call was sent successfully.
   */
  async sendCall(
    stationId: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppRequest,
    correlationId = uuidv4(),
    _origin?: MessageOrigin,
  ): Promise<IMessageConfirmation> {
    const identifier = createIdentifier(tenantId, stationId);

    let message: Call = [MessageTypeId.Call, correlationId, action, payload];
    if (await this._sendCallIsAllowed(identifier, protocol, message)) {
      if (
        await this._cache.setIfNotExist(
          identifier,
          `${action}:${correlationId}`,
          CacheNamespace.Transactions,
          this._config.maxCallLengthSeconds,
        )
      ) {
        message = this.removeNulls(message);
        const rawMessage = JSON.stringify(message);
        const success = await this._sendMessage(identifier, protocol, rawMessage, message);
        return { success };
      } else {
        this._logger.info(
          'Call already in progress, throwing retry exception',
          identifier,
          message,
        );
        throw new RetryMessageError('Call already in progress');
      }
    } else {
      this._logger.info('RegistrationStatus Rejected, unable to send', identifier, message);
      return { success: false };
    }
  }

  /**
   * Sends the CallResult to a charging station with given identifier.
   *
   * @param {string} correlationId - The correlation ID of the message.
   * @param {string} stationId - The identifier of the charging station.
   * @param {number} tenantId - The identifier of the tenant.
   * @param {OCPPVersionType} protocol The OCPP protocol version of the message.
   * @param {CallAction} action - The action to be called.
   * @param {OcppRequest} payload - The payload of the call.
   * @param {MessageOrigin} _origin - The origin of the message.
   * @return {Promise<boolean>} A promise that resolves to true if the call result was sent successfully, or false otherwise.
   */
  async sendCallResult(
    correlationId: string,
    stationId: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppResponse,
    _origin?: MessageOrigin,
  ): Promise<IMessageConfirmation> {
    let message: CallResult = [MessageTypeId.CallResult, correlationId, payload];
    const identifier = createIdentifier(tenantId, stationId);

    const cachedActionMessageId = await this._cache.get<string>(
      identifier,
      CacheNamespace.Transactions,
    );
    if (!cachedActionMessageId) {
      this._logger.error(
        'Failed to send callResult due to missing message id',
        identifier,
        message,
      );
      return { success: false };
    }
    let [cachedAction, cachedMessageId] = cachedActionMessageId?.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
    if (cachedAction === action && cachedMessageId === correlationId) {
      message = this.removeNulls(message);
      const rawMessage = JSON.stringify(message);
      const success = await Promise.all([
        this._sendMessage(identifier, protocol, rawMessage, message),
        this._cache.remove(identifier, CacheNamespace.Transactions),
      ]).then((successes) => successes.every(Boolean));
      return { success };
    } else {
      this._logger.error(
        'Failed to send callResult due to mismatch in message id',
        identifier,
        cachedActionMessageId,
        message,
      );
      return { success: false };
    }
  }

  /**
   * Sends a CallError message to a charging station with given identifier.
   *
   * @param {string} correlationId - The correlation ID of the message.
   * @param {string} stationId - The identifier of the charging station.
   * @param {number} tenantId - The identifier of the tenant.
   * @param {OCPPVersionType} protocol The OCPP protocol version of the message.
   * @param {CallAction} _action - The action to be called.
   * @param {OcppError} error - The error of the call.
   * @param {MessageOrigin} _origin - The origin of the message.
   * @return {Promise<boolean>} - A promise that resolves to true if the message was sent successfully.
   */
  async sendCallError(
    correlationId: string,
    stationId: string,
    tenantId: number,
    protocol: OCPPVersionType,
    _action: CallAction,
    error: OcppError,
    _origin?: MessageOrigin | undefined,
  ): Promise<IMessageConfirmation> {
    let message: CallError = error.asCallError();
    const identifier = createIdentifier(tenantId, stationId);

    const cachedActionMessageId = await this._cache.get<string>(
      identifier,
      CacheNamespace.Transactions,
    );
    if (!cachedActionMessageId) {
      this._logger.error('Failed to send callError due to missing message id', identifier, message);
      return { success: false };
    }
    let [cachedAction, cachedMessageId] = cachedActionMessageId?.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
    if (cachedMessageId === correlationId) {
      message = this.removeNulls(message);
      const rawMessage = JSON.stringify(message);
      const success = await Promise.all([
        this._sendMessage(identifier, protocol, rawMessage, message),
        this._cache.remove(identifier, CacheNamespace.Transactions),
      ]).then((successes) => successes.every(Boolean));
      return { success };
    } else {
      this._logger.error(
        'Failed to send callError due to mismatch in message id',
        identifier,
        cachedActionMessageId,
        message,
      );
      return { success: false };
    }
  }

  async shutdown(): Promise<void> {
    await this._sender.shutdown();
    await this._handler.shutdown();
  }

  /**
   * Private Methods
   */

  /**
   * Handles an incoming Call message from a client connection.
   *
   * @param {string} identifier - The client identifier.
   * @param {Call} message - The Call message received.
   * @param {Date} timestamp Time at which the message was received from the charger.
   * @param {string} protocol The OCPP protocol version of the message
   * @return {void}
   */
  async _onCall(
    identifier: string,
    message: Call,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<void> {
    const messageId = message[1];
    const tenantId = getTenantIdFromIdentifier(identifier);
    const stationId = getStationIdFromIdentifier(identifier);

    let action = null;

    try {
      action = mapToCallAction(protocol, message[2]);
      const isAllowed = await this._onCallIsAllowed(action, identifier);
      if (!isAllowed) {
        throw new OcppError(messageId, ErrorCode.SecurityError, `Action ${action} not allowed`);
      }
      // Run schema validation for incoming Call message
      const { isValid, errors } = this._validateCall(identifier, message, protocol);

      if (!isValid || errors) {
        throw new OcppError(messageId, ErrorCode.FormatViolation, 'Invalid message format', {
          errors: errors,
        });
      }

      // Ensure only one call is processed at a time
      const successfullySet = await this._cache.setIfNotExist(
        identifier,
        `${action}:${messageId}`,
        CacheNamespace.Transactions,
        this._config.maxCallLengthSeconds,
      );

      if (!successfullySet) {
        throw new OcppError(messageId, ErrorCode.RpcFrameworkError, 'Call already in progress', {});
      }
    } catch (error) {
      this._logger.error('Failed to process Call message', identifier, message, error);

      // Send manual reply since cache was unable to be set
      let callError =
        error instanceof OcppError
          ? error.asCallError()
          : [
              MessageTypeId.CallError,
              messageId,
              ErrorCode.InternalError,
              'Unable to process message',
              { error: (error as Error).message },
            ];
      callError = this.removeNulls(callError);
      const rawMessage = JSON.stringify(callError);
      await this._sendMessage(identifier, protocol, rawMessage, callError);
      return;
    }

    try {
      // Route call
      const confirmation = await this._routeCall(identifier, message, timestamp, protocol);

      if (!confirmation.success) {
        throw new OcppError(messageId, ErrorCode.InternalError, 'Call failed', {
          details: confirmation.payload,
        });
      }
    } catch (error) {
      const callError =
        error instanceof OcppError
          ? error
          : new OcppError(messageId, ErrorCode.InternalError, 'Call failed', {
              details: error,
            });

      this.sendCallError(messageId, stationId, tenantId, protocol, action, callError).finally(
        () => {
          this._cache.remove(identifier, CacheNamespace.Transactions);
        },
      );
    }
  }

  /**
   * Handles a CallResult made by the client.
   *
   * @param {string} identifier - The client identifier that made the call.
   * @param {CallResult} message - The OCPP CallResult message.
   * @param {Date} timestamp Time at which the message was received from the charger.
   * @param {OCPPVersionType} protocol The OCPP protocol version of the message
   * @return {void}
   */
  _onCallResult(
    identifier: string,
    message: CallResult,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): void {
    const messageId = message[1];
    const payload = message[2];

    this._logger.debug('Process CallResult', identifier, messageId, payload);

    this._cache
      .get<string>(identifier, CacheNamespace.Transactions)
      .then((cachedActionMessageId) => {
        this._cache.remove(identifier, CacheNamespace.Transactions); // Always remove pending call transaction
        if (!cachedActionMessageId) {
          throw new OcppError(
            messageId,
            ErrorCode.InternalError,
            'MessageId not found, call may have timed out',
            { maxCallLengthSeconds: this._config.maxCallLengthSeconds },
          );
        }
        const [action, cachedMessageId] = cachedActionMessageId.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
        if (messageId !== cachedMessageId) {
          throw new OcppError(messageId, ErrorCode.InternalError, "MessageId doesn't match", {
            expectedMessageId: cachedMessageId,
          });
        }
        return {
          action,
          ...this._validateCallResult(
            identifier,
            mapToCallAction(protocol, action),
            message,
            protocol,
          ),
        }; // Run schema validation for incoming CallResult message
      })
      .then(({ action, isValid, errors }) => {
        if (!isValid || errors) {
          throw new OcppError(messageId, ErrorCode.FormatViolation, 'Invalid message format', {
            errors: errors,
          });
        }
        // Route call result
        return this._routeCallResult(
          identifier,
          message,
          mapToCallAction(protocol, action),
          timestamp,
          protocol,
        );
      })
      .then((confirmation) => {
        if (!confirmation.success) {
          throw new OcppError(messageId, ErrorCode.InternalError, 'CallResult failed', {
            details: confirmation.payload,
          });
        }
      })
      .catch((error) => {
        // TODO: There's no such thing as a CallError in response to a CallResult. The above call error exceptions should be replaced.
        // TODO: Ideally the error log is also stored in the database in a failed invocations table to ensure these are visible outside of a log file.
        this._logger.error('Failed processing call result: ', error);
      });
  }

  /**
   * Handles the CallError that may have occured during a Call exchange.
   *
   * @param {string} identifier - The client identifier.
   * @param {CallError} message - The error message.
   * @param {Date} timestamp Time at which the message was received from the charger.
   * @param {OCPPVersionType} protocol The OCPP protocol version of the message
   * @return {void} This function doesn't return anything.
   */
  _onCallError(
    identifier: string,
    message: CallError,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): void {
    const messageId = message[1];

    this._logger.debug('Process CallError', identifier, message);

    this._cache
      .get<string>(identifier, CacheNamespace.Transactions)
      .then((cachedActionMessageId) => {
        this._cache.remove(identifier, CacheNamespace.Transactions); // Always remove pending call transaction
        if (!cachedActionMessageId) {
          throw new OcppError(
            messageId,
            ErrorCode.InternalError,
            'MessageId not found, call may have timed out',
            { maxCallLengthSeconds: this._config.maxCallLengthSeconds },
          );
        }
        const [action, cachedMessageId] = cachedActionMessageId.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
        if (messageId !== cachedMessageId) {
          throw new OcppError(messageId, ErrorCode.InternalError, "MessageId doesn't match", {
            expectedMessageId: cachedMessageId,
          });
        }
        return this._routeCallError(
          identifier,
          message,
          mapToCallAction(protocol, action),
          timestamp,
          protocol,
        );
      })
      .then((confirmation) => {
        if (!confirmation.success) {
          this._logger.warn('Unable to route call error: ', confirmation);
        }
      })
      .catch((error) => {
        // TODO: Ideally the error log is also stored in the database in a failed invocations table to ensure these are visible outside of a log file.
        this._logger.error('Failed processing call error: ', error);
      });
  }

  /**
   * Determine if the given action for identifier is allowed.
   *
   * @param {CallAction} action - The action to be checked.
   * @param {string} identifier - The identifier to be checked.
   * @return {Promise<boolean>} A promise that resolves to a boolean indicating if the action and identifier are allowed.
   */
  private _onCallIsAllowed(action: CallAction, identifier: string): Promise<boolean> {
    return this._cache.exists(action, identifier).then((blacklisted) => !blacklisted);
  }

  private async _sendMessage(
    identifier: string,
    protocol: OCPPVersionType,
    rawMessage: string,
    rpcMessage: any,
  ): Promise<boolean> {
    try {
      await this._networkHook(identifier, rawMessage); // Throws an error if the message is not sent, or returns void
    } catch (error) {
      this._logger.error('Failed to send message:', identifier, rawMessage, error);
      // Don't dispatch if the message was not sent
      return false;
    }
    this._webhookDispatcher.dispatchMessageSent(
      identifier,
      rawMessage,
      new Date().toISOString(),
      protocol,
      rpcMessage,
    );
    return true;
  }

  private async _sendCallIsAllowed(
    identifier: string,
    protocol: OCPPVersionType,
    message: Call,
  ): Promise<boolean> {
    const status = await this._cache.get<string>(BOOT_STATUS, identifier);
    if (
      status === OCPP2_0_1.RegistrationStatusEnumType.Rejected &&
      // TriggerMessage<BootNotification> is the only message allowed to be sent during Rejected BootStatus B03.FR.08
      !(
        mapToCallAction(protocol, message[2]) === OCPP2_0_1_CallAction.TriggerMessage &&
        (message[3] as OCPP2_0_1.TriggerMessageRequest).requestedMessage ==
          OCPP2_0_1.MessageTriggerEnumType.BootNotification
      )
    ) {
      return false;
    }
    return true;
  }

  private async _routeCall(
    connectionIdentifier: string,
    message: Call,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<IMessageConfirmation> {
    const messageId = message[1];
    const action = mapToCallAction(protocol, message[2]);
    const payload = message[3] as OcppRequest;
    const tenantId = getTenantIdFromIdentifier(connectionIdentifier);
    const stationId = getStationIdFromIdentifier(connectionIdentifier);

    const _message: IMessage<OcppRequest> = RequestBuilder.buildCall(
      stationId,
      messageId,
      tenantId,
      action,
      payload,
      EventGroup.General, // TODO: Change to appropriate event group
      MessageOrigin.ChargingStation,
      protocol,
      timestamp,
    );

    return this._sender.send(_message);
  }

  private async _routeCallResult(
    connectionIdentifier: string,
    message: CallResult,
    action: CallAction,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<IMessageConfirmation> {
    const messageId = message[1];
    const payload = message[2] as OcppResponse;
    const tenantId = getTenantIdFromIdentifier(connectionIdentifier);
    const stationId = getStationIdFromIdentifier(connectionIdentifier);

    const _message: IMessage<OcppResponse> = RequestBuilder.buildCallResult(
      stationId,
      messageId,
      tenantId,
      action,
      payload,
      EventGroup.General,
      MessageOrigin.ChargingStation,
      protocol,
      timestamp,
    );

    return this._sender.send(_message);
  }

  private async _routeCallError(
    connectionIdentifier: string,
    message: CallError,
    action: CallAction,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<IMessageConfirmation> {
    const messageId = message[1];
    const payload = new OcppError(messageId, message[2], message[3], message[4]);
    const tenantId = getTenantIdFromIdentifier(connectionIdentifier);
    const stationId = getStationIdFromIdentifier(connectionIdentifier);

    const _message: IMessage<OcppError> = RequestBuilder.buildCallError(
      stationId,
      messageId,
      tenantId,
      action,
      payload,
      EventGroup.General,
      MessageOrigin.ChargingStation,
      protocol,
      timestamp,
    );

    // Fulfill callback for api, if needed
    this._handleMessageApiCallback(_message);

    // No error routing currently done
    this._logger.warn('Error routing not implemented');
    return { success: false };
  }

  private async _handleMessageApiCallback(message: IMessage<OcppError>): Promise<void> {
    const url: string | null = await this._cache.get(
      message.context.correlationId,
      AbstractModule.CALLBACK_URL_CACHE_PREFIX + message.context.stationId,
    );
    if (url) {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message.payload),
      });
    }
  }

  // Intentionally removing NULL values from object for OCPP conformity
  private removeNulls<T>(obj: T): T {
    if (obj === null) return undefined as T;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.filter((item) => item !== null).map((item) => this.removeNulls(item)) as T;
    }

    const result = {} as T;
    for (const [key, value] of Object.entries(obj as object)) {
      result[key as keyof T] = this.removeNulls(value);
    }
    return result;
  }
}
