// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  buildCallEvent,
  buildConnectionEvent,
  buildFrameEvent,
  ConnectionNotFoundError,
  MessagesExchangeSink,
  RabbitMqDeadLetterPublisher,
  RabbitMqReemitter,
} from '@/transport/index.js';
import {
  CallHandledOutcome,
  CallResponseOutcome,
  CallResultSentOutcome,
  CallSentOutcome,
  DeadLetterReason,
  DeadLetterSource,
  recordOcppCallHandled,
  recordOcppCallResponse,
  recordOcppCallResultSent,
  recordOcppCallRoundtripDuration,
  recordOcppCallSent,
  recordOcppMessageReceived,
  recordOcppMessageRouted,
  UNKNOWN_ACTION,
} from '@/transport/metrics.js';
import {
  AbstractMessageRouter,
  CacheNamespace,
  Call,
  CallError,
  CallResult,
  createIdentifier,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
  type ICache,
  type IMessage,
  type IMessageConfirmation,
  type IMessageHandler,
  type IMessageRouter,
  type IMessageSender,
  mapToCallAction,
  OcppError,
  OCPPValidator,
  readMessageId,
  RequestBuilder,
  type RpcMessage,
  UNREADABLE_MESSAGE_ID,
} from '@citrineos/base';
import type { IChargingStationRepository } from '@citrineos/dal';
import {
  type CallAction,
  CallEventOutcome,
  ConnectionEventState,
  ErrorCode,
  EventGroup,
  MessageOrigin,
  MessageState,
  MessageTypeId,
  NO_ACTION,
  OCPP2_1,
  OCPP_CallAction,
  type OcppRequest,
  type OcppResponse,
  OCPPVersion,
  type OCPPVersionType,
  RetryMessageError,
  type SystemConfig,
} from '@citrineos/types';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';
import { type CallbackUrlNotifier } from './callback-url-notifier.js';

type RoutedMessage = IMessage<OcppRequest | OcppResponse | OcppError>;

const OUTSTANDING_CALL_CACHE_KEY = 'outstanding-csms-call';

/**
 * Implementation of the ocpp router
 */
export class MessageRouterImpl extends AbstractMessageRouter implements IMessageRouter {
  /**
   * Fields
   */

  protected _messagesExchangeSink: MessagesExchangeSink;
  protected _callbackUrlNotifier: CallbackUrlNotifier;
  protected _cache: ICache;
  protected _sender: IMessageSender;
  protected _handler: IMessageHandler;
  protected _networkHook: (identifier: string, message: string) => Promise<void>;
  protected _chargingStationRepository: IChargingStationRepository;
  protected _reemitter: RabbitMqReemitter;
  protected _deadLetterPublisher: RabbitMqDeadLetterPublisher;

  /**
   * Stations being deregistered, with the messages that arrived meanwhile. Until the station's
   * bindings are gone a re-emit could route straight back here, so these wait for the unbind.
   */
  protected _deregistering = new Map<string, RoutedMessage[]>();
  protected _pendingCalls = new Map<
    string,
    { messages: RoutedMessage[]; timer?: ReturnType<typeof setTimeout> }
  >();
  private _draining = new Set<string>();
  private _isShutDown = false;

  /**
   * Constructor for the class.
   *
   * @param {SystemConfig} config - the system configuration
   * @param {ICache} cache - the cache object
   * @param {IMessageSender} [routerSender] - the message sender
   * @param {IMessageHandler} [routerHandler] - the message handler
   * @param {MessagesExchangeSink} [messagesExchangeSink] - where frame and connection events are published
   * @param {CallbackUrlNotifier} [callbackUrlNotifier] - completes API commands that supplied a callback URL   * @param {Function} networkHook - the network hook needed to send messages to chargers
   * @param {IChargingStationRepository} chargingStationRepository - repository for charging station reads   * @param {Logger<ILogObj>} [logger] - the logger object (optional)
   * @param {OCPPValidator} [ocppValidator] - the OCPPValidator instance, for message validation (optional)
   */
  constructor({
    config,
    cache,
    routerSender,
    routerHandler,
    messagesExchangeSink,
    callbackUrlNotifier,
    networkHook,
    logger,
    ocppValidator,
    chargingStationRepository,
    reemitter,
    deadLetterPublisher,
  }: {
    config: SystemConfig;
    cache: ICache;
    routerSender: IMessageSender;
    routerHandler: IMessageHandler;
    messagesExchangeSink: MessagesExchangeSink;
    callbackUrlNotifier: CallbackUrlNotifier;
    networkHook: (identifier: string, message: string) => Promise<void>;
    logger: Logger<ILogObj>;
    ocppValidator: OCPPValidator;
    chargingStationRepository: IChargingStationRepository;
    reemitter: RabbitMqReemitter;
    deadLetterPublisher: RabbitMqDeadLetterPublisher;
  }) {
    super(config, cache, routerHandler, routerSender, networkHook, logger, ocppValidator);

    this._cache = cache;
    this._sender = routerSender;
    this._handler = routerHandler;
    this._messagesExchangeSink = messagesExchangeSink;
    this._callbackUrlNotifier = callbackUrlNotifier;
    this._networkHook = networkHook;
    this._chargingStationRepository = chargingStationRepository;
    this._reemitter = reemitter;
    this._deadLetterPublisher = deadLetterPublisher;
  }

