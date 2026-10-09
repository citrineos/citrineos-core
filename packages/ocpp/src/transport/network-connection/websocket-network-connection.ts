// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable */

import {
  type IAuthenticator,
  type ICache,
  type IConnectionManager,
  type IFileStorage,
  type IMessageRouter,
  type INetworkConnection,
  type IWebsocketConnection,
  CacheNamespace,
  ConfigLoader,
  createIdentifier,
  DEFAULT_TENANT_ID,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
} from '@citrineos/base';
import type { OCPPVersionType, SystemConfig, WebsocketServerConfig } from '@citrineos/types';
import { MessageOrigin, TENANT_WEBSOCKET_SERVER_PATH_PATTERN } from '@citrineos/types';
import * as http from 'http';
import * as https from 'https';
import { hostname } from 'node:os';
import { performance } from 'node:perf_hooks';
import { Duplex } from 'stream';
import type { SecureContextOptions } from 'tls';
import * as tls from 'tls';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { ErrorEvent, MessageEvent } from 'ws';
import { WebSocket, WebSocketServer } from 'ws';
import {
  initWsTransportMetrics,
  recordWsActiveConnectionsDelta,
  recordWsConnectionClosed,
  recordWsConnectionEstablished,
  recordWsConnectionRejected,
  recordWsConnectionSetupDuration,
  recordWsSendFailure,
  recordWsTlsHandshakeFailure,
  recordWsUpgrade,
  WsRejectReason,
  WsSendFailureReason,
  WsUpgradeResult,
} from '../metrics.js';
import { buildWebsocketLifecycleEvent } from '../queue/rabbit-mq/messages/messages-event-builder.js';
import type { MessagesExchangeSink } from '../queue/rabbit-mq/messages/messages-exchange-sink.js';
import { UpgradeAuthenticationError } from './authenticator/errors/authentication-error.js';
import { type IUpgradeError, isUpgradeError } from './authenticator/errors/i-upgrade-error.js';
import { UpgradeUnknownError } from './authenticator/errors/unknown-error.js';
import { ConnectionNotFoundError } from './connection-not-found-error.js';
import { TlsCredentialManager } from './tls-certificate-manager.js';
import {
  type CloseContext,
  type LifecycleEventFields,
  type SocketInfo,
  WsEventSource,
} from './types.js';
import { errorCodeOf, errorMessageOf, getClientIdFromUrl, remoteAddressOf, uriOf } from './util.js';

export class WebsocketNetworkConnection implements INetworkConnection {
  protected _cache: ICache;
  protected _config: SystemConfig;
  protected _websocketServers: WebsocketServerConfig[] = [];
  protected _logger: Logger<ILogObj>;
  private _identifierConnections: Map<string, WebSocket> = new Map();
  private _pingTimers: Map<string, NodeJS.Timeout> = new Map();
  private _pongTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private _closeHandlers = new Map<
    string,
    (code: number, reason: Buffer<ArrayBufferLike>) => void
  >();
  // tenantId as key and number of active connections as value
  private _tenantConnectionCounts: Map<number, number> = new Map();
  // websocketServers id as key and http server as value
  private _httpServersMap: Map<string, http.Server | https.Server> = new Map();
  // websocketServers id as key and tls credential manager as value
  private _certManagersMap: Map<string, TlsCredentialManager> = new Map();
  // Keyed by socket rather than identifier, so a replacement connection never inherits these.
  private _socketInfo = new WeakMap<WebSocket, SocketInfo>();
  private _closeContexts = new WeakMap<WebSocket, CloseContext>();
  private _resolvedTenantIds = new WeakMap<http.IncomingMessage, number>();
  private readonly _host = hostname();
  private _authenticator: IAuthenticator;
  private _router: IMessageRouter;
  private _messagesExchangeSink: MessagesExchangeSink;
  private _connectionManager?: IConnectionManager;
  private _fileStorage: IFileStorage;
  private _doesChargingStationExistByOcppConnectionName?: (
    tenantId: number,
    ocppConnectionName: string,
  ) => Promise<boolean>;
  private _getMaxChargingStationsForTenant?: (tenantId: number) => Promise<number | null>;
  private _getTenantIdByWebsocketServerPath?: (path: string) => Promise<number | undefined>;
  private _getAllTenantWebsocketServerPaths?: () => Promise<Map<string, number>>;

  constructor({
    config,
    cache,
    authenticator,
    router,
    fileStorage,
    logger,
    doesChargingStationExistByOcppConnectionName,
    getMaxChargingStationsForTenant,
    getTenantIdByWebsocketServerPath,
    getAllTenantWebsocketServerPaths,
    connectionManager,
    messagesExchangeSink,
  }: {
    config: SystemConfig;
    cache: ICache;
    authenticator: IAuthenticator;
    router: IMessageRouter;
    fileStorage: IFileStorage;
    logger: Logger<ILogObj>;
    doesChargingStationExistByOcppConnectionName: (
      tenantId: number,
      ocppConnectionName: string,
    ) => Promise<boolean>;
    getMaxChargingStationsForTenant: (tenantId: number) => Promise<number | null>;
    getTenantIdByWebsocketServerPath: (path: string) => Promise<number | undefined>;
    getAllTenantWebsocketServerPaths: () => Promise<Map<string, number>>;
    connectionManager: IConnectionManager;
    messagesExchangeSink: MessagesExchangeSink;
  }) {
    this._messagesExchangeSink = messagesExchangeSink;
    this._getMaxChargingStationsForTenant = getMaxChargingStationsForTenant;
    this._getTenantIdByWebsocketServerPath = getTenantIdByWebsocketServerPath;
    this._getAllTenantWebsocketServerPaths = getAllTenantWebsocketServerPaths;
    this._cache = cache;
    this._config = config;
    this._doesChargingStationExistByOcppConnectionName =
      doesChargingStationExistByOcppConnectionName;
    this._connectionManager = connectionManager;
    this._fileStorage = fileStorage;
    this._logger = logger.getSubLogger({ name: this.constructor.name });
    this._authenticator = authenticator;
    router.networkHook = this.sendMessage.bind(this);
    this._router = router;
  }

