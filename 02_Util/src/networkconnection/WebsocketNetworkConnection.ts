// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable */
import type {
  IAuthenticator,
  ICache,
  IConnectionManager,
  IMessageRouter,
  INetworkConnection,
  IWebsocketConnection,
  OCPPVersionType,
  SystemConfig,
  WebsocketServerConfig,
} from '@citrineos/base';
import {
  CacheNamespace,
  createIdentifier,
  getCacheTenantPathMappingKey,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
} from '@citrineos/base';
import fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import { Duplex } from 'stream';
import type { SecureContextOptions } from 'tls';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { ErrorEvent, MessageEvent } from 'ws';
import { WebSocket, WebSocketServer } from 'ws';
import { UpgradeAuthenticationError } from './authenticator/errors/AuthenticationError.js';
import type { IUpgradeError } from './authenticator/errors/IUpgradeError.js';

export class WebsocketNetworkConnection implements INetworkConnection {
  protected _cache: ICache;
  protected _config: SystemConfig;
  protected _logger: Logger<ILogObj>;
  private _identifierConnections: Map<string, WebSocket> = new Map();
  private _pingTimers: Map<string, NodeJS.Timeout> = new Map();
  private _pongTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private _closeHandlers = new Map<string, () => void>();
  // tenantId as key and number of active connections as value
  private _tenantConnectionCounts: Map<number, number> = new Map();
  // websocketServers id as key and http server as value
  private _httpServersMap: Map<string, http.Server | https.Server>;
  private _authenticator: IAuthenticator;
  private _router: IMessageRouter;
  private _connectionManager?: IConnectionManager;
  private _doesChargingStationExistByStationId?: (
    tenantId: number,
    stationId: string,
  ) => Promise<boolean>;
  private _getMaxChargingStationsForTenant?: (tenantId: number) => Promise<number | null>;

  constructor(
    config: SystemConfig,
    cache: ICache,
    authenticator: IAuthenticator,
    router: IMessageRouter,
    logger?: Logger<ILogObj>,
    doesChargingStationExistByStationId?: (tenantId: number, stationId: string) => Promise<boolean>,
    getMaxChargingStationsForTenant?: (tenantId: number) => Promise<number | null>,
    connectionManager?: IConnectionManager,
  ) {
    this._getMaxChargingStationsForTenant = getMaxChargingStationsForTenant;
    this._cache = cache;
    this._config = config;
    this._doesChargingStationExistByStationId = doesChargingStationExistByStationId;
    this._connectionManager = connectionManager;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    this._authenticator = authenticator;
    router.networkHook = this.sendMessage.bind(this);
    this._router = router;

    this._httpServersMap = new Map<string, http.Server | https.Server>();
    this._config.util.networkConnection.websocketServers.forEach(async (websocketServerConfig) => {
      const _httpServer = await this._createAndStartWebsocketServer(websocketServerConfig);
      this._httpServersMap.set(websocketServerConfig.id, _httpServer);
    });
  }

