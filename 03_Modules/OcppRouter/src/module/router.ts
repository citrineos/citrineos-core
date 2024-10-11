// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
/* eslint-disable */

import {
  AbstractMessageRouter,
  AbstractModule,
  Ajv,
  BOOT_STATUS,
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
  MessageOrigin,
  MessageState,
  MessageTriggerEnumType,
  MessageTypeId,
  OcppError,
  OcppRequest,
  OcppResponse,
  RegistrationStatusEnumType,
  RequestBuilder,
  RetryMessageError,
  SystemConfig,
  TriggerMessageRequest,
} from '@citrineos/base';
import { v4 as uuidv4 } from 'uuid';
import { ILogObj, Logger } from 'tslog';
import { ISubscriptionRepository, sequelize } from '@citrineos/data';
import { WebhookDispatcher } from './webhook.dispatcher';

/**
 * Implementation of the ocpp router
 */
export class MessageRouterImpl
  extends AbstractMessageRouter
  implements IMessageRouter
{
  /**
   * Fields
   */

  private _webhookDispatcher: WebhookDispatcher;
  protected _cache: ICache;
  protected _sender: IMessageSender;
  protected _handler: IMessageHandler;
  protected _networkHook: (
    identifier: string,
    message: string,
  ) => Promise<boolean>;
  public subscriptionRepository: ISubscriptionRepository;

  /**
   * Constructor for the class.
   *
   * @param {SystemConfig} config - the system configuration
   * @param {ICache} cache - the cache object
   * @param {IMessageSender} [sender] - the message sender
   * @param {IMessageHandler} [handler] - the message handler
   * @param {WebhookDispatcher} [dispatcher] - the webhook dispatcher
   * @param {Function} networkHook - the network hook needed to send messages to chargers
   * @param {ISubscriptionRepository} [subscriptionRepository] - the subscription repository
   * @param {Logger<ILogObj>} [logger] - the logger object (optional)
   * @param {Ajv} [ajv] - the Ajv object, for message validation (optional)
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender: IMessageSender,
    handler: IMessageHandler,
    dispatcher: WebhookDispatcher,
    networkHook: (identifier: string, message: string) => Promise<boolean>,
    logger?: Logger<ILogObj>,
    ajv?: Ajv,
    subscriptionRepository?: ISubscriptionRepository,
  ) {
    super(config, cache, handler, sender, networkHook, logger, ajv);

    this._cache = cache;
    this._sender = sender;
    this._handler = handler;
    this._webhookDispatcher = dispatcher;
    this._networkHook = networkHook;
    this.subscriptionRepository =
      subscriptionRepository ||
      new sequelize.SequelizeSubscriptionRepository(config, this._logger);
  }

  async registerConnection(connectionIdentifier: string): Promise<boolean> {
    const dispatcherRegistration =
      this._webhookDispatcher.register(connectionIdentifier);

    const requestSubscription = this._handler.subscribe(
      connectionIdentifier,
      undefined,
      {
        stationId: connectionIdentifier,
        state: MessageState.Request.toString(),
        origin: MessageOrigin.ChargingStationManagementSystem.toString(),
      },
    );

    const responseSubscription = this._handler.subscribe(
      connectionIdentifier,
      undefined,
      {
        stationId: connectionIdentifier,
        state: MessageState.Response.toString(),
        origin: MessageOrigin.ChargingStationManagementSystem.toString(),
      },
    );

    return Promise.all([
      dispatcherRegistration,
      requestSubscription,
      responseSubscription,
    ])
      .then((resolvedArray) => resolvedArray[1] && resolvedArray[2])
      .catch((error) => {
        this._logger.error(
          `Error registering connection for ${connectionIdentifier}: ${error}`,
        );
        return false;
      });
  }

  async deregisterConnection(connectionIdentifier: string): Promise<boolean> {
    this._webhookDispatcher.deregister(connectionIdentifier);

    // TODO: ensure that all queue implementations in 02_Util only unsubscribe 1 queue per call
    // ...which will require refactoring this method to unsubscribe request and response queues separately
    return await this._handler.unsubscribe(connectionIdentifier);
  }

  // TODO: identifier may not be unique, may require combination of tenantId and identifier.
  // find way to include tenantId here
  async onMessage(
    identifier: string,
    message: string,
    timestamp: Date,
  ): Promise<boolean> {
    this._webhookDispatcher.dispatchMessageReceived(identifier, message);
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
      }
      messageTypeId = rpcMessage[0];
      messageId = rpcMessage[1];
      switch (messageTypeId) {
        case MessageTypeId.Call:
          await this._onCall(identifier, rpcMessage as Call, timestamp);
          break;
        case MessageTypeId.CallResult:
          this._onCallResult(identifier, rpcMessage as CallResult, timestamp);
          break;
        case MessageTypeId.CallError:
          this._onCallError(identifier, rpcMessage as CallError, timestamp);
          break;
        default:
          throw new OcppError(
            messageId,
            ErrorCode.FormatViolation,
            'Unknown message type id: ' + messageTypeId,
            {},
          );
      }
      return true;
    } catch (error) {
      this._logger.error('Error processing message:', message, error);
      if (
        messageTypeId != MessageTypeId.CallResult &&
        messageTypeId != MessageTypeId.CallError
      ) {
        const callError =
          error instanceof OcppError
            ? error.asCallError()
            : [
                MessageTypeId.CallError,
                messageId,
                ErrorCode.InternalError,
                'Unable to process message',
                { error: error },
              ];
        const rawMessage = JSON.stringify(callError, (k, v) => v ?? undefined);
        this._sendMessage(identifier, rawMessage);
      }
      // TODO: Publish raw payload for error reporting
      return false;
    }
  }

  /**
   * Sends a Call message to a charging station with given identifier.
   *
   * @param {string} identifier - The identifier of the charging station.
   * @param {Call} message - The Call message to send.
   * @return {Promise<boolean>} A promise that resolves to a boolean indicating if the call was sent successfully.
   */
  async sendCall(
    identifier: string,
    tenantId: string,
    action: CallAction,
    payload: OcppRequest,
    correlationId = uuidv4(),
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation> {
    const message: Call = [MessageTypeId.Call, correlationId, action, payload];
    if (await this._sendCallIsAllowed(identifier, message)) {
      if (
        await this._cache.setIfNotExist(
          identifier,
          `${action}:${correlationId}`,
          CacheNamespace.Transactions,
          this._config.maxCallLengthSeconds,
        )
      ) {
        // Intentionally removing NULL values from object for OCPP conformity
        const rawMessage = JSON.stringify(message, (k, v) => v ?? undefined);
        const success = await this._sendMessage(identifier, rawMessage);
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
      this._logger.info(
        'RegistrationStatus Rejected, unable to send',
        identifier,
        message,
      );
      return { success: false };
    }
  }

  /**
   * Sends the CallResult to a charging station with given identifier.
   *
   * @param {string} identifier - The identifier of the charging station.
   * @param {CallResult} message - The CallResult message to send.
   * @return {Promise<boolean>} A promise that resolves to true if the call result was sent successfully, or false otherwise.
   */
  async sendCallResult(
    correlationId: string,
    identifier: string,
    tenantId: string,
    action: CallAction,
    payload: OcppResponse,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation> {
    const message: CallResult = [
      MessageTypeId.CallResult,
      correlationId,
      payload,
    ];
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
      // Intentionally removing NULL values from object for OCPP conformity
      const rawMessage = JSON.stringify(message, (k, v) => v ?? undefined);
      const success = await Promise.all([
        this._sendMessage(identifier, rawMessage),
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
   * @param {string} identifier - The identifier of the charging station.
   * @param {CallError} message - The CallError message to send.
   * @return {Promise<boolean>} - A promise that resolves to true if the message was sent successfully.
   */
  async sendCallError(
    correlationId: string,
    identifier: string,
    tenantId: string,
    action: CallAction,
    error: OcppError,
    origin?: MessageOrigin | undefined,
  ): Promise<IMessageConfirmation> {
    const message: CallError = error.asCallError();
    const cachedActionMessageId = await this._cache.get<string>(
      identifier,
      CacheNamespace.Transactions,
    );
    if (!cachedActionMessageId) {
      this._logger.error(
        'Failed to send callError due to missing message id',
        identifier,
        message,
      );
      return { success: false };
    }
    let [cachedAction, cachedMessageId] = cachedActionMessageId?.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
    if (cachedMessageId === correlationId) {
      // Intentionally removing NULL values from object for OCPP conformity
      const rawMessage = JSON.stringify(message, (k, v) => v ?? undefined);
      const success = await Promise.all([
        this._sendMessage(identifier, rawMessage),
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

  shutdown(): void {
    this._sender.shutdown();
    this._handler.shutdown();
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
   * @return {void}
   */
  async _onCall(
    identifier: string,
    message: Call,
    timestamp: Date,
  ): Promise<void> {
    const messageId = message[1];
    const action = message[2] as CallAction;

    try {
      const isAllowed = await this._onCallIsAllowed(action, identifier);
      if (!isAllowed) {
        throw new OcppError(
          messageId,
          ErrorCode.SecurityError,
          `Action ${action} not allowed`,
        );
      }
      // Run schema validation for incoming Call message
      const { isValid, errors } = this._validateCall(identifier, message);

      if (!isValid || errors) {
        throw new OcppError(
          messageId,
          ErrorCode.FormatViolation,
          'Invalid message format',
          { errors: errors },
        );
      }

      // Ensure only one call is processed at a time
      const successfullySet = await this._cache.setIfNotExist(
        identifier,
        `${action}:${messageId}`,
        CacheNamespace.Transactions,
        this._config.maxCallLengthSeconds,
      );

      if (!successfullySet) {
        throw new OcppError(
          messageId,
          ErrorCode.RpcFrameworkError,
          'Call already in progress',
          {},
        );
      }
    } catch (error) {
      // Send manual reply since cache was unable to be set
      const callError =
        error instanceof OcppError
          ? error.asCallError()
          : [
              MessageTypeId.CallError,
              messageId,
              ErrorCode.InternalError,
              'Unable to process message',
              { error: error },
            ];
      const rawMessage = JSON.stringify(callError, (k, v) => v ?? undefined);
      this._sendMessage(identifier, rawMessage);
    }

    try {
      // Route call
      const confirmation = await this._routeCall(
        identifier,
        message,
        timestamp,
      );

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
      // TODO: identifier may not be unique, may require combination of tenantId and identifier.
      // find way to include tenantId here
      this.sendCallError(
        messageId,
        identifier,
        'undefined',
        action,
        callError,
      ).finally(() => {
        this._cache.remove(identifier, CacheNamespace.Transactions);
      });
    }
  }

  /**
   * Handles a CallResult made by the client.
   *
   * @param {string} identifier - The client identifier that made the call.
   * @param {CallResult} message - The OCPP CallResult message.
   * @param {Date} timestamp Time at which the message was received from the charger.
   * @return {void}
   */
  _onCallResult(
    identifier: string,
    message: CallResult,
    timestamp: Date,
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
        const [actionString, cachedMessageId] =
          cachedActionMessageId.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
        if (messageId !== cachedMessageId) {
          throw new OcppError(
            messageId,
            ErrorCode.InternalError,
            "MessageId doesn't match",
            { expectedMessageId: cachedMessageId },
          );
        }
        const action: CallAction =
          CallAction[actionString as keyof typeof CallAction]; // Parse CallAction
        return {
          action,
          ...this._validateCallResult(identifier, action, message),
        }; // Run schema validation for incoming CallResult message
      })
      .then(({ action, isValid, errors }) => {
        if (!isValid || errors) {
          throw new OcppError(
            messageId,
            ErrorCode.FormatViolation,
            'Invalid message format',
            { errors: errors },
          );
        }
        // Route call result
        return this._routeCallResult(identifier, message, action, timestamp);
      })
      .then((confirmation) => {
        if (!confirmation.success) {
          throw new OcppError(
            messageId,
            ErrorCode.InternalError,
            'CallResult failed',
            { details: confirmation.payload },
          );
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
   * @return {void} This function doesn't return anything.
   */
  _onCallError(identifier: string, message: CallError, timestamp: Date): void {
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
        const [actionString, cachedMessageId] =
          cachedActionMessageId.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
        if (messageId !== cachedMessageId) {
          throw new OcppError(
            messageId,
            ErrorCode.InternalError,
            "MessageId doesn't match",
            { expectedMessageId: cachedMessageId },
          );
        }
        const action: CallAction =
          CallAction[actionString as keyof typeof CallAction]; // Parse CallAction
        return this._routeCallError(identifier, message, action, timestamp);
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
  private _onCallIsAllowed(
    action: CallAction,
    identifier: string,
  ): Promise<boolean> {
    return this._cache
      .exists(action, identifier)
      .then((blacklisted) => !blacklisted);
  }

  private async _sendMessage(
    identifier: string,
    rawMessage: string,
  ): Promise<boolean> {
    try {
      const success = await this._networkHook(identifier, rawMessage);
      this._webhookDispatcher.dispatchMessageSent(identifier, rawMessage);
      return success;
    } catch (error) {
      this._webhookDispatcher.dispatchMessageSent(
        identifier,
        rawMessage,
        error,
      );
      return false;
    }
  }

  private async _sendCallIsAllowed(
    identifier: string,
    message: Call,
  ): Promise<boolean> {
    const status = await this._cache.get<string>(BOOT_STATUS, identifier);
    if (
      status === RegistrationStatusEnumType.Rejected &&
      // TriggerMessage<BootNotification> is the only message allowed to be sent during Rejected BootStatus B03.FR.08
      !(
        (message[2] as CallAction) === CallAction.TriggerMessage &&
        (message[3] as TriggerMessageRequest).requestedMessage ==
          MessageTriggerEnumType.BootNotification
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
  ): Promise<IMessageConfirmation> {
    const messageId = message[1];
    const action = message[2] as CallAction;
    const payload = message[3] as OcppRequest;

    const _message: IMessage<OcppRequest> = RequestBuilder.buildCall(
      connectionIdentifier,
      messageId,
      '', // TODO: Add tenantId to method
      action,
      payload,
      EventGroup.General, // TODO: Change to appropriate event group
      MessageOrigin.ChargingStation,
      timestamp,
    );

    return this._sender.send(_message);
  }

  private async _routeCallResult(
    connectionIdentifier: string,
    message: CallResult,
    action: CallAction,
    timestamp: Date,
  ): Promise<IMessageConfirmation> {
    const messageId = message[1];
    const payload = message[2] as OcppResponse;

    const _message: IMessage<OcppResponse> = RequestBuilder.buildCallResult(
      connectionIdentifier,
      messageId,
      '', // TODO: Add tenantId to method
      action,
      payload,
      EventGroup.General,
      MessageOrigin.ChargingStation,
      timestamp,
    );

    return this._sender.send(_message);
  }

  private async _routeCallError(
    connectionIdentifier: string,
    message: CallError,
    action: CallAction,
    timestamp: Date,
  ): Promise<IMessageConfirmation> {
    const messageId = message[1];
    const payload = new OcppError(
      messageId,
      message[2],
      message[3],
      message[4],
    );

    const _message: IMessage<OcppError> = RequestBuilder.buildCallError(
      connectionIdentifier,
      messageId,
      '', // TODO: Add tenantId to method
      action,
      payload,
      EventGroup.General,
      MessageOrigin.ChargingStation,
      timestamp,
    );

    // Fulfill callback for api, if needed
    this._handleMessageApiCallback(_message);

    // No error routing currently done
    this._logger.warn('Error routing not implemented');
    return { success: false };
  }

  private async _handleMessageApiCallback(
    message: IMessage<OcppError>,
  ): Promise<void> {
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
}
