// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
/* eslint-disable */

import { AbstractMessageRouter, AbstractModule, BOOT_STATUS, CacheNamespace, Call, CallAction, CallError, CallResult, ErrorCode, EventGroup, ICache, IMessage, IMessageConfirmation, IMessageContext, IMessageHandler, IMessageRouter, IMessageSender, MessageOrigin, MessageState, MessageTriggerEnumType, MessageTypeId, OcppError, OcppRequest, OcppResponse, RegistrationStatusEnumType, RequestBuilder, RetryMessageError, SystemConfig, TriggerMessageRequest } from "@citrineos/base";
import Ajv from "ajv";
import { v4 as uuidv4 } from "uuid";
import { ILogObj, Logger } from "tslog";

export interface Subscription {
    stationId: string;
    onConnect: boolean;
    onClose: boolean;
    onMessage: boolean;
    sentMessage: boolean;
    messageOptions?: {
        regexFilter?: string;
    }
    url: string;
}

/**
 * Implementation of the ocpp router
 */
export class MessageRouterImpl extends AbstractMessageRouter implements IMessageRouter {

    /**
     * Fields
     */

    protected _cache: ICache;
    protected _sender: IMessageSender;
    protected _handler: IMessageHandler;
    protected _networkHook: (identifier: string, message: string) => Promise<boolean>;

    private _onConnectionCallbacks: ((identifier: string, info?: Map<string, string>) => Promise<boolean>)[] = [];
    private _onCloseCallbacks: ((identifier: string, info?: Map<string, string>) => Promise<boolean>)[] = [];
    private _onMessageCallbacks: ((identifier: string, message: string, info?: Map<string, string>) => Promise<boolean>)[] = [];
    private _sentMessageCallbacks: ((identifier: string, message: string, error?: any, info?: Map<string, string>) => Promise<boolean>)[] = [];

    /**
     * Constructor for the class.
     *
     * @param {SystemConfig} config - the system configuration
     * @param {ICache} cache - the cache object
     * @param {IMessageSender} [sender] - the message sender (optional)
     * @param {IMessageHandler} [handler] - the message handler (optional)
     * @param {Logger<ILogObj>} [logger] - the logger object (optional)
     * @param {Ajv} [ajv] - the Ajv object (optional)
     */
    constructor(
        config: SystemConfig,
        cache: ICache,
        sender: IMessageSender,
        handler: IMessageHandler,
        networkHook: (identifier: string, message: string) => Promise<boolean>,
        logger?: Logger<ILogObj>,
        ajv?: Ajv,
    ) {
        super(config, cache, handler, sender, networkHook, logger, ajv);

        this._cache = cache;
        this._sender = sender;
        this._handler = handler;
        this._networkHook = networkHook;
    }

    addOnConnectionCallback(onConnectionCallback: (identifier: string, info?: Map<string, string>) => Promise<boolean>): void {
        this._onConnectionCallbacks.push(onConnectionCallback);
    }

    addOnCloseCallback(onCloseCallback: (identifier: string, info?: Map<string, string>) => Promise<boolean>): void {
        this._onCloseCallbacks.push(onCloseCallback);
    }

    addOnMessageCallback(onMessageCallback: (identifier: string, message: string, info?: Map<string, string>) => Promise<boolean>): void {
        this._onMessageCallbacks.push(onMessageCallback);
    }

    addSentMessageCallback(sentMessageCallback: (identifier: string, message: string, error: any, info?: Map<string, string>) => Promise<boolean>): void {
        this._sentMessageCallbacks.push(sentMessageCallback);
    }

    /**
     * Interface implementation 
     */

    async registerConnection(connectionIdentifier: string): Promise<boolean> {
        await this._onConnectionCallbacks.forEach(async callback => {
            await callback(connectionIdentifier);
        });

        const requestSubscription = await this._handler.subscribe(connectionIdentifier, undefined, {
            stationId: connectionIdentifier,
            state: MessageState.Request.toString(),
            origin: MessageOrigin.CentralSystem.toString()
        });

        const responseSubscription = await this._handler.subscribe(connectionIdentifier, undefined, {
            stationId: connectionIdentifier,
            state: MessageState.Response.toString(),
            origin: MessageOrigin.ChargingStation.toString()
        });

        return requestSubscription && responseSubscription;
    }

