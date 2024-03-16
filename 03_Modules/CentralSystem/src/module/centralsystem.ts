// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
/* eslint-disable */

import { AbstractCentralSystem, BOOT_STATUS, CacheNamespace, Call, CallAction, CallError, CallResult, ErrorCode, ICache, ICentralSystem, IMessageConfirmation, IMessageHandler, IMessageRouter, IMessageSender, MessageOrigin, MessageTriggerEnumType, MessageTypeId, OcppError, OcppMessageRouter, OcppRequest, OcppResponse, RegistrationStatusEnumType, RetryMessageError, SystemConfig, TriggerMessageRequest } from "@citrineos/base";
import Ajv from "ajv";
import { v4 as uuidv4 } from "uuid";
import { ILogObj, Logger } from "tslog";
import { INetworkConnection } from "./networkconnection/WebsocketNetworkConnection";

/**
 * Implementation of the central system
 */
export class CentralSystem extends AbstractCentralSystem implements ICentralSystem {

    /**
     * Fields
     */

    protected _cache: ICache;
    private _router: IMessageRouter;
    private _networkConnection: INetworkConnection;

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
        networkConnection: INetworkConnection,
        logger?: Logger<ILogObj>,
        ajv?: Ajv,
    ) {
        super(config, cache, handler, sender, logger, ajv);

        // Initialize router before socket server to avoid race condition
        this._router = new OcppMessageRouter(cache,
            sender,
            handler);

        networkConnection.addOnConnectionCallback((identifier: string) =>
            this.registerConnection(identifier)
        );

        networkConnection.addOnCloseCallback((identifier: string) =>
            this.deregisterConnection(identifier)
        );

        networkConnection.addOnMessageCallback((identifier: string, message: string) =>
            this.onMessage(identifier, message)
        );

        this._networkConnection = networkConnection;

        this._cache = cache;
    }

    /**
     * Interface implementation 
     */

    shutdown(): void {
        this._router.sender.shutdown();
        this._router.handler.shutdown();
    }

    // TODO: identifier may not be unique, may require combination of tenantId and identifier.
    // find way to include tenantId here
    async onMessage(identifier: string, message: string): Promise<boolean> {
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
                    this.onCall(identifier, rpcMessage as Call);
                    break;
                case MessageTypeId.CallResult:
                    this.onCallResult(identifier, rpcMessage as CallResult);
                    break;
                case MessageTypeId.CallError:
                    this.onCallError(identifier, rpcMessage as CallError);
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
                this._networkConnection.sendMessage(identifier, rawMessage);
            }
            // TODO: Publish raw payload for error reporting
            return false;
        }
    }

    /**
     * Handles an incoming Call message from a client connection.
     *
     * @param {IClientConnection} connection - The client connection object.
     * @param {Call} message - The Call message received.
     * @return {void}
     */
    onCall(identifier: string, message: Call): void {
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
                return this._router.routeCall(identifier, message);
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
     * @param {IClientConnection} connection - The client connection that made the call.
     * @param {CallResult} message - The OCPP CallResult message.
     * @return {void}
     */
    onCallResult(identifier: string, message: CallResult): void {
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
                return this._router.routeCallResult(identifier, message, action);
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
     * @param {IClientConnection} connection - The client connection object.
     * @param {CallError} message - The error message.
     * @return {void} This function doesn't return anything.
     */
    onCallError(identifier: string, message: CallError): void {

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
                return this._router.routeCallError(identifier, message, action);
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
                const success = await this._networkConnection.sendMessage(identifier, rawMessage);
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
                this._networkConnection.sendMessage(identifier, rawMessage),
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
                this._networkConnection.sendMessage(identifier, rawMessage),
                this._cache.remove(identifier, CacheNamespace.Transactions)
            ]).then(successes => successes.every(Boolean));
            return { success };
        } else {
            this._logger.error("Failed to send callError due to mismatch in message id", identifier, cachedActionMessageId, message);
            return { success: false };
        }
    }

    /**
     * Methods 
     */

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


    private async _sendCallIsAllowed(identifier: string, message: Call): Promise<boolean> {
        const status = await this._cache.get<string>(BOOT_STATUS, identifier);
        if (status == RegistrationStatusEnumType.Rejected &&
            // TriggerMessage<BootNotification> is the only message allowed to be sent during Rejected BootStatus B03.FR.08
            !(message[2] as CallAction == CallAction.TriggerMessage && (message[3] as TriggerMessageRequest).requestedMessage == MessageTriggerEnumType.BootNotification)) {
            return false;
        }
        return true;
    }
}