  /**
   * Send a message to the charging station specified by the identifier.
   *
   * @param {string} identifier - The identifier of the client.
   * @param {string} message - The message to send.
   * @return {void} rejects the promise if message fails to send, otherwise returns void.
   */
  async sendMessage(identifier: string, message: string): Promise<void> {
    const clientConnection = await this._cache.get(identifier, CacheNamespace.Connections);
    if (!clientConnection) {
      const errorMsg = 'Cannot identify client connection for ' + identifier;
      // This can happen when a charging station disconnects in the moment a message is trying to send.
      // Retry logic on the message sender might not suffice as charging station might connect to different instance.
      this._logger.error(errorMsg);
      this._identifierConnections.get(identifier)?.terminate();
      throw new Error(errorMsg);
    }

    const websocketConnection = this._identifierConnections.get(identifier);
    if (!websocketConnection) {
      const errorMsg = 'Websocket connection not found for ' + identifier;
      this._logger.fatal(errorMsg);
      throw new Error(errorMsg);
    }

    if (websocketConnection.readyState !== WebSocket.OPEN) {
      const errorMsg = 'Websocket connection is not ready - ' + identifier;
      this._logger.fatal(errorMsg);
      websocketConnection.terminate();
      throw new Error(errorMsg);
    }

    return new Promise<void>((resolve, reject) => {
      websocketConnection.send(message, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  bindNetworkHook(): (identifier: string, message: string) => Promise<void> {
    return (identifier: string, message: string) => this.sendMessage(identifier, message);
  }

  async disconnect(tenantId: number, stationId: string): Promise<boolean> {
    const identifier = createIdentifier(tenantId, stationId);

    const websocketConnection = this._identifierConnections.get(identifier);

    if (!websocketConnection) {
      this._logger.warn(
        `No websocket connection found for tenantId ${tenantId} and stationId ${stationId}, will still deregister from router.`,
      );
    }
    websocketConnection?.close(1000, 'Disconnected by admin request');
    const deregistered = await this._router?.deregisterConnection(tenantId, stationId);

    return !!websocketConnection && deregistered;
  }

  async shutdown(): Promise<void> {
    // Deregister all connections before closing servers
    const websocketClosePromises = [];
    for (const [identifier, ws] of this._identifierConnections) {
      // Remove the listener so closing the socket doesn't trigger it
      const closeHandler = this._closeHandlers.get(identifier);
      if (closeHandler) {
        ws.removeListener('close', closeHandler);
        this._closeHandlers.delete(identifier);
      }

      ws.close(1001, 'Server shutting down');

      // Now manually call it and await it
      websocketClosePromises.push(this._handleWebsocketClose(identifier));
    }
    await Promise.all(websocketClosePromises);
    this._httpServersMap.forEach((server) => server.close());
  }

  /**
   * Updates certificates for a specific server with the provided TLS key, certificate chain, and optional
   * root CA.
   *
   * @param {string} serverId - The ID of the server to update.
   * @param {string} tlsKey - The TLS key to set.
   * @param {string} tlsCertificateChain - The TLS certificate chain to set.
   * @param {string} [rootCA] - The root CA to set (optional).
   * @return {void} void
   */
  updateTlsCertificates(
    serverId: string,
    tlsKey: string,
    tlsCertificateChain: string,
    rootCA?: string,
  ): void {
    let httpsServer = this._httpServersMap.get(serverId);

    if (httpsServer && httpsServer instanceof https.Server) {
      const secureContextOptions: SecureContextOptions = {
        key: tlsKey,
        cert: tlsCertificateChain,
      };
      if (rootCA) {
        secureContextOptions.ca = rootCA;
      }
      httpsServer.setSecureContext(secureContextOptions);
      this._logger.info(`Updated TLS certificates in SecureContextOptions for server ${serverId}`);
    } else {
      throw new TypeError(`Server ${serverId} is not a https server.`);
    }
  }

  /**
   * Dynamically adds a new websocket server at runtime and starts it.
   *
   * @param {WebsocketServerConfig} websocketServerConfig
   * @returns {Promise<void>}
   */
  async addWebsocketServer(websocketServerConfig: WebsocketServerConfig): Promise<void> {
    const httpServer = await this._createAndStartWebsocketServer(websocketServerConfig);
    this._httpServersMap.set(websocketServerConfig.id, httpServer);
  }

  private _onHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message: `Route ${req.method}:${req.url} not found`,
          error: 'Not Found',
          statusCode: 404,
        }),
      );
    }
  }

  /**
   * Method to validate websocket upgrade requests and pass them to the socket server.
   *
   * @param {IncomingMessage} req - The request object.
   * @param {Duplex} socket - Websocket duplex stream.
   * @param {Buffer} head - Websocket buffer.
   * @param {WebSocketServer} wss - Websocket server.
   * @param {WebsocketServerConfig} websocketServerConfig - websocket server config.
   */
  private async _upgradeRequest(
    req: http.IncomingMessage,
    socket: Duplex,
    head: Buffer,
    wss: WebSocketServer,
    websocketServerConfig: WebsocketServerConfig,
  ) {
    // Failed mTLS and TLS requests are rejected by the server before getting this far
    this._logger.debug(
      'On upgrade request',
      req.method,
      req.url,
      req.headers,
      websocketServerConfig,
    );

    if (this._connectionManager && !this._connectionManager.isConnected()) {
      this._logger.warn('Rejecting websocket upgrade: message broker is not connected.');
      this._terminateConnectionServiceUnavailable(socket);
      return;
    }

    try {
      // Resolve tenant at upgrade time (query param, path segment, header),
      // falling back to the server-configured tenant if none provided.
      const resolvedTenantId = websocketServerConfig.dynamicTenantResolution
        ? await this._extractTenantIdFromRequest(req, websocketServerConfig)
        : websocketServerConfig.tenantId;

      if (resolvedTenantId === undefined) {
        throw new UpgradeAuthenticationError(
          'Tenant resolution failed: no valid tenant path provided in request and server is not configured with a default tenantId',
        );
      }

      // Attach resolved tenant to request so downstream handlers (connection) can use it
      (req as any).__resolvedTenantId = resolvedTenantId;

      const { identifier } = await this._authenticator.authenticate(req, resolvedTenantId, {
        securityProfile: websocketServerConfig.securityProfile,
        allowUnknownChargingStations: websocketServerConfig.allowUnknownChargingStations,
        ignoreAuthenticationHeaders: websocketServerConfig.ignoreAuthenticationHeaders || false,
      });

      this._logger.debug('Successfully registered websocket client', identifier);

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } catch (error: any) {
      /**
       * See {@link IUpgradeError.terminateConnection}
       **/
      error?.terminateConnection?.(socket) || this._terminateConnectionInternalError(socket);
      this._logger.warn('Connection upgrade failed', error);
    }
  }

  /**
   * Utility function to reject websocket upgrade requests with 500 status code.
   * @param socket - Websocket duplex stream.
   */
  private _terminateConnectionInternalError(socket: Duplex) {
    socket.write('HTTP/1.1 500 Internal Server Error\r\n');
    socket.write('\r\n');
    socket.end();
    socket.destroy();
  }

  private _terminateConnectionServiceUnavailable(socket: Duplex) {
    socket.write('HTTP/1.1 503 Service Unavailable\r\n');
    socket.write('\r\n');
    socket.end();
    socket.destroy();
  }

  /**
   * Internal method to handle new client connection and ensures supported protocols are used.
   *
   * @param {Set<string>} protocols - The set of protocols to handle.
   * @param {IncomingMessage} _req - The request object.
   * @param {string} wsServerProtocol - The websocket server protocol.
   * @return {boolean|string} - Returns the protocol version if successful, otherwise false.
   */
  private _handleProtocols(
    protocols: Set<string>,
    _req: http.IncomingMessage,
    wsServerProtocols: OCPPVersionType[],
  ) {
    // Only supports configured protocol version
    for (const wsServerProtocol of wsServerProtocols) {
      if (protocols.has(wsServerProtocol)) {
        return wsServerProtocol;
      }
    }
    this._logger.error(
      `Protocol mismatch. Charger supports: [${[...protocols].join(', ')}], but server expects: '${wsServerProtocols.join(', ')}'.`,
    );
    // Reject the client trying to connect
    return false;
  }

  /**
   * Internal method to handle the connection event when a WebSocket connection is established.
   * This happens after successful protocol exchange with client.
   *
   * @param {WebSocket} ws - The WebSocket object representing the connection.
   * @param {WebsocketServerConfig} websocketServerConfig - The websocket server configuration.
   * @param {number} pingInterval - The ping interval in seconds.
   * @param {IncomingMessage} req - The request object associated with the connection.
   * @return {void}
   */
  private async _onConnection(
    ws: WebSocket,
    websocketServerConfig: WebsocketServerConfig,
    pingInterval: number,
    req: http.IncomingMessage,
  ): Promise<void> {
    if (!ws.protocol) {
      this._logger.warn('Websocket connection without protocol');
      ws.close(1002, 'Protocol not specified');
      return;
    } else {
      // Pause the WebSocket event emitter until broker is established
      ws.pause();

      const stationId = this._getClientIdFromUrl(req.url as string);
      // Prefer tenant resolved during upgrade; fallback to server-configured tenant.
      const tenantId = (req as any).__resolvedTenantId ?? websocketServerConfig.tenantId;

      const checker =
        this._doesChargingStationExistByStationId ??
        this._router.doesChargingStationExistByStationId?.bind(this._router);

      if (!checker) {
        throw new Error('No method available to check if charging station exists');
      }

      const exists = await checker(tenantId, stationId);

      if (!exists && !websocketServerConfig.allowUnknownChargingStations) {
        this._logger.error(
          'Rejecting connection: station %s not found in tenant %s',
          stationId,
          tenantId,
        );
        ws.close(1011, 'Unknown charging station');
        return;
      }

      const identifier = createIdentifier(tenantId, stationId);

      // Enforce per-tenant connection limit from the tenant's maxChargingStations field
      if (this._getMaxChargingStationsForTenant) {
        const maxConnections = await this._getMaxChargingStationsForTenant(tenantId);
        if (typeof maxConnections === 'number' && maxConnections > 0) {
          const currentCount = this._tenantConnectionCounts.get(tenantId) ?? 0;
          if (currentCount >= maxConnections) {
            this._logger.warn(
              `Tenant ${tenantId} exceeded max connections (${maxConnections}), rejecting ${identifier}`,
            );
            ws.close(1013, 'Tenant connection limit exceeded');
            return;
          }
        }
      }

      const staleWs = this._identifierConnections.get(identifier);
      if (staleWs) {
        staleWs.terminate();
        try {
          await this._router.deregisterConnection(tenantId, stationId);
        } catch (err) {
          this._logger.error(`Failed to deregister stale connection for ${identifier}`, err);
        }
        this._logger.warn(`Terminated stale websocket connection for ${identifier}`);
      }

      this._identifierConnections.set(identifier, ws);
      this._tenantConnectionCounts.set(
        tenantId,
        (this._tenantConnectionCounts.get(tenantId) ?? 0) + 1,
      );
      try {
        // Get IP address of client
        const ip =
          req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
          req.socket.remoteAddress ||
          'N/A';
        const port = req.socket.remotePort as number;
        const connLogger = this._logger.getSubLogger({
          name: `T${tenantId}:${stationId}`,
        });
        connLogger.info('Client websocket connected', identifier, ip, port, ws.protocol);

        // Register client
        const websocketConnection: IWebsocketConnection = {
          id: websocketServerConfig.id,
          protocol: ws.protocol,
        };
        let registered = await this._cache.set(
          identifier,
          JSON.stringify(websocketConnection),
          CacheNamespace.Connections,
          pingInterval * 3,
        );
        registered =
          registered && (await this._router.registerConnection(tenantId, stationId, ws.protocol));
        if (!registered) {
          connLogger.fatal('Failed to register websocket client', identifier);
          throw new Error('Failed to register websocket client');
        }

        connLogger.info(
          `Successfully connected new charging station: ${identifier} live connections: ${this._identifierConnections.size}`,
        );

        // Register all websocket events
        this._registerWebsocketEvents(identifier, ws, pingInterval);

        // Resume the WebSocket event emitter after events have been subscribed to
        ws.resume();
      } catch (error) {
        this._logger.fatal('Failed to subscribe to message broker for ', identifier);
        ws.close(1011, 'Failed to subscribe to message broker for ' + identifier);
      }
    }
  }

  /**
   * Internal method to register event listeners for the WebSocket connection.
   *
   * @param {string} identifier - The unique identifier of the connection, i.e. the combination of tenantId and stationId.
   * @param {WebSocket} ws - The WebSocket object representing the connection.
   * @param {number} pingInterval - The ping interval in seconds.
   * @return {void} This function does not return anything.
   */
  private _registerWebsocketEvents(identifier: string, ws: WebSocket, pingInterval: number): void {
    ws.onerror = (event: ErrorEvent) => {
      this._logger.error(
        'Connection error encountered for',
        identifier,
        event.error,
        event.message,
        event.type,
      );
      ws.close(1011, event.message);
    };
    ws.onmessage = (event: MessageEvent) => {
      this._onMessage(identifier, event.data.toString(), ws.protocol as OCPPVersionType);
    };

    const closeHandler = () => {
      this._handleWebsocketClose(identifier);
    };
    ws.once('close', closeHandler);
    this._closeHandlers.set(identifier, closeHandler);

    ws.on('ping', (message) => {
      this._logger.debug('Ping received for', identifier, 'with message', message);
      ws.pong(message);
    });

    ws.on('pong', () => {
      this._logger.debug('Pong received for', identifier);

      // Disarm the pong-timeout — the client is alive.
      const pongTimeout = this._pongTimeouts.get(identifier);
      if (pongTimeout) {
        clearTimeout(pongTimeout);
        this._pongTimeouts.delete(identifier);
      }

      this._ping(identifier, ws, pingInterval, false);
    });

    this._ping(identifier, ws, pingInterval, true);
  }

  /**
   * Internal method to handle the incoming message from the websocket client.
   *
   * @param {string} identifier - The client identifier.
   * @param {string} message - The incoming message from the client.
   * @param {OCPPVersionType} protocol - The OCPP protocol version of the client, 'ocpp1.6' or 'ocpp2.0.1'.
   * @return {void} This function does not return anything.
   */
  private _onMessage(identifier: string, message: string, protocol: OCPPVersionType): void {
    this._router.onMessage(identifier, message, new Date(), protocol);
  }

  private async _handleWebsocketClose(identifier: string): Promise<void> {
    this._closeHandlers.delete(identifier);
    // Cancel any pending ping timer so it doesn't fire against a closed socket
    const timer = this._pingTimers.get(identifier);
    if (timer) {
      clearTimeout(timer);
      this._pingTimers.delete(identifier);
    }
    const pongTimeout = this._pongTimeouts.get(identifier);
    if (pongTimeout) {
      clearTimeout(pongTimeout);
      this._pongTimeouts.delete(identifier);
    }

    const closedTenantId = getTenantIdFromIdentifier(identifier);

    // Unregister client
    await Promise.all([
      this._cache.remove(identifier, CacheNamespace.Connections),
      this._router.deregisterConnection(closedTenantId, getStationIdFromIdentifier(identifier)),
    ]);

    const prevCount = this._tenantConnectionCounts.get(closedTenantId) ?? 0;
    if (prevCount <= 1) {
      this._tenantConnectionCounts.delete(closedTenantId);
    } else {
      this._tenantConnectionCounts.set(closedTenantId, prevCount - 1);
    }
    this._identifierConnections.delete(identifier);
    this._logger.info(
      `Connection closed for ${identifier} live connections: ${this._identifierConnections.size}`,
    );
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
    this._logger.debug('Websocket Server closed');
    // TODO: Try to recover the Websocket server
  }

  /**
   * Internal method to execute a ping operation on a WebSocket connection after a delay of 60 seconds.
   *
   * @param {string} identifier - The identifier of the client connection.
   * @param {WebSocket} ws - The WebSocket connection to ping.
   * @param {number} pingInterval - The ping interval in seconds.
   * @param {boolean} applyJitter - Whether to apply jitter to the ping interval.
   * @return {void} This function does not return anything.
   */
  private _ping(
    identifier: string,
    ws: WebSocket,
    pingInterval: number,
    applyJitter: boolean,
  ): void {
    const jitter = applyJitter ? Math.random() * pingInterval * 1000 : 0;

    const sendTimer = setTimeout(
      () => {
        this._pingTimers.delete(identifier);

        const pongTimeout = setTimeout(() => {
          this._logger.debug('Pong timeout for', identifier, '— terminating');
          this._pongTimeouts.delete(identifier);
          ws.terminate();
        }, pingInterval * 1000);

        this._pongTimeouts.set(identifier, pongTimeout);

        this._logger.debug('Pinging client', identifier);
        ws.ping();
      },
      pingInterval * 1000 + jitter,
    );

    this._pingTimers.set(identifier, sendTimer);
    this._cache
      .updateExpiration(identifier, pingInterval * 3, CacheNamespace.Connections)
      .catch((error) => {
        this._logger.error(
          'Failed to update cache expiration - will close websocket for',
          identifier,
          error,
        );
        ws.close(1011, 'Failed to update cache expiration');
      });
  }
  /**
   *
   * @param url Http upgrade request url used by charger
   * @returns Charger identifier
   */
  private _getClientIdFromUrl(url: string): string {
    // Remove query string first
    const pathOnly = url.split('?')[0];
    return pathOnly.split('/').pop() as string;
  }

  /**
   * Extract tenant id from the incoming upgrade request.
   * Supported sources (in order): query `tenant`/`tenantId`, header `x-tenant-id`,
   * path segment (second-last segment if URL is `/tenant/station`).
   */
  private async _extractTenantIdFromRequest(
    req: http.IncomingMessage,
    config: WebsocketServerConfig,
  ): Promise<number | undefined> {
    try {
      const rawUrl = req.url ?? '';
      const url = new URL(rawUrl, 'http://localhost');
      const segments = url.pathname.split('/').filter(Boolean);

      // Path segment mapping: assume /.../{pathSegment}/{station}
      // We look for a mapping of pathSegment to tenantId.
      if (segments.length >= 2 && config.tenantPathMapping) {
        const pathSegment = segments[segments.length - 2];

        const cachedTenantIdString = await this._cache.get<string>(
          getCacheTenantPathMappingKey(config.id, pathSegment),
          CacheNamespace.TenantPathMapping,
        );
        if (!cachedTenantIdString) {
          this._logger.debug(`No mapping found for path segment: ${pathSegment}`);
        }
        return cachedTenantIdString ? Number(cachedTenantIdString) : undefined;
      }
    } catch (err) {
      // If parsing fails, ignore and fall back to server-configured tenant
      this._logger.debug('Failed to extract tenant from request', err);
    }
    return undefined;
  }

  private _generateServerOptions(config: WebsocketServerConfig): https.ServerOptions {
    const serverOptions: https.ServerOptions = {
      key: fs.readFileSync(config.tlsKeyFilePath as string),
      cert: fs.readFileSync(config.tlsCertificateChainFilePath as string),
    };

    if (config.rootCACertificateFilePath) {
      serverOptions.ca = fs.readFileSync(config.rootCACertificateFilePath as string);
    }

    if (config.securityProfile > 2) {
      serverOptions.requestCert = true;
      serverOptions.rejectUnauthorized = true;
    } else {
      serverOptions.rejectUnauthorized = false;
    }

    return serverOptions;
  }

  private _createAndStartWebsocketServer(
    wsConfig: WebsocketServerConfig,
  ): Promise<http.Server | https.Server> {
    for (const [key, value] of Object.entries(wsConfig.tenantPathMapping ?? {})) {
      this._cache.set(
        getCacheTenantPathMappingKey(wsConfig.id, key),
        value.toString(),
        CacheNamespace.TenantPathMapping,
      );
    }

    return new Promise((resolve) => {
      let httpServer: http.Server | https.Server;
      switch (wsConfig.securityProfile) {
        case 3: // mTLS
        case 2: // TLS
          httpServer = https.createServer(
            this._generateServerOptions(wsConfig),
            this._onHttpRequest.bind(this),
          );
          break;
        case 1:
        case 0:
        default:
          httpServer = http.createServer(this._onHttpRequest.bind(this));
          break;
      }

      const wss = new WebSocketServer({
        noServer: true,
        handleProtocols: (protocols, req) =>
          this._handleProtocols(protocols, req, wsConfig.protocols),
        clientTracking: false,
      });

      wss.on('connection', (ws, req) =>
        this._onConnection(ws, wsConfig, wsConfig.pingInterval, req),
      );
      wss.on('error', (server: any, error: any) => this._onError(server, error));
      wss.on('close', (server: any) => this._onClose(server));

      httpServer.on('upgrade', (req, socket, head) =>
        this._upgradeRequest(req, socket, head, wss, wsConfig),
      );
      httpServer.on('error', (error) => wss.emit('error', error));
      httpServer.on('close', () => wss.emit('close'));

      const protocol = wsConfig.securityProfile > 1 ? 'wss' : 'ws';
      httpServer.listen(wsConfig.port, wsConfig.host, () => {
        this._logger.info(
          `WebsocketServer running on ${protocol}://${wsConfig.host}:${wsConfig.port}/`,
        );
        resolve(httpServer);
      });
    });
  }
}