    async deregisterConnection(connectionIdentifier: string): Promise<boolean> {
        this._onCloseCallbacks.forEach(callback => {
            callback(connectionIdentifier);
        });
        // TODO: ensure that all queue implementations in 02_Util only unsubscribe 1 queue per call
        // ...which will require refactoring this method to unsubscribe request and response queues separately
        return await this._handler.unsubscribe(connectionIdentifier)
    }

    // TODO: identifier may not be unique, may require combination of tenantId and identifier.
    // find way to include tenantId here
    async onMessage(identifier: string, message: string): Promise<boolean> {
        this._onMessageCallbacks.forEach(callback => {
            callback(identifier, message);
        });
        let rpcMessage: any;
        let messageTypeId: MessageTypeId | undefined = undefined
        let messageId: string = "-1"; // OCPP 2.0.1 part 4, section 4.2.3, "When also the MessageId cannot be read, the CALLERROR SHALL contain "-1" as MessageId."
        try {
            try {
                rpcMessage = JSON.parse(message);
                messageTypeId = rpcMessage[0];
                messageId = rpcMessage[1];
            } catch (error) {
                throw new OcppError(messageId, ErrorCode.FormatViolation, "Invalid message format", { error: error });
            }
            switch (messageTypeId) {
                case MessageTypeId.Call:
                    this._onCall(identifier, rpcMessage as Call);
                    break;
                case MessageTypeId.CallResult:
                    this._onCallResult(identifier, rpcMessage as CallResult);
                    break;
                case MessageTypeId.CallError:
                    this._onCallError(identifier, rpcMessage as CallError);
                    break;
                default:
                    throw new OcppError(messageId, ErrorCode.FormatViolation, "Unknown message type id: " + messageTypeId, {});
            }
            return true;
        } catch (error) {
            this._logger.error("Error processing message:", message, error);
            if (messageTypeId != MessageTypeId.CallResult && messageTypeId != MessageTypeId.CallError) {
                const callError = error instanceof OcppError ? error.asCallError()
                    : [MessageTypeId.CallError, messageId, ErrorCode.InternalError, "Unable to process message", { error: error }];
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
    async sendCall(identifier: string, tenantId: string, action: CallAction, payload: OcppRequest, correlationId = uuidv4(), origin?: MessageOrigin): Promise<IMessageConfirmation> {
        const message: Call = [MessageTypeId.Call, correlationId, action, payload];
        if (await this._sendCallIsAllowed(identifier, message)) {
            if (await this._cache.setIfNotExist(identifier, `${action}:${correlationId}`,
                CacheNamespace.Transactions, this._config.maxCallLengthSeconds)) {
                // Intentionally removing NULL values from object for OCPP conformity
                const rawMessage = JSON.stringify(message, (k, v) => v ?? undefined);
                const success = await this._sendMessage(identifier, rawMessage);
                return { success };
            } else {
                this._logger.info("Call already in progress, throwing retry exception", identifier, message);
                throw new RetryMessageError("Call already in progress");
            }
        } else {
            this._logger.info("RegistrationStatus Rejected, unable to send", identifier, message);
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
    async sendCallResult(correlationId: string, identifier: string, tenantId: string, action: CallAction, payload: OcppResponse, origin?: MessageOrigin): Promise<IMessageConfirmation> {
        const message: CallResult = [MessageTypeId.CallResult, correlationId, payload];
        const cachedActionMessageId = await this._cache.get<string>(identifier, CacheNamespace.Transactions);
        if (!cachedActionMessageId) {
            this._logger.error("Failed to send callResult due to missing message id", identifier, message);
            return { success: false };
        }
        let [cachedAction, cachedMessageId] = cachedActionMessageId?.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
        if (cachedAction === action && cachedMessageId === correlationId) {
            // Intentionally removing NULL values from object for OCPP conformity
            const rawMessage = JSON.stringify(message, (k, v) => v ?? undefined);
            const success = await Promise.all([
                this._sendMessage(identifier, rawMessage),
                this._cache.remove(identifier, CacheNamespace.Transactions)
            ]).then(successes => successes.every(Boolean));
            return { success };
        } else {
            this._logger.error("Failed to send callResult due to mismatch in message id", identifier, cachedActionMessageId, message);
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
    async sendCallError(correlationId: string, identifier: string, tenantId: string, action: CallAction, error: OcppError, origin?: MessageOrigin | undefined): Promise<IMessageConfirmation> {
        const message: CallError = error.asCallError();
        const cachedActionMessageId = await this._cache.get<string>(identifier, CacheNamespace.Transactions);
        if (!cachedActionMessageId) {
            this._logger.error("Failed to send callError due to missing message id", identifier, message);
            return { success: false };
        }
        let [cachedAction, cachedMessageId] = cachedActionMessageId?.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
        if (cachedMessageId === correlationId) {
            // Intentionally removing NULL values from object for OCPP conformity
            const rawMessage = JSON.stringify(message, (k, v) => v ?? undefined);
            const success = await Promise.all([
                this._sendMessage(identifier, rawMessage),
                this._cache.remove(identifier, CacheNamespace.Transactions)
            ]).then(successes => successes.every(Boolean));
            return { success };
        } else {
            this._logger.error("Failed to send callError due to mismatch in message id", identifier, cachedActionMessageId, message);
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
     * @return {void}
     */
    _onCall(identifier: string, message: Call): void {
        const messageId = message[1];
        const action = message[2] as CallAction;
        const payload = message[3];

        this._onCallIsAllowed(action, identifier)
            .then((isAllowed: boolean) => {
                if (!isAllowed) {
                    throw new OcppError(messageId, ErrorCode.SecurityError, `Action ${action} not allowed`);
                } else {
                    // Run schema validation for incoming Call message
                    return this._validateCall(identifier, message);
                }
            }).then(({ isValid, errors }) => {
                if (!isValid || errors) {
                    throw new OcppError(messageId, ErrorCode.FormatViolation, "Invalid message format", { errors: errors });
                }
                // Ensure only one call is processed at a time
                return this._cache.setIfNotExist(identifier, `${action}:${messageId}`, CacheNamespace.Transactions, this._config.maxCallLengthSeconds);
            }).catch(error => {
                if (error instanceof OcppError) {
                    // TODO: identifier may not be unique, may require combination of tenantId and identifier.
                    // find way to include actual tenantId.
                    this.sendCallError(messageId, identifier, "undefined", action, error);
                }
            }).then(successfullySet => {
                if (!successfullySet) {
                    throw new OcppError(messageId, ErrorCode.RpcFrameworkError, "Call already in progress", {});
                }
                // Route call
                return this._routeCall(identifier, message);
            }).then(confirmation => {
                if (!confirmation.success) {
                    throw new OcppError(messageId, ErrorCode.InternalError, 'Call failed', { details: confirmation.payload });
                }
            }).catch(error => {
                if (error instanceof OcppError) {
                    // TODO: identifier may not be unique, may require combination of tenantId and identifier.
                    // find way to include tenantId here
                    this.sendCallError(messageId, identifier, "undefined", action, error);
                    this._cache.remove(identifier, CacheNamespace.Transactions);
                }
            });
    }

    /**
     * Handles a CallResult made by the client.
     *
     * @param {string} identifier - The client identifier that made the call.
     * @param {CallResult} message - The OCPP CallResult message.
     * @return {void}
     */
    _onCallResult(identifier: string, message: CallResult): void {
        const messageId = message[1];
        const payload = message[2];

        this._logger.debug("Process CallResult", identifier, messageId, payload);

        this._cache.get<string>(identifier, CacheNamespace.Transactions)
            .then(cachedActionMessageId => {
                this._cache.remove(identifier, CacheNamespace.Transactions); // Always remove pending call transaction
                if (!cachedActionMessageId) {
                    throw new OcppError(messageId, ErrorCode.InternalError, "MessageId not found, call may have timed out", { "maxCallLengthSeconds": this._config.maxCallLengthSeconds });
                }
                const [actionString, cachedMessageId] = cachedActionMessageId.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
                if (messageId !== cachedMessageId) {
                    throw new OcppError(messageId, ErrorCode.InternalError, "MessageId doesn't match", { "expectedMessageId": cachedMessageId });
                }
                const action: CallAction = CallAction[actionString as keyof typeof CallAction]; // Parse CallAction
                return { action, ...this._validateCallResult(identifier, action, message) }; // Run schema validation for incoming CallResult message
            }).then(({ action, isValid, errors }) => {
                if (!isValid || errors) {
                    throw new OcppError(messageId, ErrorCode.FormatViolation, "Invalid message format", { errors: errors });
                }
                // Route call result
                return this._routeCallResult(identifier, message, action);
            }).then(confirmation => {
                if (!confirmation.success) {
                    throw new OcppError(messageId, ErrorCode.InternalError, 'CallResult failed', { details: confirmation.payload });
                }
            }).catch(error => {
                // TODO: Ideally the error log is also stored in the database in a failed invocations table to ensure these are visible outside of a log file.
                this._logger.error("Failed processing call result: ", error);
            });
    }

    /**
     * Handles the CallError that may have occured during a Call exchange.
     *
     * @param {string} identifier - The client identifier.
     * @param {CallError} message - The error message.
     * @return {void} This function doesn't return anything.
     */
    _onCallError(identifier: string, message: CallError): void {

        const messageId = message[1];

        this._logger.debug("Process CallError", identifier, message);

        this._cache.get<string>(identifier, CacheNamespace.Transactions)
            .then(cachedActionMessageId => {
                this._cache.remove(identifier, CacheNamespace.Transactions); // Always remove pending call transaction
                if (!cachedActionMessageId) {
                    throw new OcppError(messageId, ErrorCode.InternalError, "MessageId not found, call may have timed out", { "maxCallLengthSeconds": this._config.maxCallLengthSeconds });
                }
                const [actionString, cachedMessageId] = cachedActionMessageId.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
                if (messageId !== cachedMessageId) {
                    throw new OcppError(messageId, ErrorCode.InternalError, "MessageId doesn't match", { "expectedMessageId": cachedMessageId });
                }
                const action: CallAction = CallAction[actionString as keyof typeof CallAction]; // Parse CallAction
                return this._routeCallError(identifier, message, action);
            }).then(confirmation => {
                if (!confirmation.success) {
                    throw new OcppError(messageId, ErrorCode.InternalError, 'CallError failed', { details: confirmation.payload });
                }
            }).catch(error => {
                // TODO: Ideally the error log is also stored in the database in a failed invocations table to ensure these are visible outside of a log file.
                this._logger.error("Failed processing call error: ", error);
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
        return this._cache.exists(action, identifier).then(blacklisted => !blacklisted);
    }

    private async _sendMessage(identifier: string, rawMessage: string): Promise<boolean> {
        try {
            const success = await this._networkHook(identifier, rawMessage);
            this._sentMessageCallbacks.forEach(callback => {
                callback(identifier, rawMessage);
            });
            return success;
        } catch (error) {
            this._sentMessageCallbacks.forEach(callback => {
                callback(identifier, rawMessage, error);
            });
            return false;
        }
    }

    private async _sendCallIsAllowed(identifier: string, message: Call): Promise<boolean> {
        const status = await this._cache.get<string>(BOOT_STATUS, identifier);
        if (status == RegistrationStatusEnumType.Rejected &&
            // TriggerMessage<BootNotification> is the only message allowed to be sent during Rejected BootStatus B03.FR.08
            !(message[2] as CallAction == CallAction.TriggerMessage && (message[3] as TriggerMessageRequest).requestedMessage == MessageTriggerEnumType.BootNotification)) {
            return false;
        }
        return true;
    }

    private async _routeCall(connectionIdentifier: string, message: Call): Promise<IMessageConfirmation> {
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
            MessageOrigin.ChargingStation
        );

        return this._sender.send(_message);
    }

    private async _routeCallResult(connectionIdentifier: string, message: CallResult, action: CallAction): Promise<IMessageConfirmation> {
        const messageId = message[1];
        const payload = message[2] as OcppResponse;

        // TODO: Add tenantId to context
        const context: IMessageContext = { correlationId: messageId, stationId: connectionIdentifier, tenantId: '' };

        const _message: IMessage<OcppRequest> = {
            origin: MessageOrigin.CentralSystem,
            eventGroup: EventGroup.General,
            action,
            state: MessageState.Response,
            context,
            payload
        };

        return this._sender.send(_message);
    }

    private async _routeCallError(connectionIdentifier: string, message: CallError, action: CallAction): Promise<IMessageConfirmation> {
        const messageId = message[1];
        const payload = new OcppError(messageId, message[2], message[3], message[4]);

        // TODO: Add tenantId to context
        const context: IMessageContext = { correlationId: messageId, stationId: connectionIdentifier, tenantId: '' };

        const _message: IMessage<OcppError> = {
            origin: MessageOrigin.CentralSystem,
            eventGroup: EventGroup.General,
            action,
            state: MessageState.Response,
            context,
            payload
        };

        // Fulfill callback for api, if needed
        this._handleMessageApiCallback(_message);

        // No error routing currently done
        throw new Error('Method not implemented.');
    }

    private async _handleMessageApiCallback(message: IMessage<OcppError>): Promise<void> {
        const url: string | null = await this._cache.get(message.context.correlationId, AbstractModule.CALLBACK_URL_CACHE_PREFIX + message.context.stationId);
        if (url) {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message.payload)
            });
        }
    }
}