  public async initialize(): Promise<void> {
    initWsTransportMetrics();

    this._websocketServers = await ConfigLoader.loadWebsocketServersConfig(
      this._fileStorage,
      this._config.websocketServerConfigFile,
    );
    if (
      this._websocketServers.some(
        (websocketServerConfig) => websocketServerConfig.dynamicTenantResolution,
      )
    ) {
      this._warmTenantPathCache();
    }

    for (const websocketServerConfig of this._websocketServers) {
      const _httpServer = await this._createAndStartWebsocketServer(websocketServerConfig);
      this._httpServersMap.set(websocketServerConfig.id, _httpServer);
    }
  }

  public getWebsocketServers(): WebsocketServerConfig[] {
    return this._websocketServers;
  }

  public async saveWebsocketServersConfig(
    websocketServers: WebsocketServerConfig[],
  ): Promise<void> {
    try {
      await ConfigLoader.saveWebsocketServersConfig(
        this._fileStorage,
        this._config.websocketServerConfigFile,
        websocketServers,
      );
    } catch (error) {
      this._logger.error('Failed to save websocket servers config', error);
    }
  }

  /**
   * Reloads the TLS certificates (from disk) for the websocket server with the given ID.
   * This is useful when certificates are renewed and need to be updated without restarting the server.
   *
   * @param serverId websocketServerConfig.id
   */
  public async reloadTlsCertificates(serverId: string): Promise<void> {
    const certManager = this._certManagersMap.get(serverId);
    if (certManager) {
      await certManager.reload();
      const httpsServer = this._httpServersMap.get(serverId);
      if (httpsServer instanceof https.Server) {
        const { key, cert, ca } = await certManager.getCredentials();
        httpsServer.setSecureContext({ key, cert, ca });
      }
    } else {
      this._logger.error(`No TLS Credential Manager found for server ${serverId}`);
      throw new Error(`No TLS Credential Manager found for server ${serverId}`);
    }
  }

