// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
/* eslint-disable */

import { CacheNamespace, IAuthenticator, ICache, INetworkConnection, WebsocketServerConfig } from "@citrineos/base";
import { Duplex } from "stream";
import * as http from "http";
import * as https from "https";
import fs from "fs";
import { ErrorEvent, MessageEvent, WebSocket, WebSocketServer } from "ws";
import { Logger, ILogObj } from "tslog";

export class WebsocketNetworkConnection implements INetworkConnection {

    protected _cache: ICache;
    protected _configs: WebsocketServerConfig[];
    protected _logger: Logger<ILogObj>;
    private _identifierConnections: Map<string, WebSocket> = new Map();
    private _httpServers: (http.Server | https.Server)[];
    private _authenticator: IAuthenticator;
    private _onConnectionCallbacks: ((identifier: string, info?: Map<string, string>) => Promise<boolean>)[] = [];
    private _onCloseCallbacks: ((identifier: string, info?: Map<string, string>) => Promise<boolean>)[] = [];
    private _onMessageCallbacks: ((identifier: string, message: string, info?: Map<string, string>) => Promise<boolean>)[] = [];
    private _sentMessageCallbacks: ((identifier: string, message: string, error: any, info?: Map<string, string>) => Promise<boolean>)[] = [];

    constructor(
        websocketServerConfigs: WebsocketServerConfig[],
        cache: ICache,
        logger: Logger<ILogObj>,
        authenticator: IAuthenticator) {
        this._cache = cache;
        this._configs = websocketServerConfigs;
        this._logger = logger;
        this._authenticator = authenticator;

        this._httpServers = [];
        this._configs.forEach(websocketServerConfig => {
            let _httpServer;
            switch (websocketServerConfig.securityProfile) {
                case 3: // mTLS
                    _httpServer = https.createServer({
                        key: fs.readFileSync(websocketServerConfig.tlsKeysFilepath as string),
                        cert: fs.readFileSync(websocketServerConfig.tlsCertificateChainFilepath as string),
                        ca: fs.readFileSync(websocketServerConfig.mtlsCertificateAuthorityRootsFilepath as string),
                        requestCert: true,
                        rejectUnauthorized: true
                    }, this._onHttpRequest.bind(this));
                    break;
                case 2: // TLS
                    _httpServer = https.createServer({
                        key: fs.readFileSync(websocketServerConfig.tlsKeysFilepath as string),
                        cert: fs.readFileSync(websocketServerConfig.tlsCertificateChainFilepath as string)
                    }, this._onHttpRequest.bind(this));
                    break;
                case 1:
                case 0:
                default: // No TLS
                    _httpServer = http.createServer(this._onHttpRequest.bind(this));
                    break;
            }

            let _socketServer = new WebSocketServer({
                noServer: true,
                handleProtocols: (protocols, req) => this._handleProtocols(protocols, req, websocketServerConfig.protocol),
                clientTracking: false
            });

            _socketServer.on('connection', (ws: WebSocket, req: http.IncomingMessage) => this._onConnection(ws, websocketServerConfig.pingInterval, req));
            _socketServer.on('error', (wss: WebSocketServer, error: Error) => this._onError(wss, error));
            _socketServer.on('close', (wss: WebSocketServer) => this._onClose(wss));

            _httpServer.on('upgrade', (request, socket, head) =>
                this._upgradeRequest(request, socket, head, _socketServer, websocketServerConfig.id, websocketServerConfig.securityProfile));
            _httpServer.on('error', (error) => _socketServer.emit('error', error));
            // socketServer.close() will not do anything; use httpServer.close()
            _httpServer.on('close', () => _socketServer.emit('close'));
            const protocol = websocketServerConfig.securityProfile > 1 ? 'wss' : 'ws';
            _httpServer.listen(websocketServerConfig.port, websocketServerConfig.host, () => {
                this._logger.info(`WebsocketServer running on ${protocol}://${websocketServerConfig.host}:${websocketServerConfig.port}/`)
            });
            this._httpServers.push(_httpServer);
        });
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
     * Send a message to the charging station specified by the identifier.
     *
     * @param {string} identifier - The identifier of the client.
     * @param {string} message - The message to send.
     * @return {boolean} True if the method sends the message successfully, false otherwise.
     */
    sendMessage(identifier: string, message: string): Promise<boolean> {
        return this._cache.get(identifier, CacheNamespace.Connections).then(clientConnection => {
            if (clientConnection) {
                const websocketConnection = this._identifierConnections.get(identifier);
                if (websocketConnection && websocketConnection.readyState === WebSocket.OPEN) {
                    websocketConnection.send(message, (error) => {
                        if (error) {
                            this._logger.error("On message send error", error);
                        }
                        this._sentMessageCallbacks.forEach(callback => {
                            callback(identifier, message, error);
                        });
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
                this._identifierConnections.get(identifier)?.close(1011, "Failed to get connection information for " + identifier);
                return false;
            }
        });
    }

    shutdown(): void {
        this._httpServers.forEach(server => server.close());
    }

    private _onHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        if (req.method === "GET" && req.url == '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'healthy' }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Route ${req.method}:${req.url} not found`, error: "Not Found", statusCode: 404 }));
        }
    }

    /**
     * Method to validate websocket upgrade requests and pass them to the socket server.
     * 
     * @param {IncomingMessage} req - The request object.
     * @param {Duplex} socket - Websocket duplex stream. 
     * @param {Buffer} head - Websocket buffer.
     * @param {WebSocketServer} wss - Websocket server.
     * @param {number} securityProfile - The security profile to use for the websocket connection. See OCPP 2.0.1 Part 2-Specification A.1.3
     */
    private async _upgradeRequest(req: http.IncomingMessage, socket: Duplex, head: Buffer, wss: WebSocketServer, websocketId: string, securityProfile: number) {
        // Failed mTLS and TLS requests are rejected by the server before getting this far
        this._logger.debug("On upgrade request", req.method, req.url, req.headers);

        const identifier = this._getClientIdFromUrl(req.url as string);
        if (3 > securityProfile && securityProfile > 0) {
            // Validate username/password from authorization header
            // - The Authorization header is formatted as follows:
            // AUTHORIZATION: Basic <Base64 encoded(<Configured ChargingStationId>:<Configured BasicAuthPassword>)>
            const authHeader = req.headers.authorization;
            const [username, password] = Buffer.from(authHeader?.split(' ')[1] || '', 'base64').toString().split(':');
            if (username && password) {
                if (!(await this._authenticator.authenticate(identifier, username, password))) {
                    this._logger.warn("Unauthorized", identifier);
                    this._rejectUpgradeUnauthorized(socket);
                    return;
                }
            } else {
                this._logger.warn("Auth header missing or incorrectly formatted: ", JSON.stringify(authHeader));
                this._rejectUpgradeUnauthorized(socket);
                return;
            }
        }

        // Register client
        const registered = await this._cache.set(identifier, websocketId, CacheNamespace.Connections);
        if (!registered) {
            this._logger.fatal("Failed to register websocket client", identifier);
            return false;
        } else {
            this._logger.debug("Successfully registered websocket client", identifier);
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
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
     * @param {string} wsServerProtocol - The websocket server protocol.
     * @return {boolean|string} - Returns the protocol version if successful, otherwise false.
     */
    private _handleProtocols(protocols: Set<string>, req: http.IncomingMessage, wsServerProtocol: string) {
        // Only supports configured protocol version
        if (protocols.has(wsServerProtocol)) {
            return wsServerProtocol;
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
    private async _onConnection(ws: WebSocket, pingInterval: number, req: http.IncomingMessage): Promise<void> {
        // Pause the WebSocket event emitter until broker is established
        ws.pause();

        const identifier = this._getClientIdFromUrl(req.url as string);
        this._identifierConnections.set(identifier, ws);

        try {
            // Get IP address of client
            const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.socket.remoteAddress || "N/A";
            const port = req.socket.remotePort as number;

            await this._onConnectionCallbacks.forEach(async callback => {
                const info = new Map<string, string>([["ip", ip], ["port", port.toString()]]);
                await callback(identifier, info);
            });

            this._logger.info("Successfully connected new charging station.", identifier);

            // Register all websocket events
            this._registerWebsocketEvents(identifier, ws, pingInterval);

            // Resume the WebSocket event emitter after events have been subscribed to
            ws.resume();
        } catch (error) {
            this._logger.fatal("Failed to subscribe to message broker for ", identifier);
            ws.close(1011, "Failed to subscribe to message broker for " + identifier);
        }
    }

    /**
     * Internal method to register event listeners for the WebSocket connection.
     *
     * @param {string} identifier - The unique identifier for the connection.
     * @param {WebSocket} ws - The WebSocket object representing the connection.
     * @return {void} This function does not return anything.
     */
    private _registerWebsocketEvents(identifier: string, ws: WebSocket, pingInterval: number): void {

        ws.onerror = (event: ErrorEvent) => {
            this._logger.error("Connection error encountered for", identifier, event.error, event.message, event.type);
            ws.close(1011, event.message);
        };

        ws.onmessage = (event: MessageEvent) => {
            this._onMessage(identifier, event.data.toString());
        };

        ws.once("close", () => {
            // Unregister client
            this._logger.info("Connection closed for", identifier);
            this._cache.remove(identifier, CacheNamespace.Connections);
            this._identifierConnections.delete(identifier);
            this._onCloseCallbacks.forEach(callback => {
                callback(identifier);
            });
        });

        ws.on("pong", async () => {
            this._logger.debug("Pong received for", identifier);
            const clientConnection: string | null = await this._cache.get(identifier, CacheNamespace.Connections);

            if (clientConnection) {
                // Remove expiration for connection and send ping to client in pingInterval seconds.
                await this._cache.set(identifier, clientConnection, CacheNamespace.Connections);
                this._ping(identifier, ws, pingInterval);
            } else {
                this._logger.debug("Pong received for", identifier, "but client is not alive");
                ws.close(1011, "Client is not alive");
            }
        });

        this._ping(identifier, ws, pingInterval);
    }

    /**
     * Internal method to handle the incoming message from the websocket client.
     *
     * @param {string} identifier - The client identifier.
     * @param {string} message - The incoming message from the client.
     * @return {void} This function does not return anything.
     */
    private _onMessage(identifier: string, message: string): void {
        this._onMessageCallbacks.forEach(callback => {
            callback(identifier, message);
        });
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
     * Internal method to execute a ping operation on a WebSocket connection after a delay of 60 seconds.
     *
     * @param {string} identifier - The identifier of the client connection.
     * @param {WebSocket} ws - The WebSocket connection to ping.
     * @param {number} pingInterval - The ping interval in milliseconds.
     * @return {void} This function does not return anything.
     */
    private async _ping(identifier: string, ws: WebSocket, pingInterval: number): Promise<void> {
        setTimeout(async () => {
            const clientConnection: string | null = await this._cache.get(identifier, CacheNamespace.Connections);
            if (clientConnection) {
                this._logger.debug("Pinging client", identifier);
                // Set connection expiration and send ping to client
                await this._cache.set(identifier, clientConnection, CacheNamespace.Connections, pingInterval * 2);
                ws.ping();
            } else {
                ws.close(1011, "Client is not alive");
            }
        }, pingInterval * 1000);
    }
    /**
     * 
     * @param url Http upgrade request url used by charger
     * @returns Charger identifier
     */
    private _getClientIdFromUrl(url: string): string {
        return url.split("/")[1];
    }
}