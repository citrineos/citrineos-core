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

import { AbstractCentralSystem, AttributeEnumType, CacheNamespace, Call, CallAction, CallError, CallResult, ClientConnection, ErrorCode, ICache, ICentralSystem, IClientConnection, IMessageHandler, IMessageRouter, IMessageSender, MessageTriggerEnumType, MessageTypeId, OcppError, RegistrationStatusEnumType, SetVariableStatusEnumType, SystemConfig, TriggerMessageRequest } from "@citrineos/base";
import { ProvisioningModule } from "@citrineos/provisioning";
import { RabbitMqSender } from "@citrineos/util";
import Ajv from "ajv";
import * as bcrypt from "bcrypt";
import { instanceToPlain } from "class-transformer";
import * as https from "https";
import * as http from "http";
import fs from "fs";
import { ILogObj, Logger } from "tslog";
import { v4 as uuidv4 } from "uuid";
import { ErrorEvent, MessageEvent, WebSocket, WebSocketServer } from "ws";
import { CentralSystemMessageHandler, OcppMessageRouter } from "./router";
import { DeviceModelRepository } from "@citrineos/data/lib/layers/sequelize";
import { Duplex } from "stream";

/**
 * Implementation of the central system
 */
export class CentralSystemImpl extends AbstractCentralSystem implements ICentralSystem {

    /**
     * Fields
     */