  /**
   * Send a message to the charging station specified by the identifier.
   *
   * @param {string} identifier - The identifier of the client.
   * @param {string} message - The message to send.
   * @return {void} rejects the promise if message fails to send, otherwise returns void.
   */
  async sendMessage(identifier: string, message: string): Promise<void> {
    const connLogger = this._connLogger(identifier);
    const clientConnection = await this._cache.get(identifier, CacheNamespace.Connections);
    if (!clientConnection) {
      const errorMsg = 'Cannot identify client connection for ' + identifier;
      // This can happen when a charging station disconnects in the moment a message is trying to send.
      // Retry logic on the message sender might not suffice as charging station might connect to different instance.
      connLogger.error(errorMsg);
      const orphanedWs = this._identifierConnections.get(identifier);
      if (orphanedWs) {
        this._terminateWith(orphanedWs, WsSendFailureReason.NoCache);
      }
      recordWsSendFailure(WsSendFailureReason.NoCache);
      throw new Error(errorMsg);
    }

    const websocketConnection = this._identifierConnections.get(identifier);
    if (!websocketConnection) {
      const error = new ConnectionNotFoundError(identifier);
      connLogger.warn(error.message);
      recordWsSendFailure(WsSendFailureReason.NoSocket);
      throw error;
    }

    if (websocketConnection.readyState !== WebSocket.OPEN) {
      const errorMsg = 'Websocket connection is not ready - ' + identifier;
      connLogger.fatal(errorMsg);
      this._terminateWith(websocketConnection, WsSendFailureReason.NotOpen);
      recordWsSendFailure(WsSendFailureReason.NotOpen);
      throw new Error(errorMsg);
    }

    return new Promise<void>((resolve, reject) => {
      websocketConnection.send(message, (error) => {
        if (error) {
          recordWsSendFailure(WsSendFailureReason.SendError);
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

  /**
   * Creates a per-connection sub-logger scoped to the identifier
   * (`${tenantId}:${ocppConnectionName}`). Used by entry points that only have
   * an identifier; the connection lifecycle otherwise threads a single logger
   * through {@link _registerWebsocketEvents}, {@link _ping} and
   * {@link _handleWebsocketClose}.
   */
  private _connLogger(identifier: string): Logger<ILogObj> {
    return this._logger.getSubLogger({ name: identifier });
  }

  async disconnect(tenantId: number, ocppConnectionName: string): Promise<boolean> {
    const identifier = createIdentifier(tenantId, ocppConnectionName);

    const websocketConnection = this._identifierConnections.get(identifier);

    if (!websocketConnection) {
      this._connLogger(identifier).warn(
        `No websocket connection found for tenantId ${tenantId} and ocppConnectionName ${ocppConnectionName}, will still deregister from router.`,
      );
      await this._router?.deregisterConnection(tenantId, ocppConnectionName);
      return false;
    }

    // Clean up now instead of waiting on the station's reply to the close frame, which also
    // keeps the close listener from deregistering a second time.
    this._detachCloseHandler(identifier, websocketConnection);
    this._closeWith(
      websocketConnection,
      WsEventSource.AdminDisconnect,
      1000,
      'Disconnected by admin request',
    );
    return this._handleWebsocketClose(
      identifier,
      websocketConnection,
      1000,
      'Disconnected by admin request',
    );
  }

  async shutdown(): Promise<void> {
    // Deregister all connections before closing servers
    const websocketClosePromises = [];
    for (const [identifier, ws] of this._identifierConnections) {
      // Remove the listener so closing the socket doesn't trigger it
      this._detachCloseHandler(identifier, ws);

      this._closeWith(ws, WsEventSource.ServerShutdown, 1001, 'Server shutting down');

      // Now manually call it and await it
      websocketClosePromises.push(
        this._handleWebsocketClose(identifier, ws, 1001, 'Server shutting down'),
      );
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

  getHttpServers(): ReadonlyMap<string, http.Server | https.Server> {
    return this._httpServersMap;
  }

  private _onHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        message: `Route ${req.method}:${req.url} not found`,
        error: 'Not Found',
        statusCode: 404,
      }),
    );
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
      recordWsUpgrade(WsUpgradeResult.BrokerUnavailable);
      this._terminateConnectionServiceUnavailable(socket);
      return;
    }

    let resolvedTenantId: number | undefined;
    try {
      // Resolve tenant at upgrade time (query param, path segment, header),
      // falling back to the server-configured tenant if none provided.
      resolvedTenantId = websocketServerConfig.dynamicTenantResolution
        ? await this._extractTenantIdFromRequest(req)
        : websocketServerConfig.tenantId;

      if (resolvedTenantId === undefined) {
        throw new UpgradeAuthenticationError(
          'Tenant resolution failed: no valid tenant path provided in request and server is not configured with a default tenantId',
        );
      }

      // Attach resolved tenant to request so downstream handlers (connection) can use it
      this._resolvedTenantIds.set(req, resolvedTenantId);

      const { identifier } = await this._authenticator.authenticate(req, resolvedTenantId, {
        securityProfile: websocketServerConfig.securityProfile,
        allowUnknownChargingStations: websocketServerConfig.allowUnknownChargingStations,
        ignoreAuthenticationHeaders: websocketServerConfig.ignoreAuthenticationHeaders || false,
      });

      this._connLogger(createIdentifier(resolvedTenantId, identifier)).debug(
        'Successfully registered websocket client',
        identifier,
      );

      wss.handleUpgrade(req, socket, head, (ws) => {
        recordWsUpgrade(WsUpgradeResult.Upgraded);
        wss.emit('connection', ws, req);
      });
    } catch (error: unknown) {
      const upgradeResult =
        error instanceof UpgradeAuthenticationError
          ? WsUpgradeResult.AuthFailed
          : error instanceof UpgradeUnknownError
            ? WsUpgradeResult.UnknownStation
            : WsUpgradeResult.InternalError;
      recordWsUpgrade(upgradeResult);
      /**
       * See {@link IUpgradeError.terminateConnection}
       **/
      let httpStatus = 500;
      if (isUpgradeError(error) && error.terminateConnection(socket)) {
        httpStatus = error.statusCode;
      } else {
        this._terminateConnectionInternalError(socket);
      }
      this._logger.warn('Connection upgrade failed', error);
      this._emitLifecycleEvent({
        type: 'UpgradeRejected',
        tenantId: resolvedTenantId ?? DEFAULT_TENANT_ID,
        ...this._requestFields(req, websocketServerConfig),
        httpStatus,
        initiator: MessageOrigin.ChargingStationManagementSystem,
        source: upgradeResult,
        details: { error: errorMessageOf(error) },
      });
    }
  }

  /**
   * Answers a handshake `ws` rejected on its own (bad method, Upgrade, key, version or
   * extensions header). Listening for `wsClientError` makes writing that response our job; this
   * writes the same one `ws` would.
   */
  private _onInvalidHandshake(
    error: Error,
    socket: Duplex,
    req: http.IncomingMessage,
    websocketServerConfig: WebsocketServerConfig,
  ): void {
    const httpStatus = req.method === 'GET' ? 400 : 405;
    const version = Number(req.headers['sec-websocket-version']);
    const headers: Record<string, string> = {
      Connection: 'close',
      'Content-Type': 'text/html',
      'Content-Length': String(Buffer.byteLength(error.message)),
      ...(version !== 13 && version !== 8 ? { 'Sec-WebSocket-Version': '13, 8' } : {}),
    };
    socket.once('finish', () => socket.destroy());
    socket.end(
      `HTTP/1.1 ${httpStatus} ${http.STATUS_CODES[httpStatus]}\r\n` +
        Object.entries(headers)
          .map(([name, value]) => `${name}: ${value}`)
          .join('\r\n') +
        '\r\n\r\n' +
        error.message,
    );

    this._logger.warn('Invalid websocket handshake', error.message);
    recordWsUpgrade(WsUpgradeResult.InvalidHandshake);
    this._emitLifecycleEvent({
      type: 'UpgradeRejected',
      tenantId: this._tenantIdOf(req, websocketServerConfig),
      ...this._requestFields(req, websocketServerConfig),
      httpStatus,
      initiator: MessageOrigin.ChargingStationManagementSystem,
      source: WsUpgradeResult.InvalidHandshake,
      details: { error: error.message },
    });
  }

  /**
   * A TLS handshake failed — including a client certificate rejected under security profile 3 —
   * so no HTTP request, and no station identifier, ever arrived.
   */
  private _onTlsClientError(
    error: Error,
    tlsSocket: tls.TLSSocket,
    websocketServerConfig: WebsocketServerConfig,
  ): void {
    this._logger.warn('TLS handshake failed', tlsSocket.remoteAddress, error.message);
    recordWsTlsHandshakeFailure(websocketServerConfig.id, errorCodeOf(error));
    this._emitLifecycleEvent({
      type: 'UpgradeRejected',
      tenantId: websocketServerConfig.tenantId ?? DEFAULT_TENANT_ID,
      serverId: websocketServerConfig.id,
      remoteAddress: tlsSocket.remoteAddress,
      source: WsEventSource.TlsHandshakeFailed,
      details: {
        error: error.message,
        code: errorCodeOf(error),
        ...(typeof tlsSocket.servername === 'string' ? { servername: tlsSocket.servername } : {}),
      },
    });
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
    forceProtocol?: OCPPVersionType,
  ) {
    // Mainly for dev purposes. Sets a specific protocol to be used instead of determining based on the lists of protocols from both ends
    if (forceProtocol) {
      if (
        protocols.has(forceProtocol) &&
        wsServerProtocols.find((webServerProtocol) => webServerProtocol === forceProtocol)
      ) {
        return forceProtocol;
      }

      this._logger.error(
        `Forced protocol version '${forceProtocol}' is not supported by the current charger and server communication. Charger supports: [${[...protocols].join(', ')}] and server expects '${wsServerProtocols.join(', ')}'.`,
      );
      return false;
    }

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
    // Measures the full "all the way" establishment: station check -> tenant
    // limit -> cache slot claim -> router register -> broker subscribe.
    const setupStart = performance.now();
    if (!ws.protocol) {
      this._logger.warn('Websocket connection without protocol');
      // handleProtocols returning false still completes the upgrade, so a protocol mismatch
      // surfaces here rather than as a refused upgrade.
      this._rejectConnection(
        ws,
        req,
        websocketServerConfig,
        this._tenantIdOf(req, websocketServerConfig),
        WsRejectReason.NoProtocol,
        1002,
        'Protocol not specified',
        {
          offeredProtocols: req.headers['sec-websocket-protocol'],
          serverProtocols: websocketServerConfig.protocols,
          forceProtocol: websocketServerConfig.forceProtocol,
        },
      );
      return;
    } else {
      // Pause the WebSocket event emitter until broker is established
      ws.pause();

      const ocppConnectionName = getClientIdFromUrl(req.url as string);
      // Prefer tenant resolved during upgrade; fallback to server-configured tenant.
      const tenantId = this._resolvedTenantIds.get(req) ?? websocketServerConfig.tenantId;
      if (tenantId === undefined) {
        // Unreachable while _upgradeRequest refuses any upgrade it could not resolve a tenant for.
        this._logger.error('Rejecting connection: no tenant was resolved during upgrade');
        this._rejectConnection(
          ws,
          req,
          websocketServerConfig,
          DEFAULT_TENANT_ID,
          WsRejectReason.ConnectionFailed,
          1011,
          'Tenant not resolved',
        );
        return;
      }
      const identifier = createIdentifier(tenantId, ocppConnectionName);
      const connLogger = this._connLogger(identifier);

      const checker =
        this._doesChargingStationExistByOcppConnectionName ??
        this._router.doesChargingStationExistByOcppConnectionName?.bind(this._router);

      if (!checker) {
        throw new Error('No method available to check if charging station exists');
      }

      const exists = await checker(tenantId, ocppConnectionName);

      if (!exists && !websocketServerConfig.allowUnknownChargingStations) {
        connLogger.error('Rejecting connection: station not found in tenant');
        this._rejectConnection(
          ws,
          req,
          websocketServerConfig,
          tenantId,
          WsRejectReason.UnknownStation,
          1011,
          'Unknown charging station',
        );
        return;
      }

      // Enforce per-tenant connection limit from the tenant's maxChargingStations field
      if (this._getMaxChargingStationsForTenant) {
        const maxConnections = await this._getMaxChargingStationsForTenant(tenantId);
        if (typeof maxConnections === 'number' && maxConnections > 0) {
          const currentCount = this._tenantConnectionCounts.get(tenantId) ?? 0;
          if (currentCount >= maxConnections) {
            connLogger.warn(`Tenant exceeded max connections (${maxConnections}), rejecting`);
            this._rejectConnection(
              ws,
              req,
              websocketServerConfig,
              tenantId,
              WsRejectReason.TenantLimit,
              1013,
              'Tenant connection limit exceeded',
              { maxConnections },
            );
            return;
          }
        }
      }

      const staleWs = this._identifierConnections.get(identifier);
      if (staleWs) {
        // Detach the close listener so the async close event doesn't race with
        // the new connection's state; drive cleanup synchronously below.
        this._detachCloseHandler(identifier, staleWs);
        this._terminateWith(staleWs, WsEventSource.ReplacedByNewConnection);
        await this._handleWebsocketClose(
          identifier,
          staleWs,
          1006,
          'Replaced by new connection',
          connLogger,
        );
        connLogger.warn(`Terminated stale websocket connection`);
      }

      try {
        const ip = remoteAddressOf(req) || 'N/A';
        const port = req.socket.remotePort as number;
        connLogger.info('Client websocket connected', identifier, ip, port, ws.protocol);

        const websocketConnection: IWebsocketConnection = {
          id: websocketServerConfig.id,
          timeConnected: new Date().toISOString(),
          protocol: ws.protocol,
          allowUnknownChargingStations: websocketServerConfig.allowUnknownChargingStations,
        };
        const claimed = await this._cache.setIfNotExist(
          identifier,
          JSON.stringify(websocketConnection),
          CacheNamespace.Connections,
          pingInterval * 3,
        );
        if (!claimed) {
          connLogger.warn(
            `Connection slot already held for ${identifier}, rejecting new connection`,
          );
          this._rejectConnection(
            ws,
            req,
            websocketServerConfig,
            tenantId,
            WsRejectReason.SlotTaken,
            1013,
            'Already connected on another instance',
          );
          return;
        }

        this._identifierConnections.set(identifier, ws);
        const registered = await this._router.registerConnection(
          tenantId,
          ocppConnectionName,
          ws.protocol,
          websocketServerConfig.id,
        );
        if (!registered) {
          this._identifierConnections.delete(identifier);
          connLogger.fatal('Failed to register websocket client', identifier);
          await this._cache.remove(identifier, CacheNamespace.Connections).catch((err) => {
            connLogger.error(`Failed to remove connection string ${identifier} from cache`, err);
          });
          this._rejectConnection(
            ws,
            req,
            websocketServerConfig,
            tenantId,
            WsRejectReason.RegisterFailed,
            1011,
            'Failed to register connection in message router',
          );
          return;
        }

        const socketInfo: SocketInfo = {
          serverId: websocketServerConfig.id,
          remoteAddress: remoteAddressOf(req),
          uri: uriOf(req),
        };
        this._socketInfo.set(ws, socketInfo);
        this._identifierConnections.set(identifier, ws);
        this._tenantConnectionCounts.set(
          tenantId,
          (this._tenantConnectionCounts.get(tenantId) ?? 0) + 1,
        );

        // Register all websocket events
        this._registerWebsocketEvents(identifier, ws, pingInterval, connLogger);

        // Connection is now fully established "all the way".
        recordWsConnectionEstablished(ws.protocol);
        recordWsActiveConnectionsDelta(1);
        recordWsConnectionSetupDuration((performance.now() - setupStart) / 1000, ws.protocol);

        connLogger.info(
          `Successfully connected new charging station, live connections: ${this._identifierConnections.size}`,
        );
        this._emitLifecycleEvent({
          type: 'Open',
          tenantId,
          ocppConnectionName,
          ...socketInfo,
          subprotocol: ws.protocol,
        });
        // Resume the WebSocket event emitter after events have been subscribed to
        ws.resume();
      } catch (error) {
        if (this._identifierConnections.get(identifier) === ws) {
          this._identifierConnections.delete(identifier);
        }
        connLogger.fatal('Failed to connect', error);
        if (this._closeHandlers.has(identifier)) {
          // The close listener is already attached, so the Close event reports this one.
          recordWsConnectionRejected(WsRejectReason.ConnectionFailed);
          ws.resume();
          this._closeWith(ws, WsRejectReason.ConnectionFailed, 1011, 'Failed to set up connection');
        } else {
          this._rejectConnection(
            ws,
            req,
            websocketServerConfig,
            tenantId,
            WsRejectReason.ConnectionFailed,
            1011,
            'Failed to set up connection',
            { error: errorMessageOf(error) },
          );
        }
      }
    }
  }

  /**
   * Rejects a connection whose setup threw before reaching {@link _onConnection}'s own guard —
   * reading the identifier, the station lookup, the tenant limit — which would otherwise leave
   * the socket paused and open with nothing listening to it.
   */
  private _onConnectionSetupFailed(
    ws: WebSocket,
    req: http.IncomingMessage,
    websocketServerConfig: WebsocketServerConfig,
    error: unknown,
  ): void {
    this._logger.fatal('Failed to set up connection', error);
    this._rejectConnection(
      ws,
      req,
      websocketServerConfig,
      this._tenantIdOf(req, websocketServerConfig),
      WsRejectReason.ConnectionFailed,
      1011,
      'Failed to set up connection',
      { error: errorMessageOf(error) },
    );
  }

  /**
   * Internal method to register event listeners for the WebSocket connection.
   *
   * @param {string} identifier - The unique identifier of the connection, i.e. the combination of tenantId and ocppConnectionName.
   * @param {WebSocket} ws - The WebSocket object representing the connection.
   * @param {number} pingInterval - The ping interval in seconds.
   * @param {Logger<ILogObj>} connLogger - The per-connection sub-logger.
   * @return {void} This function does not return anything.
   */
  private _registerWebsocketEvents(
    identifier: string,
    ws: WebSocket,
    pingInterval: number,
    connLogger: Logger<ILogObj>,
  ): void {
    ws.onerror = (event: ErrorEvent) => {
      connLogger.error(
        'Connection error encountered for',
        identifier,
        event.error,
        event.message,
        event.type,
      );

      const closeContext = this._closeContexts.get(ws);
      this._closeContexts.set(ws, {
        source: closeContext?.source ?? WsEventSource.FrameError,
        sentCode: closeContext?.sentCode,
        error: { message: event.message, code: errorCodeOf(event.error) },
      });
      ws.close(1011, event.message);
    };
    ws.onmessage = (event: MessageEvent) => {
      this._onMessage(identifier, event.data.toString(), ws.protocol as OCPPVersionType);
    };

    const closeHandler = (code: number, reason: Buffer<ArrayBufferLike>) => {
      this._handleWebsocketClose(identifier, ws, code, reason.toString(), connLogger);
    };
    ws.once('close', closeHandler);
    this._closeHandlers.set(identifier, closeHandler);

    ws.on('ping', (message) => {
      connLogger.debug('Ping received for', identifier, 'with message', message);
      ws.pong(message);
    });

    ws.on('pong', () => {
      connLogger.debug('Pong received for', identifier);

      // Disarm the pong-timeout — the client is alive.
      const pongTimeout = this._pongTimeouts.get(identifier);
      if (pongTimeout) {
        clearTimeout(pongTimeout);
        this._pongTimeouts.delete(identifier);
      }

      this._ping(identifier, ws, pingInterval, false, connLogger);
    });

    this._ping(identifier, ws, pingInterval, true, connLogger);
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

  private async _handleWebsocketClose(
    identifier: string,
    ws: WebSocket,
    code: number,
    reason: string,
    connLogger: Logger<ILogObj> = this._connLogger(identifier),
  ): Promise<boolean> {
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

    const prevCount = this._tenantConnectionCounts.get(closedTenantId);
    if (prevCount === undefined) {
      connLogger.warn(
        `No previous connection count found for tenant ${closedTenantId} when closing connection ${identifier}`,
      );
    } else if (prevCount <= 1) {
      this._tenantConnectionCounts.delete(closedTenantId);
    } else {
      this._tenantConnectionCounts.set(closedTenantId, prevCount - 1);
    }
    // Only decrement the active gauge for connections that were actually counted
    // (i.e. that reached full establishment and live in _identifierConnections).
    const wasActive = this._identifierConnections.delete(identifier);
    if (wasActive) {
      recordWsActiveConnectionsDelta(-1);
    }
    recordWsConnectionClosed(code);

    // Deregistered before the slot is released. Until then no other instance can claim the
    // station, so its messages are never bound to two instances at once.
    const deregistered =
      (await this._router
        .deregisterConnection(closedTenantId, getStationIdFromIdentifier(identifier))
        .catch((err) => {
          connLogger.error(`Failed to deregister connection ${identifier} from router`, err);
        })) === true;
    const connectionString = await this._cache
      .remove<string>(identifier, CacheNamespace.Connections)
      .catch((err) => {
        connLogger.error(`Failed to remove connection string ${identifier} from cache`, err);
      });
    let timeConnected: number | undefined;
    if (connectionString) {
      const connection: IWebsocketConnection = JSON.parse(connectionString);
      timeConnected = new Date().getTime() - new Date(connection.timeConnected).getTime();
      connLogger.info(
        `Connection ${identifier} closed after being connected for ${timeConnected} ms with code ${code} and reason ${reason}`,
      );
    }

    connLogger.info(
      `Connection closed for ${identifier} live connections: ${this._identifierConnections.size}`,
    );

    const socketInfo = this._socketInfo.get(ws);
    if (!socketInfo) {
      connLogger.warn(`No socket info for ${identifier}; not emitting its close event`);
      return deregistered;
    }
    const closeContext = this._closeContexts.get(ws);
    this._emitLifecycleEvent({
      type: 'Close',
      tenantId: closedTenantId,
      ocppConnectionName: getStationIdFromIdentifier(identifier),
      ...socketInfo,
      subprotocol: ws.protocol || undefined,
      wsCloseCode: code,
      sentCode: closeContext?.sentCode,
      closeReason: reason || undefined,
      initiator: closeContext
        ? MessageOrigin.ChargingStationManagementSystem
        : code === 1006
          ? undefined
          : MessageOrigin.ChargingStation,
      source: closeContext?.source,
      details: {
        ...(timeConnected !== undefined ? { connectedMs: timeConnected } : {}),
        ...(closeContext?.error ? { error: closeContext.error } : {}),
      },
    });
    return deregistered;
  }

  /** For callers that run {@link _handleWebsocketClose} themselves rather than wait for 'close'. */
  private _detachCloseHandler(identifier: string, ws: WebSocket): void {
    const closeHandler = this._closeHandlers.get(identifier);
    if (closeHandler) {
      ws.removeListener('close', closeHandler);
      this._closeHandlers.delete(identifier);
    }
  }

  /** Records why we are closing `ws`, so its Close event carries the cause, then closes it. */
  private _closeWith(
    ws: WebSocket,
    source: CloseContext['source'],
    code: number,
    reason: string,
  ): void {
    this._closeContexts.set(ws, { source, sentCode: code });
    ws.close(code, reason);
  }

  /** Records why we are terminating `ws`, so its Close event carries the cause, then terminates it. */
  private _terminateWith(ws: WebSocket, source: CloseContext['source']): void {
    this._closeContexts.set(ws, { source });
    ws.terminate();
  }

  /**
   * Closes a socket that was upgraded but never registered. Its close listener is not attached
   * yet, so the rejection is reported here instead of by a Close event.
   */
  private _rejectConnection(
    ws: WebSocket,
    req: http.IncomingMessage,
    websocketServerConfig: WebsocketServerConfig,
    tenantId: number,
    reason: WsRejectReason,
    code: number,
    closeReason: string,
    details?: Record<string, unknown>,
  ): void {
    recordWsConnectionRejected(reason);
    // A socket paused during setup never reads the station's reply to our close frame, which
    // would leave it half-closed until ws gives up after its 30s close timeout.
    ws.resume();
    ws.close(code, closeReason);
    this._emitLifecycleEvent({
      type: 'ConnectionRejected',
      tenantId,
      ...this._requestFields(req, websocketServerConfig),
      subprotocol: ws.protocol || undefined,
      sentCode: code,
      closeReason,
      initiator: MessageOrigin.ChargingStationManagementSystem,
      source: reason,
      details,
    });
  }

  /** Fire-and-forget: a lifecycle event must never hold up or fail the transport. */
  private _emitLifecycleEvent(fields: LifecycleEventFields): void {
    this._messagesExchangeSink
      .record(
        buildWebsocketLifecycleEvent({
          ...fields,
          host: this._host,
          timestamp: new Date().toISOString(),
        }),
      )
      .catch((error) =>
        this._logger.error(`Failed to publish websocket ${fields.type} event`, error),
      );
  }

  private _requestFields(
    req: http.IncomingMessage,
    websocketServerConfig: WebsocketServerConfig,
  ): Pick<LifecycleEventFields, 'serverId' | 'remoteAddress' | 'uri' | 'ocppConnectionName'> {
    let ocppConnectionName: string | undefined;
    try {
      ocppConnectionName = getClientIdFromUrl(req.url ?? '') || undefined;
    } catch {
      ocppConnectionName = undefined;
    }

    return {
      serverId: websocketServerConfig.id,
      remoteAddress: remoteAddressOf(req),
      uri: uriOf(req),
      ocppConnectionName: ocppConnectionName,
    };
  }

  /** The tenant to attribute an event to; the default tenant when none could be resolved. */
  private _tenantIdOf(
    req: http.IncomingMessage,
    websocketServerConfig: WebsocketServerConfig,
  ): number {
    return this._resolvedTenantIds.get(req) ?? websocketServerConfig.tenantId ?? DEFAULT_TENANT_ID;
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
   * @param {Logger<ILogObj>} connLogger - The per-connection sub-logger.
   * @return {void} This function does not return anything.
   */
  private _ping(
    identifier: string,
    ws: WebSocket,
    pingInterval: number,
    applyJitter: boolean,
    connLogger: Logger<ILogObj>,
  ): void {
    if (this._pingTimers.has(identifier)) {
      // Ping already scheduled, do not schedule another one
      return;
    }
    const jitter = applyJitter ? Math.random() * pingInterval * 1000 : 0;

    const sendTimer = setTimeout(
      () => {
        this._pingTimers.delete(identifier);

        const pongTimeout = setTimeout(() => {
          connLogger.debug('Pong timeout for', identifier, '— terminating');
          this._pongTimeouts.delete(identifier);
          this._terminateWith(ws, WsEventSource.PongTimeout);
        }, pingInterval * 1000);

        this._pongTimeouts.set(identifier, pongTimeout);

        connLogger.debug('Pinging client', identifier);
        ws.ping();
      },
      pingInterval * 1000 + jitter,
    );

    this._pingTimers.set(identifier, sendTimer);
    this._cache
      .updateExpiration(identifier, pingInterval * 3, CacheNamespace.Connections)
      .catch((error) => {
        connLogger.error(
          'Failed to update cache expiration - will close websocket for',
          identifier,
          error,
        );
        this._closeWith(
          ws,
          WsEventSource.CacheExpiryFailed,
          1011,
          'Failed to update cache expiration',
        );
      });
  }
  /**
   * Loads every tenant's websocket path into the cache, so upgrade
   * requests are served from memory. Failures are
   * non-fatal: {@link _resolveTenantIdByPath} falls back to the database on a cache miss.
   */
  private async _warmTenantPathCache(): Promise<void> {
    if (!this._getAllTenantWebsocketServerPaths) {
      throw new Error(
        'Dynamic tenant resolution is enabled but no tenant path loader was provided',
      );
    }
    const pathsByTenant = await this._getAllTenantWebsocketServerPaths();
    for (const [path, tenantId] of pathsByTenant) {
      await this._cache.set(path, tenantId.toString(), CacheNamespace.TenantPathMapping);
    }
    this._logger.info(`Loaded ${pathsByTenant.size} tenant websocket path mapping(s)`);
  }

  /**
   * Extract tenant id from the incoming upgrade request. The tenant is taken from the
   * path segment preceding the station id (`/{tenantPath}/{station}`) and resolved
   * against {@link CacheNamespace.TenantPathMapping}, which mirrors
   * `Tenant.tenantWebsocketServerPath`.
   */
  private async _extractTenantIdFromRequest(
    req: http.IncomingMessage,
  ): Promise<number | undefined> {
    try {
      const rawUrl = req.url ?? '';
      const url = new URL(rawUrl, 'http://localhost');
      const segments = url.pathname.split('/').filter(Boolean);

      if (segments.length >= 2) {
        // Percent-decode so an encoded segment matches the stored path literally. Stored
        // paths are restricted to unreserved characters, so a decoded separator (e.g. a
        // station connecting to `/a%2Fb/station`) simply matches no tenant.
        const segment = decodeURIComponent(segments[segments.length - 2]);
        if (!TENANT_WEBSOCKET_SERVER_PATH_PATTERN.test(segment)) {
          this._logger.debug(`Ignoring malformed tenant path segment: ${segment}`);
          return undefined;
        }
        return await this._resolveTenantIdByPath(segment);
      }
    } catch (err) {
      // If parsing fails, ignore and fall back to server-configured tenant
      this._logger.debug('Failed to extract tenant from request', err);
    }
    return undefined;
  }

  /**
   * Resolves a path segment to a tenant id, checking the cache first and falling back
   * to the database. A database hit is written back to the cache so tenants created
   * after startup (or on another instance) are only looked up once per instance.
   */
  private async _resolveTenantIdByPath(path: string): Promise<number | undefined> {
    const cachedTenantIdString = await this._cache.get<string>(
      path,
      CacheNamespace.TenantPathMapping,
    );
    if (cachedTenantIdString) {
      return Number(cachedTenantIdString);
    }

    const tenantId = await this._getTenantIdByWebsocketServerPath?.(path);
    if (tenantId === undefined) {
      this._logger.debug(`No tenant found for websocket path segment: ${path}`);
      return undefined;
    }

    await this._cache.set(path, tenantId.toString(), CacheNamespace.TenantPathMapping);
    return tenantId;
  }

  private async _generateServerOptions(
    config: WebsocketServerConfig,
  ): Promise<https.ServerOptions> {
    let certManager = this._certManagersMap.get(config.id);
    if (!certManager) {
      certManager = new TlsCredentialManager(config, this._fileStorage, this._logger);
      this._certManagersMap.set(config.id, certManager);
    }
    const { key, cert } = await certManager.getServerOptions(config);
    const serverOptions: https.ServerOptions = {
      key,
      cert,
      SNICallback: async (serverName, cb) => {
        try {
          const opts = await certManager.getServerOptions(config);
          cb(null, tls.createSecureContext(opts));
        } catch (error) {
          this._logger.error(`SNI callback failed for server ${config.id}`, error);
          cb(error instanceof Error ? error : new Error(String(error)));
        }
      },
      ca:
        config.securityProfile > 2 && config.rootCACertificateFilePath
          ? (await this._fileStorage.getFile(config.rootCACertificateFilePath, undefined, {
              trusted: true,
            }))!
          : undefined,
      requestCert: config.securityProfile > 2,
      rejectUnauthorized: config.securityProfile > 2,
    };
    return serverOptions;
  }

  private async _createAndStartWebsocketServer(
    wsConfig: WebsocketServerConfig,
  ): Promise<http.Server | https.Server> {
    return new Promise(async (resolve) => {
      let httpServer: http.Server | https.Server;
      switch (wsConfig.securityProfile) {
        case 3: // mTLS
        case 2: {
          // TLS
          const httpsServer = https.createServer(
            await this._generateServerOptions(wsConfig),
            this._onHttpRequest.bind(this),
          );
          httpsServer.on('tlsClientError', (error, tlsSocket) =>
            this._onTlsClientError(error, tlsSocket, wsConfig),
          );
          httpServer = httpsServer;
          break;
        }
        case 1:
        case 0:
        default:
          httpServer = http.createServer(this._onHttpRequest.bind(this));
          break;
      }

      const wss = new WebSocketServer({
        noServer: true,
        handleProtocols: (protocols, req) =>
          this._handleProtocols(protocols, req, wsConfig.protocols, wsConfig.forceProtocol),
        clientTracking: false,
        perMessageDeflate: wsConfig.perMessageDeflate ?? true,
      });

      wss.on('connection', (ws, req) =>
        this._onConnection(ws, wsConfig, wsConfig.pingInterval, req).catch((error) =>
          this._onConnectionSetupFailed(ws, req, wsConfig, error),
        ),
      );
      wss.on('wsClientError', (error, socket, req) =>
        this._onInvalidHandshake(error, socket, req, wsConfig),
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

export default WebsocketNetworkConnection;