  async doesChargingStationExistByOcppConnectionName(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<boolean> {
    return await this._chargingStationRepository.doesChargingStationExistByOcppConnectionName(
      tenantId,
      ocppConnectionName,
    );
  }

  // TODO: Below method should lock these tables so that a rapid connect-disconnect cannot result in race condition.
  async registerConnection(
    tenantId: number,
    ocppConnectionName: string,
    protocol: OCPPVersion,
    connectedWebsocketServerConfigId?: string,
  ): Promise<boolean> {
    const connectionIdentifier = createIdentifier(tenantId, ocppConnectionName);
    const requestSubscription = this._handler.subscribe(connectionIdentifier, undefined, {
      tenantId: tenantId.toString(),
      ocppConnectionName,
      state: MessageState.Request.toString(),
      origin: MessageOrigin.ChargingStationManagementSystem.toString(),
    });

    const responseSubscription = this._handler.subscribe(connectionIdentifier, undefined, {
      tenantId: tenantId.toString(),
      ocppConnectionName,
      state: MessageState.Response.toString(),
      origin: MessageOrigin.ChargingStationManagementSystem.toString(),
    });

    const onlineCharger = this._chargingStationRepository.setChargingStationIsOnlineAndOCPPVersion(
      tenantId,
      ocppConnectionName,
      true,
      protocol,
      connectedWebsocketServerConfigId,
    );

    const [request, response, online] = await Promise.allSettled([
      requestSubscription,
      responseSubscription,
      onlineCharger,
    ]);
    const subscribed = [request, response].map(
      (result) => result.status === 'fulfilled' && result.value,
    );

    if (subscribed.every(Boolean) && online.status === 'fulfilled') {
      await this._messagesExchangeSink.record(
        buildConnectionEvent({
          tenantId,
          ocppConnectionName,
          state: ConnectionEventState.Connected,
          timestamp: new Date().toISOString(),
          protocol,
        }),
      );
      return true;
    }

    const errors = [request, response, online].flatMap((result) =>
      result.status === 'rejected' ? [result.reason] : [],
    );
    this._logger.error(`Error registering connection for ${connectionIdentifier}`, ...errors);
    await this._rollBackRegistration(
      tenantId,
      ocppConnectionName,
      protocol,
      subscribed.some(Boolean),
      online.status === 'fulfilled',
    );
    return false;
  }

  /**
   * Undoes the steps of a registration that did succeed. Nothing else would: the network
   * connection only deregisters connections whose close listener is attached, which happens after
   * registration.
   */
  private async _rollBackRegistration(
    tenantId: number,
    ocppConnectionName: string,
    protocol: OCPPVersion,
    anySubscribed: boolean,
    markedOnline: boolean,
  ): Promise<void> {
    const connectionIdentifier = createIdentifier(tenantId, ocppConnectionName);
    if (anySubscribed) {
      await this._handler.unsubscribe(connectionIdentifier).catch((error) => {
        this._logger.error(`Failed to unsubscribe ${connectionIdentifier} after rollback`, error);
      });
    }
    if (markedOnline) {
      await this._chargingStationRepository
        .setChargingStationIsOnlineAndOCPPVersion(
          tenantId,
          ocppConnectionName,
          false,
          protocol,
          null,
        )
        .catch((error) => {
          this._logger.error(
            `Failed to mark ${connectionIdentifier} offline after rollback; it stays online until its next disconnect`,
            error,
          );
        });
    }
  }

  async deregisterConnection(tenantId: number, ocppConnectionName: string): Promise<boolean> {
    const connectionIdentifier = createIdentifier(tenantId, ocppConnectionName);
    this._deregistering.set(connectionIdentifier, []);
    try {
      return await this._deregisterConnection(tenantId, ocppConnectionName, connectionIdentifier);
    } finally {
      await this._reemitPending(connectionIdentifier);
    }
  }

  private async _deregisterConnection(
    tenantId: number,
    ocppConnectionName: string,
    connectionIdentifier: string,
  ): Promise<boolean> {
    this._messagesExchangeSink
      .record(
        buildConnectionEvent({
          tenantId,
          ocppConnectionName,
          state: ConnectionEventState.Closed,
          timestamp: new Date().toISOString(),
        }),
      )
      .catch((err) => {
        this._logger.error('Failed to publish connection-closed event', err);
      });

    let protocol: OCPPVersion | null = null;
    try {
      const chargingStation =
        await this._chargingStationRepository.readChargingStationByOcppConnectionName(
          tenantId,
          ocppConnectionName,
        );
      if (chargingStation?.protocol) {
        protocol = chargingStation.protocol as OCPPVersion;
      }
    } catch (e: any) {
      this._logger?.warn?.(
        `Could not read charging station ${ocppConnectionName} of tenant ${tenantId} to determine protocol: ${e.message}`,
      );
    }

    await this._chargingStationRepository.setChargingStationIsOnlineAndOCPPVersion(
      tenantId,
      ocppConnectionName,
      false,
      protocol,
      null, // clear the connected server on disconnect
    );

    // TODO: ensure that all queue implementations in ocpp/util only unsubscribe 1 queue per call
    // ...which will require refactoring this method to unsubscribe request and response queues separately
    return await this._handler.unsubscribe(connectionIdentifier);
  }

  async onMessage(
    identifier: string,
    message: string,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<boolean> {
    const tenantId = getTenantIdFromIdentifier(identifier);
    const ocppConnectionName = getStationIdFromIdentifier(identifier);
    let success = true;
    let rpcMessage: any;
    let messageTypeId: MessageTypeId | undefined = undefined;
    // OCPP 2.0.1 part 4, section 4.2.3, When also the MessageId cannot be read, the CALLERROR SHALL contain "-1" as MessageId.
    let messageId: string = UNREADABLE_MESSAGE_ID;

    let parsedMessage: Call | CallResult | CallError | undefined = undefined;
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
      messageId = readMessageId(rpcMessage);
      switch (messageTypeId) {
        case MessageTypeId.Call: {
          parsedMessage = new Call(rpcMessage);
          break;
        }
        case MessageTypeId.CallResult: {
          parsedMessage = new CallResult(rpcMessage);
          break;
        }
        case MessageTypeId.CallError: {
          parsedMessage = new CallError(rpcMessage);
          break;
        }
        default: {
          let errorCode;
          switch (protocol) {
            case OCPPVersion.OCPP1_6:
            case OCPPVersion.OCPP2_0_1:
            case OCPPVersion.OCPP2_1: {
              errorCode = ErrorCode.FormatViolation;
              break;
            }
            default: {
              throw new Error('Unknown protocol: ' + protocol);
            }
          }
          throw new OcppError(
            messageId,
            errorCode,
            'Unknown message type id: ' + messageTypeId,
            {},
          );
        }
      }
    } catch (error) {
      success = false; // ensure we return false in case of an error
      this._logger.error('Error parsing message:', message, error);
      const action = this.getActionFromIncompletelyParsedRpcMessage(rpcMessage, messageTypeId);
      if (messageTypeId != MessageTypeId.CallResult && messageTypeId != MessageTypeId.CallError) {
        const callError =
          error instanceof OcppError
            ? error.asCallError()
            : new CallError(messageId, ErrorCode.InternalError, 'Unable to process message', {
                error: error,
              });
        const rawMessage = JSON.stringify(callError);
        await this._sendMessage(
          identifier,
          protocol,
          MessageState.Response,
          rawMessage,
          callError,
          action,
        );
      }
      // A generated correlationId, so frames that never parsed cannot end up referencing each other.
      await this._messagesExchangeSink.record(
        buildFrameEvent({
          tenantId,
          ocppConnectionName,
          origin: MessageOrigin.ChargingStation,
          correlationId: uuidv4(),
          protocol,
          raw: message,
          timestamp: timestamp.toISOString(),
          type: messageTypeId,
          action,
        }),
      );
    }
    if (parsedMessage && success) {
      const action =
        parsedMessage.messageTypeId === MessageTypeId.Call
          ? (parsedMessage as Call).action
          : undefined;
      try {
        switch (parsedMessage.messageTypeId) {
          case MessageTypeId.Call: {
            await this._onCall(identifier, parsedMessage as Call, timestamp, protocol);
            break;
          }
          case MessageTypeId.CallResult: {
            await this._onCallResult(identifier, parsedMessage as CallResult, timestamp, protocol);
            break;
          }
          case MessageTypeId.CallError: {
            await this._onCallError(identifier, parsedMessage as CallError, timestamp, protocol);
            break;
          }
        }
      } catch (error) {
        success = false; // ensure we return false in case of an error
        this._logger.error('Error processing message:', message, error);
        if (messageTypeId != MessageTypeId.CallResult && messageTypeId != MessageTypeId.CallError) {
          const callError =
            error instanceof OcppError
              ? error.asCallError()
              : new CallError(messageId, ErrorCode.InternalError, 'Unable to process message', {
                  error: error,
                });
          const rawMessage = JSON.stringify(callError);
          await this._sendMessage(
            identifier,
            protocol,
            MessageState.Response,
            rawMessage,
            callError,
            action,
          );
        }
      } finally {
        await this._messagesExchangeSink.record(
          buildFrameEvent({
            tenantId,
            ocppConnectionName,
            origin: MessageOrigin.ChargingStation,
            correlationId: readMessageId(rpcMessage),
            protocol,
            raw: message,
            timestamp: timestamp.toISOString(),
            type: parsedMessage.messageTypeId,
            action,
            rpcMessage: parsedMessage.toJSON(),
          }),
        );
      }
    }
    recordOcppMessageReceived(messageTypeId, protocol);

    return success;
  }

  /**
   * Sends a Call message to a charging station with given identifier.
   *
   * @param ocppConnectionName - The connection name of the charging station
   * @param {number} tenantId - The identifier of the tenant.
   * @param {OCPPVersionType} protocol The OCPP protocol version of the message.
   * @param {CallAction} action - The action to be called.
   * @param {OcppRequest} payload - The payload of the call.
   * @param {string} correlationId - The correlation ID of the message.
   * @param {MessageOrigin} _origin - The origin of the message.
   * @return {Promise<boolean>} A promise that resolves to a boolean indicating if the call was sent successfully.
   */
  async sendCall(
    ocppConnectionName: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppRequest,
    correlationId: string = uuidv4(),
    _origin?: MessageOrigin,
  ): Promise<IMessageConfirmation> {
    const identifier = createIdentifier(tenantId, ocppConnectionName);
    const transactionNamespace = CacheNamespace.Transactions + identifier;

    const message = new Call(correlationId, action, payload);
    if (await this._sendCallIsAllowed(identifier, protocol, message)) {
      if (
        await this._cache.setIfNotExist(
          OUTSTANDING_CALL_CACHE_KEY,
          correlationId,
          transactionNamespace,
          this._config.timeouts.maxCallLengthSeconds,
        )
      ) {
        await this._allowTriggeredActionWhilePending(identifier, action, payload);
        const cacheTimestamp = new Date();
        await this._cache.set(
          correlationId,
          `${action}@${cacheTimestamp.toISOString()}`,
          transactionNamespace,
          {
            seconds: this._config.timeouts.maxCallLengthSeconds,
            // An answer removes the key on whichever instance the station is connected to by then,
            // so only a Call left unanswered gets here.
            onExpire: () => {
              if (!this._isShutDown) {
                this._recordCallOutcome(
                  CallEventOutcome.Timeout,
                  identifier,
                  protocol,
                  correlationId,
                  String(action),
                );
              }
            },
          },
        );
        const rawMessage = JSON.stringify(message);
        let successTimestamp: Date | undefined;
        try {
          successTimestamp = await this._sendRoutedMessage(
            identifier,
            protocol,
            MessageState.Request,
            rawMessage,
            message,
            action,
          );
        } catch (error) {
          // Not released through _releaseOutstandingCall: the Calls waiting behind this one are
          // re-emitted with it, not sent here.
          await this._cache.remove(correlationId, transactionNamespace);
          await this._cache.remove(OUTSTANDING_CALL_CACHE_KEY, transactionNamespace);
          throw error;
        }
        if (successTimestamp != undefined) {
          recordOcppCallSent(String(action), protocol, CallSentOutcome.Sent);
          this._logger.debug(
            `Call sent successfully with ${
              successTimestamp.getTime() - cacheTimestamp.getTime()
            } ms of lag between cache and send ${correlationId}`,
            identifier,
            message,
          );
        } else {
          recordOcppCallSent(String(action), protocol, CallSentOutcome.SendFailed);
          this._recordCallOutcome(
            CallEventOutcome.SendFailed,
            identifier,
            protocol,
            correlationId,
            String(action),
          );
          const removed = await this._cache.remove(correlationId, transactionNamespace);
          await this._releaseOutstandingCall(identifier);
          this._logger.warn(
            `Failed to send call, removed from cache: ${removed}`,
            identifier,
            message,
          );
        }
        return { success: !!successTimestamp };
      } else {
        this._logger.info(
          'Call already in progress, throwing retry exception',
          identifier,
          message,
        );
        throw new RetryMessageError('Call already in progress');
      }
    } else {
      recordOcppCallSent(String(action), protocol, CallSentOutcome.Rejected);
      this._logger.info('RegistrationStatus Rejected, unable to send', identifier, message);
      return { success: false };
    }
  }

  /**
   * Sends the CallResult to a charging station with given identifier.
   *
   * @param {string} correlationId - The correlation ID of the message.
   * @param ocppConnectionName - The connection name of the charging station
   * @param {number} tenantId - The identifier of the tenant.
   * @param {OCPPVersionType} protocol The OCPP protocol version of the message.
   * @param {CallAction} action - The action to be called.
   * @param {OcppRequest} payload - The payload of the call.
   * @param {MessageOrigin} _origin - The origin of the message.
   * @return {Promise<boolean>} A promise that resolves to true if the call result was sent successfully, or false otherwise.
   */
  async sendCallResult(
    correlationId: string,
    ocppConnectionName: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppResponse,
    _origin?: MessageOrigin,
  ): Promise<IMessageConfirmation> {
    const message = new CallResult(correlationId, payload);
    const identifier = createIdentifier(tenantId, ocppConnectionName);

    const cachedActionTimestamp = await this._cache.get<string>(
      correlationId,
      CacheNamespace.Transactions + identifier,
    );
    if (!cachedActionTimestamp) {
      recordOcppCallResultSent(String(action), protocol, CallResultSentOutcome.NoPendingRequest);
      this._logger.error(
        'Failed to send callResult due to missing message id',
        identifier,
        message,
      );
      return { success: false };
    }
    const [cachedAction, cachedTimestamp] = cachedActionTimestamp?.split(/@(.*)/) ?? []; // Returns all characters after first '@'
    if (cachedAction === action) {
      const rawMessage = JSON.stringify(message);
      const sent = await this._sendRoutedMessage(
        identifier,
        protocol,
        MessageState.Response,
        rawMessage,
        message,
        cachedAction,
        cachedTimestamp,
      );
      const removed = await this._cache.remove<string>(
        correlationId,
        CacheNamespace.Transactions + identifier,
      );
      const success = !!sent && !!removed;
      recordOcppCallResultSent(
        String(action),
        protocol,
        success ? CallResultSentOutcome.Sent : CallResultSentOutcome.SendFailed,
      );
      this._logger.debug(`CallResult sent successfully ${correlationId}`, identifier, message);
      return { success };
    } else {
      recordOcppCallResultSent(String(action), protocol, CallResultSentOutcome.ActionMismatch);
      this._logger.error(
        'Failed to send callResult due to mismatched action',
        identifier,
        cachedActionTimestamp,
        message,
      );
      return { success: false };
    }
  }

  /**
   * Sends a CallError message to a charging station with given identifier.
   *
   * @param {string} correlationId - The correlation ID of the message.
   * @param ocppConnectionName - The connection name of the charging station
   * @param {number} tenantId - The identifier of the tenant.
   * @param {OCPPVersionType} protocol The OCPP protocol version of the message.
   * @param {CallAction} action - The action to be called.
   * @param {OcppError} error - The error of the call.
   * @param {MessageOrigin} _origin - The origin of the message.
   * @return {Promise<boolean>} - A promise that resolves to true if the message was sent successfully.
   */
  async sendCallError(
    correlationId: string,
    ocppConnectionName: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    error: OcppError,
    _origin?: MessageOrigin | undefined,
  ): Promise<IMessageConfirmation> {
    const message = error.asCallError();
    const identifier = createIdentifier(tenantId, ocppConnectionName);

    const cachedActionTimestamp = await this._cache.get<string>(
      correlationId,
      CacheNamespace.Transactions + identifier,
    );
    if (!cachedActionTimestamp) {
      this._logger.error('Failed to send callError due to missing message id', identifier, message);
      return { success: false };
    }
    const [cachedAction, cachedTimestamp] = cachedActionTimestamp?.split(/@(.*)/) ?? []; // Returns all characters after first '@'
    if (cachedAction === action) {
      const rawMessage = JSON.stringify(message);
      // Sent before the Call is forgotten: if the station is on another instance, that instance
      // answers it through the re-emit and still needs the entry.
      const sent = await this._sendRoutedMessage(
        identifier,
        protocol,
        MessageState.Response,
        rawMessage,
        message,
        cachedAction,
        cachedTimestamp,
      );
      const removed = await this._cache.remove<string>(
        correlationId,
        CacheNamespace.Transactions + identifier,
      );
      const success = !!sent && !!removed;
      return { success };
    } else {
      this._logger.error(
        'Failed to send callError due to mismatched action',
        identifier,
        cachedActionTimestamp,
        cachedAction,
        message,
      );
      return { success: false };
    }
  }

  /**
   * Delivers a message from the broker to the station. A message for a station whose websocket
   * is not here, because it is connected elsewhere or nowhere yet, is re-emitted for whichever
   * router the station connects to.
   */
  async handle(message: RoutedMessage): Promise<void> {
    const identifier = createIdentifier(
      message.context.tenantId,
      message.context.ocppConnectionName,
    );

    const heldForUnbind = this._deregistering.get(identifier);
    if (heldForUnbind) {
      heldForUnbind.push(message);
      return;
    }
    if (message.state === MessageState.Request && this._pendingCalls.has(identifier)) {
      await this._enqueueCall(identifier, message);
      return;
    }

    try {
      await super.handle(message);
    } catch (error) {
      if (error instanceof ConnectionNotFoundError) {
        await this._reemit(message);
        return;
      }
      if (error instanceof RetryMessageError && message.state === MessageState.Request) {
        await this._enqueueCall(identifier, message);
        return;
      }
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this._isShutDown = true;
    for (const [identifier, pending] of this._pendingCalls) {
      clearTimeout(pending.timer);
      for (const message of pending.messages) {
        await this._deadLetterPublisher.publishMessage(
          message,
          DeadLetterReason.Shutdown,
          DeadLetterSource.Router,
        );
      }
      this._pendingCalls.delete(identifier);
    }
    await this._reemitter.shutdown();
    await this._sender.shutdown();
    await this._handler.shutdown();
  }

  protected async _onStaleMessage(message: RoutedMessage): Promise<void> {
    await this._deadLetterPublisher.publishMessage(
      message,
      DeadLetterReason.Stale,
      DeadLetterSource.Router,
    );
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
    const messageId = message.messageId;
    const tenantId = getTenantIdFromIdentifier(identifier);
    const ocppConnectionName = getStationIdFromIdentifier(identifier);

    this._logger.debug('_onCall:', identifier, message, timestamp.toISOString(), protocol);

    let action: CallAction;
    try {
      action = mapToCallAction(protocol, message.action);
    } catch {
      // OCPP-J 4.3: "NotImplemented - Requested Action is not known by receiver." That covers an
      // action no version defines and one this protocol version does not, e.g. a 2.1 message on a
      // 2.0.1 connection. InternalError tells the station the CSMS broke; it did not.
      throw new OcppError(
        messageId,
        ErrorCode.NotImplemented,
        `Action ${message.action} is not known for ${protocol}`,
      );
    }
    const isAllowed = await this._onCallIsAllowed(action, identifier);
    if (!isAllowed) {
      throw new OcppError(messageId, ErrorCode.SecurityError, `Action ${action} not allowed`);
    }
    // Run schema validation for incoming Call message
    const { isValid, errors } = this._validateCall(identifier, message, protocol);

    if (!isValid || errors) {
      throw new OcppError(
        messageId,
        protocol === OCPPVersion.OCPP1_6 ? ErrorCode.FormationViolation : ErrorCode.FormatViolation,
        'Invalid message format',
        {
          errors: errors,
        },
      );
    }

    this._cache
      .existsAnyInNamespace(CacheNamespace.Transactions + identifier)
      .then((exists) => {
        if (exists) {
          this._logger.debug(
            'Another call is already in progress, processing call anyways',
            identifier,
            message,
          );
        }
      })
      .catch((error) => {
        this._logger.error(
          'Failed to check if another call is in progress:',
          identifier,
          message,
          error,
        );
      });
    this._cache
      .setIfNotExist(
        messageId,
        `${action}@${timestamp.toISOString()}`,
        CacheNamespace.Transactions + identifier,
        this._config.timeouts.maxCallLengthSeconds,
      )
      .then((success) => {
        if (!success) {
          this._logger.debug(
            'Another call with same messageId is already in progress, processing call anyways',
            identifier,
            message,
          );
        }
      })
      .catch((error) => {
        this._logger.error('Failed to set call in cache:', identifier, message, error);
      });

    try {
      // Route call
      const confirmation = await this._routeCall(identifier, message, timestamp, protocol);

      if (!confirmation.success) {
        throw new OcppError(messageId, ErrorCode.InternalError, 'Call failed', {
          details: confirmation.payload,
        });
      }
      recordOcppCallHandled(String(action), CallHandledOutcome.Result);
    } catch (error) {
      const callError =
        error instanceof OcppError
          ? error
          : new OcppError(messageId, ErrorCode.InternalError, 'Call failed', {
              details: error,
            });

      recordOcppCallHandled(String(action), CallHandledOutcome.Error, String(callError.errorCode));

      this.sendCallError(messageId, ocppConnectionName, tenantId, protocol, action, callError)
        .catch((err) => {
          this._logger.error('sendCallError failed', err);
        })
        .finally(() => {
          this._cache.remove(messageId, CacheNamespace.Transactions + identifier).catch((err) => {
            this._logger.error('cache remove failed', err);
          });
        });
    }
  }

  /**
   * Handles a CallResult made by the client.
   *
   * @param {string} identifier - The client identifier that made the call.
   * @param {CallResult} message - The OCPP CallResult message.
   * @param {Date} timestamp Time at which the message was received from the charger.
   * @param {OCPPVersionType} protocol The OCPP protocol version of the message
   */
  async _onCallResult(
    identifier: string,
    message: CallResult,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<void> {
    const messageId = message.messageId;

    this._logger.debug('_onCallResult:', identifier, message, timestamp.toISOString(), protocol);

    const cachedActionTimestamp = await this._cache.get<string>(
      messageId,
      CacheNamespace.Transactions + identifier,
    );

    await this._cache.remove(messageId, CacheNamespace.Transactions + identifier).catch((err) => {
      this._logger.error('_onCallResult cache remove failed', err);
    });

    if (!cachedActionTimestamp) {
      recordOcppCallResponse(UNKNOWN_ACTION, CallResponseOutcome.OrphanOrTimeout);
      throw new OcppError(
        messageId,
        ErrorCode.InternalError,
        'MessageId not found, call may have timed out',
        { maxCallLengthSeconds: this._config.timeouts.maxCallLengthSeconds },
      );
    }
    await this._releaseOutstandingCall(identifier);

    const [action, cachedTimestamp] = cachedActionTimestamp.split(/@(.*)/); // Returns all characters after first '@'
    recordOcppCallRoundtripDuration(
      (timestamp.getTime() - new Date(cachedTimestamp).getTime()) / 1000,
      String(action),
    );
    recordOcppCallResponse(String(action), CallResponseOutcome.Result);
    this._logger.debug(
      `Message received. Time taken since sent: ${
        timestamp.getTime() - new Date(cachedTimestamp).getTime()
      } ms`,
      identifier,
      message,
    );

    // Run schema validation for incoming CallResult message
    const { isValid, errors } = this._validateCallResult(
      identifier,
      mapToCallAction(protocol, action),
      message,
      protocol,
    );

    if (!isValid || errors) {
      throw new OcppError(messageId, ErrorCode.FormatViolation, 'Invalid message format', {
        errors: errors,
      });
    }

    // Route call result
    const confirmation = await this._routeCallResult(
      identifier,
      message,
      mapToCallAction(protocol, action),
      timestamp,
      protocol,
    );

    if (!confirmation.success) {
      throw new OcppError(messageId, ErrorCode.InternalError, 'CallResult failed', {
        details: confirmation.payload,
      });
    }
  }

  /**
   * Handles the CallError that may have occurred during a Call exchange.
   *
   * @param {string} identifier - The client identifier.
   * @param {CallError} message - The error message.
   * @param {Date} timestamp Time at which the message was received from the charger.
   * @param {OCPPVersionType} protocol The OCPP protocol version of the message
   */
  async _onCallError(
    identifier: string,
    message: CallError,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<void> {
    const messageId = message.messageId;

    this._logger.debug('_onCallError:', identifier, message, timestamp.toISOString(), protocol);

    const cachedActionTimestamp = await this._cache.get<string>(
      messageId,
      CacheNamespace.Transactions + identifier,
    );

    // Always remove pending call transaction
    await this._cache.remove(messageId, CacheNamespace.Transactions + identifier).catch((err) => {
      this._logger.error('_onCallError cache remove failed', err);
    });

    if (!cachedActionTimestamp) {
      // No pending request cached: the Call likely already expired (timed out).
      recordOcppCallResponse(UNKNOWN_ACTION, CallResponseOutcome.OrphanOrTimeout);
      throw new OcppError(
        messageId,
        ErrorCode.InternalError,
        'MessageId not found, call may have timed out',
        { maxCallLengthSeconds: this._config.timeouts.maxCallLengthSeconds },
      );
    }
    await this._releaseOutstandingCall(identifier);

    const [action, cachedTimestamp] = cachedActionTimestamp.split(/@(.*)/); // Returns all characters after first '@'
    recordOcppCallRoundtripDuration(
      (timestamp.getTime() - new Date(cachedTimestamp).getTime()) / 1000,
      String(action),
    );
    recordOcppCallResponse(String(action), CallResponseOutcome.Error, String(message.errorCode));
    this._logger.debug(
      `Message received. Time taken since sent: ${
        timestamp.getTime() - new Date(cachedTimestamp).getTime()
      } ms`,
      identifier,
      message,
    );

    const confirmation = await this._routeCallError(
      identifier,
      message,
      mapToCallAction(protocol, action),
      timestamp,
      protocol,
    );

    if (!confirmation.success) {
      // Below code commented out with debug log because currently there is no error routing implemented, so this block will always be reached for CallErrors.
      // Once error routing is implemented, this block can be uncommented to throw an error if the CallError routing fails.
      this._logger.debug('Unable to route call error: ', confirmation);
      // throw new OcppError(messageId, ErrorCode.InternalError, 'CallError failed', {
      //   details: confirmation.payload,
      // });
    }
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

  /**
   *
   * @param {string} identifier - The identifier of the client, e.g. "tenantId:ocppConnectionName".
   * @param {OCPPVersionType} protocol - The OCPP protocol version.
   * @param {string} action - The OCPP CallAction to be sent. See {@link CallAction}.
   * @param {MessageState} _state - The state of the message. Used for dispatching in webhook.
   * @param {string} rawMessage - The raw message string to be sent, i.e. the stringified version of the rpc message. Used for sending in webhook and logging.
   * @param {RpcMessage} rpcMessage - the rpc message being sent, as a model object. Used for logging and dispatching in webhook.
   * @param {string} receivedIsoTimestamp - The ISO timestamp of when the Call was received, if this is a response to a Call. Used for logging the time taken for the message to be sent since it was received.
   * @returns {Promise<Date | undefined>} A promise that resolves to the timestamp of when the message was sent or undefined if the message failed to send.
   */
  private async _sendMessage(
    identifier: string,
    protocol: OCPPVersionType,
    state: MessageState,
    rawMessage: string,
    rpcMessage: RpcMessage,
    action?: string,
    receivedIsoTimestamp?: string,
  ): Promise<Date | undefined> {
    try {
      return await this._sendRoutedMessage(
        identifier,
        protocol,
        state,
        rawMessage,
        rpcMessage,
        action,
        receivedIsoTimestamp,
      );
    } catch (error) {
      this._logger.error('Failed to send message:', identifier, rawMessage, error);
      return undefined;
    }
  }

  /**
   * {@link _sendMessage}, except that a station whose websocket is not on this instance throws
   * {@link ConnectionNotFoundError}, so a message routed here can be re-emitted instead.
   */
  private async _sendRoutedMessage(
    identifier: string,
    protocol: OCPPVersionType,
    _state: MessageState,
    rawMessage: string,
    rpcMessage: RpcMessage,
    action?: string,
    receivedIsoTimestamp?: string,
  ): Promise<Date | undefined> {
    try {
      await this._networkHook(identifier, rawMessage); // Throws an error if the message is not sent, or returns void
    } catch (error) {
      if (error instanceof ConnectionNotFoundError) {
        throw error;
      }
      this._logger.error('Failed to send message:', identifier, rawMessage, error);
      // Don't dispatch if the message was not sent
      return undefined;
    }
    const sentTimestamp = new Date();
    if (receivedIsoTimestamp) {
      const receivedTimestamp = new Date(receivedIsoTimestamp);
      this._logger.debug(
        `Message sent successfully. Time taken since received: ${
          sentTimestamp.getTime() - receivedTimestamp.getTime()
        } ms`,
        identifier,
        rpcMessage,
      );
    }
    const sentFrame = rpcMessage.toJSON();
    this._messagesExchangeSink
      .record(
        buildFrameEvent({
          tenantId: getTenantIdFromIdentifier(identifier),
          ocppConnectionName: getStationIdFromIdentifier(identifier),
          origin: MessageOrigin.ChargingStationManagementSystem,
          correlationId: readMessageId(sentFrame),
          protocol,
          raw: rawMessage,
          timestamp: sentTimestamp.toISOString(),
          type: rpcMessage.messageTypeId,
          action,
          rpcMessage: sentFrame,
        }),
      )
      .catch((err) => {
        this._logger.error('Failed to publish outbound frame event', err);
      });
    return sentTimestamp;
  }

  private _recordCallOutcome(
    outcome: CallEventOutcome,
    identifier: string,
    protocol: OCPPVersionType,
    correlationId: string,
    action: string,
  ): void {
    // Built inside the chain, so a malformed event is logged rather than thrown into the caller.
    Promise.resolve()
      .then(() =>
        this._messagesExchangeSink.record(
          buildCallEvent({
            tenantId: getTenantIdFromIdentifier(identifier),
            ocppConnectionName: getStationIdFromIdentifier(identifier),
            outcome,
            correlationId,
            action,
            protocol,
            timestamp: new Date().toISOString(),
          }),
        ),
      )
      .catch((err) => {
        this._logger.error(
          `Failed to publish call ${outcome} event`,
          identifier,
          correlationId,
          err,
        );
      });
  }

  private async _releaseOutstandingCall(identifier: string): Promise<void> {
    await this._cache
      .remove(OUTSTANDING_CALL_CACHE_KEY, CacheNamespace.Transactions + identifier)
      .catch((err) => {
        this._logger.error('Failed to release the outstanding call', identifier, err);
      });
    this._drainPendingCalls(identifier).catch((err) => {
      this._logger.error('Failed to send the next pending call', identifier, err);
    });
  }

  private async _enqueueCall(identifier: string, message: RoutedMessage): Promise<void> {
    const correlationId = message.context.correlationId;
    const outstanding = await this._cache.get<string>(
      OUTSTANDING_CALL_CACHE_KEY,
      CacheNamespace.Transactions + identifier,
    );
    const pending = this._pendingCalls.get(identifier) ?? { messages: [] };
    // Delivered twice, e.g. once through each router while the station moved between them.
    if (
      outstanding === correlationId ||
      pending.messages.some((m) => m.context.correlationId === correlationId)
    ) {
      this._logger.warn(`Dropping duplicate ${message.action} for ${identifier}`, correlationId);
      return;
    }
    const maxPending = this._config.ocpp.maxPendingCallsPerStation;
    if (pending.messages.length >= maxPending) {
      this._logger.info(
        `Dead-lettering ${message.action} for ${identifier}: ${maxPending} Calls already wait ` +
          `behind the outstanding one. correlationId=${correlationId}`,
      );
      await this._deadLetterPublisher.publishMessage(
        message,
        DeadLetterReason.Overflow,
        DeadLetterSource.Router,
      );
      return;
    }
    pending.messages.push(message);
    this._pendingCalls.set(identifier, pending);
    this._armPendingCallTimer(identifier);
    this._logger.info(
      `Call in progress for ${identifier}; ${message.action} waits behind it ` +
        `(${pending.messages.length} pending). correlationId=${correlationId}`,
    );
  }

  /**
   * The outstanding Call is released when the station answers it. When it never does, its cache
   * entry lapses after maxCallLengthSeconds without an event, so this timer tries again then.
   */
  private _armPendingCallTimer(identifier: string): void {
    const pending = this._pendingCalls.get(identifier);
    if (!pending || pending.timer) {
      return;
    }
    pending.timer = setTimeout(() => {
      pending.timer = undefined;
      this._drainPendingCalls(identifier).catch((err) => {
        this._logger.error('Failed to send the next pending call', identifier, err);
      });
    }, this._config.timeouts.maxCallLengthSeconds * 1000);
  }

  /**
   * Sends pending Calls in order until one has to wait for the station again. Stale ones are
   * dead-lettered on the way, by the check in {@link handle}.
   */
  private async _drainPendingCalls(identifier: string): Promise<void> {
    const pending = this._pendingCalls.get(identifier);
    if (!pending || this._draining.has(identifier)) {
      return;
    }
    clearTimeout(pending.timer);
    pending.timer = undefined;
    this._draining.add(identifier);
    try {
      while (pending.messages.length > 0) {
        const next = pending.messages[0];
        try {
          await super.handle(next);
        } catch (error) {
          if (error instanceof RetryMessageError) {
            this._armPendingCallTimer(identifier);
            return;
          }
          if (error instanceof ConnectionNotFoundError) {
            // The station left; deregistering it re-emits what is still waiting.
            await this._reemit(next);
            pending.messages.shift();
            return;
          }
          this._logger.error('Error while sending a pending call:', identifier, error);
          await this._deadLetterPublisher.publishMessage(
            next,
            DeadLetterReason.HandlerError,
            DeadLetterSource.Router,
            { error },
          );
        }
        pending.messages.shift();
      }
      if (pending.messages.length === 0) {
        this._pendingCalls.delete(identifier);
      }
    } finally {
      this._draining.delete(identifier);
    }
  }

  /**
   * Re-emits what this router still holds for a station it no longer serves: its pending Calls,
   * oldest first, then whatever arrived while its bindings were being removed.
   */
  private async _reemitPending(identifier: string): Promise<void> {
    const pending = this._pendingCalls.get(identifier);
    this._pendingCalls.delete(identifier);
    clearTimeout(pending?.timer);
    // Emptied in place, so a drain still iterating this list stops rather than sending them too.
    const waiting = pending?.messages.splice(0) ?? [];
    const held = this._deregistering.get(identifier) ?? [];
    this._deregistering.delete(identifier);

    for (const message of [...waiting, ...held]) {
      await this._reemit(message);
    }
  }

  private async _reemit(message: RoutedMessage): Promise<void> {
    this._logger.info(
      `Re-emitting ${message.action} for ${message.context.ocppConnectionName}: its websocket ` +
        `is not on this instance. correlationId=${message.context.correlationId}`,
    );
    await this._reemitter.reemit(message);
  }

  private async _sendCallIsAllowed(
    identifier: string,
    protocol: OCPPVersionType,
    message: Call,
  ): Promise<boolean> {
    const status = await this._cache.get<string>(CacheNamespace.BootStatus, identifier);
    return !(
      status === OCPP2_1.RegistrationStatusEnumType.Rejected &&
      // TriggerMessage<BootNotification> is the only message allowed to be sent during Rejected BootStatus B03.FR.08
      !(
        mapToCallAction(protocol, message.action) === OCPP_CallAction.TriggerMessage &&
        (message.payload as OCPP2_1.TriggerMessageRequest).requestedMessage ==
          OCPP2_1.MessageTriggerEnumType.BootNotification
      )
    );
  }

  private async _allowTriggeredActionWhilePending(
    identifier: string,
    action: CallAction,
    payload: OcppRequest,
  ): Promise<void> {
    const triggeredAction = this._actionTriggeredBy(action, payload);
    if (!triggeredAction) {
      return;
    }
    const status = await this._cache.get<string>(CacheNamespace.BootStatus, identifier);
    if (status === OCPP2_1.RegistrationStatusEnumType.Pending) {
      await this._cache.remove(triggeredAction, identifier);
    }
  }

  private _actionTriggeredBy(action: CallAction, payload: OcppRequest): string | undefined {
    if (action === OCPP_CallAction.GetBaseReport || action === OCPP_CallAction.GetReport) {
      return OCPP_CallAction.NotifyReport;
    }
    if (action !== OCPP_CallAction.TriggerMessage) {
      return undefined;
    }
    const requestedMessage = (payload as OCPP2_1.TriggerMessageRequest).requestedMessage;
    switch (requestedMessage) {
      case OCPP2_1.MessageTriggerEnumType.SignChargingStationCertificate:
      case OCPP2_1.MessageTriggerEnumType.SignV2GCertificate:
      case OCPP2_1.MessageTriggerEnumType.SignV2G20Certificate:
      case OCPP2_1.MessageTriggerEnumType.SignCombinedCertificate:
        return OCPP_CallAction.SignCertificate;
      default:
        return requestedMessage;
    }
  }

  private async _routeCall(
    connectionIdentifier: string,
    message: Call,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<IMessageConfirmation> {
    const messageId = message.messageId;
    const action = mapToCallAction(protocol, message.action);
    const payload = message.payload;
    const tenantId = getTenantIdFromIdentifier(connectionIdentifier);
    const ocppConnectionName = getStationIdFromIdentifier(connectionIdentifier);

    const _message: IMessage<OcppRequest> = RequestBuilder.buildCall(
      ocppConnectionName,
      messageId,
      tenantId,
      action,
      payload,
      EventGroup.Router,
      MessageOrigin.ChargingStation,
      protocol,
      timestamp,
    );

    return this.emitMessage(_message);
  }

  private async _routeCallResult(
    connectionIdentifier: string,
    message: CallResult,
    action: CallAction,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<IMessageConfirmation> {
    const messageId = message.messageId;
    const payload = message.payload;
    const tenantId = getTenantIdFromIdentifier(connectionIdentifier);
    const ocppConnectionName = getStationIdFromIdentifier(connectionIdentifier);

    const _message: IMessage<OcppResponse> = RequestBuilder.buildCallResult(
      ocppConnectionName,
      messageId,
      tenantId,
      action,
      payload,
      EventGroup.Router,
      MessageOrigin.ChargingStation,
      protocol,
      timestamp,
    );

    this._callbackUrlNotifier
      .notify(messageId, ocppConnectionName, payload)
      .catch((err) => this._logger.error('callback url notification failed', err));

    return this.emitMessage(_message);
  }

  private async _routeCallError(
    connectionIdentifier: string,
    message: CallError,
    action: CallAction,
    timestamp: Date,
    protocol: OCPPVersionType,
  ): Promise<IMessageConfirmation> {
    const messageId = message.messageId;
    const payload = message.asOcppError();
    const tenantId = getTenantIdFromIdentifier(connectionIdentifier);
    const ocppConnectionName = getStationIdFromIdentifier(connectionIdentifier);

    const _message: IMessage<OcppError> = RequestBuilder.buildCallError(
      ocppConnectionName,
      messageId,
      tenantId,
      action,
      payload,
      EventGroup.Router,
      MessageOrigin.ChargingStation,
      protocol,
      timestamp,
    );

    this._callbackUrlNotifier
      .notify(messageId, ocppConnectionName, payload)
      .catch((err) => this._logger.error('callback url notification failed', err));

    return this.emitMessage(_message);
  }

  private async emitMessage(message: IMessage<any>): Promise<IMessageConfirmation> {
    let confirmation: IMessageConfirmation;
    if (message.payload instanceof OcppError) {
      // No error routing currently done
      this._logger.warn('OCPP Error routing not implemented');
      confirmation = { success: false };
    } else {
      confirmation = await this._sender.send(message);
    }

    if (confirmation.success) {
      // The "handled" leg of the funnel. Counting only on a successful send (not
      // mere arrival here) means the not-implemented CallError path and broker
      // send failures stay in the received-minus-routed delta.
      recordOcppMessageRouted(message.action ?? UNKNOWN_ACTION, message.protocol);
    }

    return confirmation;
  }

  private getActionFromIncompletelyParsedRpcMessage(
    rpcMessage: any,
    messageTypeId?: MessageTypeId,
  ) {
    let action;
    switch (messageTypeId) {
      case MessageTypeId.Call:
        action = rpcMessage && rpcMessage.length > 2 ? rpcMessage[2] : NO_ACTION;
        break;
      case MessageTypeId.CallResult:
      case MessageTypeId.CallError:
      default:
        action = NO_ACTION;
        break;
    }
    return action;
  }
}