    protected _cache: ICache;
    private _router: IMessageRouter;
    private _socketServer: WebSocketServer;
    private _connections: Map<string, WebSocket> = new Map();
    private _httpServer;
    private _deviceModelRepository: DeviceModelRepository;

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
        sender?: IMessageSender,
        handler?: CentralSystemMessageHandler,
        logger?: Logger<ILogObj>,
        ajv?: Ajv,
        deviceModelRepository?: DeviceModelRepository) {
        super(config, logger, cache, ajv);

        // Initialize router before socket server to avoid race condition
        this._router = new OcppMessageRouter(
            sender || new RabbitMqSender(config, logger),
            handler || new CentralSystemMessageHandler(config, this, logger));

        this._cache = cache;

        this._deviceModelRepository = deviceModelRepository || new DeviceModelRepository(this._config, this._logger);

        this._httpServer = this._config.websocketServer.webProtocol == 'https' ? https.createServer({
            key: fs.readFileSync(this._config.websocketServer.httpsPrivateKeysFilepath as string),
            cert: fs.readFileSync(this._config.websocketServer.httpsCertificateChainFilepath as string),
            minVersion: 'TLSv1.2'
        }) : http.createServer();

        this._socketServer = new WebSocketServer({
            noServer: true,
            handleProtocols: this._handleProtocols.bind(this),
            clientTracking: false
        });

        this._socketServer.on('connection', this._onConnection.bind(this));
        this._socketServer.on('error', this._onError.bind(this));
        this._socketServer.on('close', this._onClose.bind(this));

        this._httpServer.on('upgrade', this._upgradeRequest.bind(this));
        this._httpServer.on('error', (error) => this._socketServer.emit('error', error));
        // socketServer.close() will not do anything; use httpServer.close()
        this._httpServer.on('close', () => this._socketServer.emit('close'));


        this._httpServer.listen(this._config.websocketServer.port, this._config.websocketServer.host, () => {
            this._logger.info(`WebsocketServer running on ${this._config.websocketServer.webProtocol}://${this._config.websocketServer.host}:${this._config.websocketServer.port}/`)
        });
    }

    /**
     * Interface implementation 
     */

    shutdown(): void {
        this._router.sender.shutdown();
        this._router.handler.shutdown();
        this._httpServer.close();
    }

    /**
     * Handles an incoming Call message from a client connection.
     *
     * @param {IClientConnection} connection - The client connection object.
     * @param {Call} message - The Call message received.
     * @return {void}
     */
    onCall(connection: IClientConnection, message: Call): void {
        const messageId = message[1];
        const action = message[2] as CallAction;
        const payload = message[3];

        this._onCallIsAllowed(action, connection.identifier)
            .then((isAllowed: boolean) => {
                if (!isAllowed) {
                    throw new OcppError(messageId, ErrorCode.SecurityError, `Action ${action} not allowed`);
                } else {
                    // Run schema validation for incoming Call message
                    return this._validateCall(connection.identifier, message);
                }
            }).then(({ isValid, errors }) => {
                if (!isValid || errors) {
                    throw new OcppError(messageId, ErrorCode.FormatViolation, "Invalid message format", { errors: errors });
                }
                // Ensure only one call is processed at a time
                return this._cache.exists(connection.identifier, CacheNamespace.Transactions);
            }).then(exists => {
                if (exists) {
                    throw new OcppError(messageId, ErrorCode.RpcFrameworkError, "Call already in progress", {});
                }
                // Add reference to call in cache
                this._cache.set(connection.identifier, `${action}:${messageId}`, CacheNamespace.Transactions, this._config.websocketServer.maxCallLengthSeconds);
            }).then(success => {
                // Route call
                return this._router.routeCall(connection, message);
            }).then(confirmation => {
                if (!confirmation.success) {
                    throw new OcppError(messageId, ErrorCode.InternalError, 'Call failed', { details: confirmation.payload });
                }
            }).catch(error => {
                if (error instanceof OcppError) {
                    error.sendAsCallError(connection.identifier, this);
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
    onCallResult(connection: IClientConnection, message: CallResult): void {
        const messageId = message[1];
        const payload = message[2];

        this._logger.debug("Process CallResult", connection.identifier, messageId, payload);

        this._cache.get<string>(connection.identifier, CacheNamespace.Transactions)
            .then(cachedActionMessageId => {
                this._cache.remove(connection.identifier, CacheNamespace.Transactions); // Always remove pending call transaction
                if (!cachedActionMessageId) {
                    throw new OcppError(messageId, ErrorCode.InternalError, "MessageId not found, call may have timed out", { "maxCallLengthSeconds": this._config.websocketServer.maxCallLengthSeconds });
                }
                const [actionString, cachedMessageId] = cachedActionMessageId.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
                if (messageId !== cachedMessageId) {
                    throw new OcppError(messageId, ErrorCode.InternalError, "MessageId doesn't match", { "expectedMessageId": cachedMessageId });
                }
                const action: CallAction = CallAction[actionString as keyof typeof CallAction]; // Parse CallAction
                return { action, ...this._validateCallResult(connection.identifier, action, message) }; // Run schema validation for incoming CallResult message
            }).then(({ action, isValid, errors }) => {
                if (!isValid || errors) {
                    throw new OcppError(messageId, ErrorCode.FormatViolation, "Invalid message format", { errors: errors });
                }
                // Route call result
                return this._router.routeCallResult(connection, message, action);
            }).then(confirmation => {
                if (!confirmation.success) {
                    throw new OcppError(messageId, ErrorCode.InternalError, 'CallResult failed', { details: confirmation.payload });
                }
            }).catch(error => {
                if (error instanceof OcppError) {
                    error.sendAsCallError(connection.identifier, this);
                }
            });
    }

    /**
     * Handles the CallError that may have occured during a Call exchange.
     *
     * @param {IClientConnection} connection - The client connection object.
     * @param {CallError} message - The error message.
     * @return {void} This function doesn't return anything.
     */
    onCallError(connection: IClientConnection, message: CallError): void {
        this._router.routeCallError(connection, message);
    }

    /**
     * Sends a Call message to a charging station with given identifier.
     *
     * @param {string} identifier - The identifier of the charging station.
     * @param {Call} message - The Call message to send.
     * @return {Promise<boolean>} A promise that resolves to a boolean indicating if the call was sent successfully.
     */
    async sendCall(identifier: string, message: Call): Promise<boolean> {
        const messageId = message[1];
        const action = message[2] as CallAction;
        if (await this._cache.exists(identifier, CacheNamespace.Transactions)) {
            this._logger.info("Call already in progress, unable to send", identifier, message);
            return false;
        } else if (await this._sendCallIsAllowed(identifier, message)) {
            await this._cache.set(identifier, `${action}:${messageId}`, CacheNamespace.Transactions, this._config.websocketServer.maxCallLengthSeconds);
            // Intentionally removing NULL values from object for OCPP conformity
            const rawMessage = JSON.stringify(message, (k, v) => v ?? undefined);
            return this._sendMessage(identifier, rawMessage);
        } else {
            this._logger.info("RegistrationStatus Rejected, unable to send", identifier, message);
            return false;
        }
    }

    /**
     * Sends the CallResult to a charging station with given identifier.
     *
     * @param {string} identifier - The identifier of the charging station.
     * @param {CallResult} message - The CallResult message to send.
     * @return {Promise<boolean>} A promise that resolves to true if the call result was sent successfully, or false otherwise.
     */
    async sendCallResult(identifier: string, message: CallResult): Promise<boolean> {
        const messageId = message[1];
        const cachedActionMessageId = await this._cache.get<string>(identifier, CacheNamespace.Transactions);
        if (!cachedActionMessageId) {
            this._logger.error("Failed to send callResult due to missing message id", identifier, message);
            return false;
        }
        let [cachedAction, cachedMessageId] = cachedActionMessageId?.split(/:(.*)/); // Returns all characters after first ':' in case ':' is used in messageId
        if (cachedMessageId === messageId) {
            // Intentionally removing NULL values from object for OCPP conformity
            const rawMessage = JSON.stringify(message, (k, v) => v ?? undefined);
            return Promise.all([
                this._sendMessage(identifier, rawMessage),
                this._cache.remove(identifier, CacheNamespace.Transactions)
            ]).then(successes => successes.every(Boolean));
        } else {
            this._logger.error("Failed to send callResult due to mismatch in message id", identifier, cachedActionMessageId, message);
            return false;
        }

    }

    /**
     * Sends a CallError message to a charging station with given identifier.
     *
     * @param {string} identifier - The identifier of the charging station.
     * @param {CallError} message - The CallError message to send.
     * @return {Promise<boolean>} - A promise that resolves to true if the message was sent successfully.
     */
    sendCallError(identifier: string, message: CallError): Promise<boolean> {
        // Intentionally removing NULL values from object for OCPP conformity
        const rawMessage = JSON.stringify(message, (k, v) => v ?? undefined);
        return this._sendMessage(identifier, rawMessage);
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

    /**
     * Internal method to send a message to the charging station specified by the identifier.
     *
     * @param {string} identifier - The identifier of the client.
     * @param {string} message - The message to send.
     * @return {void} This function does not return anything.
     */
    private _sendMessage(identifier: string, message: string): Promise<boolean> {
        return this._getClientConnection(identifier).then(clientConnection => {
            if (clientConnection) {
                const websocketConnection = this._connections.get(identifier);
                if (websocketConnection && websocketConnection.readyState === WebSocket.OPEN) {
                    websocketConnection.send(message, (error) => {
                        if (error) {
                            this._logger.error("On message send error", error);
                        }
                    }); // TODO: Handle errors
                    // TODO: Embed error handling into websocket message flow
                    return true;
                } else {
                    this._logger.fatal("Websocket connection is not ready -", identifier);
                    websocketConnection?.close(1011, "Websocket connection is not ready - " + identifier);
                    return false;
                }
            } else {
                // This can happen when a charging station disconnects in the moment a message is trying to send.
                // Retry logic on the message sender might not suffice as charging station might connect to different instance.
                this._logger.error("Cannot identify client connection for", identifier);
                this._connections.get(identifier)?.close(1011, "Failed to get connection information for " + identifier);
                return false;
            }
        });
    }

    /**
     * Method to validate websocket upgrade requests and pass them to the socket server.
     * 
     * @param {IncomingMessage} req - The request object.
     * @param {Duplex} socket - Websocket duplex stream. 
     * @param {Buffer} head - Websocket buffer.
     */
    private async _upgradeRequest(req: http.IncomingMessage, socket: Duplex, head: Buffer) {
        // Validate username/password from authorization header
        // - The Authorization header is formatted as follows:
        // AUTHORIZATION: Basic <Base64 encoded(<Configured ChargingStationId>:<Configured BasicAuthPassword>)>
        this._logger.info("Upgrade request", req.url);
        const authHeader = req.headers.authorization;
        this._logger.info("Authorization header", req.headers.authorization);
        const [username, password] = Buffer.from(authHeader?.split(' ')[1] || '', 'base64').toString().split(':');
        this._logger.info("Username and password", username, password);

        if (username != this._getClientIdFromUrl(req.url as string) || await this._checkPassword(username, password) === false) {
            this._logger.info("Unauthorized");
            this._rejectUpgradeUnauthorized(socket);
        } else {
            this._socketServer.handleUpgrade(req, socket, head, (ws) => {
                this._socketServer.emit('connection', ws, req);
            });
        }
    }

    private async _checkPassword(username: string, password: string) {
        return (await this._deviceModelRepository.readAllByQuery({
            stationId: username,
            component_name: 'SecurityCtrlr',
            variable_name: 'BasicAuthPassword',
            type: AttributeEnumType.Actual
        }).then(r => {
            if (r && r[0]) {
                this._logger.info("BasicAuthPassword", r[0].value);
                // Grabbing value most recently *successfully* set on charger
                const hashedPassword = r[0].statuses?.filter(status => status.status !== SetVariableStatusEnumType.Rejected).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).shift();
                if (hashedPassword?.value) {
                    return bcrypt.compare(password, hashedPassword.value);
                }
            }
            this._logger.warn("Has no password", username);
            return false;
        }));
    }

    /**
     * Utility function to reject websocket upgrade requests with 401 status code.
     * @param socket - Websocket duplex stream.
     */
    private _rejectUpgradeUnauthorized(socket: Duplex) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n');
        socket.write('WWW-Authenticate: Basic realm="Access to the WebSocket", charset="UTF-8"\r\n');
        socket.write('\r\n');
        socket.end();
        socket.destroy();
    }

    /**
     * Internal method to handle new client connection and ensures supported protocols are used.
     *
     * @param {Set<string>} protocols - The set of protocols to handle.
     * @param {IncomingMessage} req - The request object.
     * @return {boolean|string} - Returns the protocol version if successful, otherwise false.
     */
    private _handleProtocols(protocols: Set<string>, req: http.IncomingMessage) {
        // Only supports configured protocol version
        if (protocols.has(this._config.websocketServer.protocol)) {

            // Get IP address of client
            const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.socket.remoteAddress || "N/A";
            const port = req.socket.remotePort as number;

            // Parse the path to get the client id
            const identifier = (req.url as string).split("/")[1];
            const clientConnection = new ClientConnection(identifier, uuidv4(), ip, port);
            clientConnection.isAlive = true;

            // Register client
            const registered = this._cache.setSync(clientConnection.identifier, JSON.stringify(instanceToPlain(clientConnection)), CacheNamespace.Connections);
            if (!registered) {
                this._logger.fatal("Failed to register websocket client", identifier, clientConnection);
                return false;
            } else {
                this._logger.debug("Successfully registered websocket client", identifier, clientConnection);
            }

            return this._config.websocketServer.protocol;
        }

        // Reject the client trying to connect
        return false;
    }

    /**
     * Internal method to handle the connection event when a WebSocket connection is established.
     * This happens after successful protocol exchange with client.
     *
     * @param {WebSocket} ws - The WebSocket object representing the connection.
     * @param {IncomingMessage} req - The request object associated with the connection.
     * @return {void}
     */
    private _onConnection(ws: WebSocket, req: http.IncomingMessage): void {

        const identifier = this._getClientIdFromUrl(req.url as string);
        this._connections.set(identifier, ws);

        // Pause the WebSocket event emitter until broker is established
        ws.pause();

        const clientConnection = this._cache.getSync<ClientConnection>(identifier, CacheNamespace.Connections, () => ClientConnection);
        if (!clientConnection) {
            this._logger.fatal("Failed to get client connection", identifier);
            ws.close(1011, "Failed to get connection information for " + identifier);
        } else {
            this._router.registerConnection(clientConnection).then((success) => {
                if (success) {
                    this._logger.info("Successfully connected new charging station.", identifier);

                    // Register all websocket events
                    this._registerWebsocketEvents(identifier, ws);

                    // Resume the WebSocket event emitter after events have been subscribed to
                    ws.resume();
                } else {
                    this._logger.fatal("Failed to subscribe to message broker for ", identifier);
                    ws.close(1011, "Failed to subscribe to message broker for " + identifier);
                }
            });
        }
    }

    /**
     * Internal method to register event listeners for the WebSocket connection.
     *
     * @param {string} identifier - The unique identifier for the connection.
     * @param {WebSocket} ws - The WebSocket object representing the connection.
     * @return {void} This function does not return anything.
     */
    private _registerWebsocketEvents(identifier: string, ws: WebSocket): void {

        ws.onerror = (event: ErrorEvent) => {
            this._logger.error("Connection error encountered for", identifier, event.error, event.message, event.type);
            this._getClientConnection(identifier).then(clientConnection => {
                if (clientConnection) {
                    clientConnection.isAlive = false;
                    this._cache.set(clientConnection.identifier, JSON.stringify(instanceToPlain(clientConnection)), CacheNamespace.Connections);
                }
            });
            ws.close(1011, event.message);
        };

        ws.onmessage = (event: MessageEvent) => {
            this._getClientConnection(identifier).then(clientConnection => {
                if (clientConnection) {
                    this._onMessage(clientConnection, event.data.toString());
                }
            });
        };

        ws.once("close", () => {
            // Unregister client
            this._logger.info("Connection closed for", identifier);
            this._cache.remove(identifier, CacheNamespace.Connections);
            this._connections.delete(identifier);
            this._router.handler.unsubscribe(identifier);
        });

        ws.on("pong", () => {
            this._logger.debug("Pong received for", identifier);
            this._getClientConnection(identifier).then(clientConnection => {
                if (clientConnection) {
                    clientConnection.isAlive = true;
                    this._cache.set(clientConnection.identifier, JSON.stringify(instanceToPlain(clientConnection)), CacheNamespace.Connections).then(() => {
                        this._ping(clientConnection.identifier, ws);
                    });
                }
            });
        });

        this._ping(identifier, ws);
    }

    /**
     * Internal method to handle the incoming message from the websocket client.
     *
     * @param {IClientConnection} client - The client connection object.
     * @param {string} message - The incoming message from the client.
     * @return {void} This function does not return anything.
     */
    private _onMessage(client: IClientConnection, message: string): void {
        let rpcMessage: any;
        let messageTypeId: MessageTypeId;
        let messageId: string = "0";
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
                    this.onCall(client, rpcMessage as Call);
                    break;
                case MessageTypeId.CallResult:
                    this.onCallResult(client, rpcMessage as CallResult);
                    break;
                case MessageTypeId.CallError:
                    this.onCallError(client, rpcMessage as CallError);
                    break;
                default:
                    throw new OcppError(messageId, ErrorCode.FormatViolation, "Unknown message type id: " + messageTypeId, {});
            }
        } catch (error) {
            this._logger.error("Error processing message:", message, error);
            if (error instanceof OcppError) {
                (error as OcppError).sendAsCallError(client.identifier, this);
            } else {
                this.sendCallError(client.identifier, [MessageTypeId.CallError, messageId, ErrorCode.InternalError, "Unable to process message", { error: error }]);
            }
            // TODO: Publish raw payload for error reporting
        }
    }

    /**
     * Internal method to handle the error event for the WebSocket server.
     *
     * @param {WebSocketServer} wss - The WebSocket server instance.
     * @param {Error} error - The error object.
     * @return {void} This function does not return anything.
     */
    private _onError(wss: WebSocketServer, error: Error): void {
        this._logger.error(error);
        // TODO: Try to recover the Websocket server
    }

    /**
     * Internal method to handle the event when the WebSocketServer is closed.
     *
     * @param {WebSocketServer} wss - The WebSocketServer instance.
     * @return {void} This function does not return anything.
     */
    private _onClose(wss: WebSocketServer): void {
        this._logger.debug("Websocket Server closed");
        // TODO: Try to recover the Websocket server
    }

    /**
     * Internal method to retrieve the client connection based on the provided identifier.
     *
     * @param {string} identifier - The identifier of the client connection.
     * @return {Promise<IClientConnection | null>} A promise that resolves to the client connection if found, otherwise null.
     */
    private _getClientConnection(identifier: string): Promise<IClientConnection | null> {
        return this._cache.get<ClientConnection>(identifier, CacheNamespace.Connections, () => ClientConnection);
    }

    /**
     * Internal method to execute a ping operation on a WebSocket connection after a delay of 60 seconds.
     *
     * @param {string} identifier - The identifier of the client connection.
     * @param {WebSocket} ws - The WebSocket connection to ping.
     * @return {void} This function does not return anything.
     */
    private _ping(identifier: string, ws: WebSocket): void {
        setTimeout(() => {
            this._getClientConnection(identifier).then(clientConnection => {
                if (clientConnection && clientConnection.isAlive) {
                    this._logger.debug("Pinging client", clientConnection.identifier);
                    // Set isAlive to false and send ping to client
                    clientConnection.isAlive = false;
                    this._cache.set(clientConnection.identifier, JSON.stringify(instanceToPlain(clientConnection)), CacheNamespace.Connections).then(() => {
                        ws.ping();
                    });
                } else {
                    ws.close(1011, "Client is not alive");
                }
            });
        }, this._config.websocketServer.pingInterval * 1000);
    }
    /**
     * 
     * @param url Http upgrade request url used by charger
     * @returns Charger identifier
     */
    private _getClientIdFromUrl(url: string): string {
        return url.split("/")[1];
    }

    private async _sendCallIsAllowed(identifier: string, message: Call): Promise<boolean> {
        const status = await this._cache.get<string>(ProvisioningModule.BOOT_STATUS, identifier);
        if (status == RegistrationStatusEnumType.Rejected &&
            // TriggerMessage<BootNotification> is the only message allowed to be sent during Rejected BootStatus B03.FR.08
            !(message[2] as CallAction == CallAction.TriggerMessage && (message[3] as TriggerMessageRequest).requestedMessage == MessageTriggerEnumType.BootNotification)) {
            return false;
        }
        return true;
    }
}