// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import * as http from 'http';
import * as net from 'net';
import * as path from 'path';
import type { AddressInfo } from 'net';
import { hostname } from 'node:os';
import {
  isWebsocketLifecycleEvent,
  MessageOrigin,
  MessagesEventKind,
  OCPPVersion,
  type WebsocketEventType,
  type WebsocketLifecycleEvent,
  type WebsocketServerConfig,
} from '@citrineos/types';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { WebSocket } from 'ws';
import { WebsocketNetworkConnection } from '@/transport/index.js';
import {
  recordWsTlsHandshakeFailure,
  recordWsUpgrade,
  WsUpgradeResult,
} from '@/transport/metrics.js';
import { UpgradeAuthenticationError } from '@/transport/network-connection/authenticator/errors/authentication-error.js';
import { UpgradeUnknownError } from '@/transport/network-connection/authenticator/errors/unknown-error.js';
import { createTestContainer, mockDeps } from '@test/test-container.js';

vi.mock('@/transport/metrics.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/transport/metrics.js')>()),
  recordWsUpgrade: vi.fn(),
  recordWsTlsHandshakeFailure: vi.fn(),
}));

const STATION_ID = 'CS001';
const SERVER_ID = 'ws-test';

function aWebsocketServerConfig(overrides?: Partial<WebsocketServerConfig>): WebsocketServerConfig {
  return {
    id: SERVER_ID,
    host: '127.0.0.1',
    port: 0,
    pingInterval: 60,
    protocols: [OCPPVersion.OCPP2_0_1],
    securityProfile: 0,
    allowUnknownChargingStations: false,
    tenantId: 1,
    dynamicTenantResolution: false,
    ...overrides,
  };
}

describe('WebsocketNetworkConnection lifecycle events', () => {
  const { logger } = createTestContainer();
  let networkConnection: WebsocketNetworkConnection | undefined;
  let clients: WebSocket[];
  let record: Mock;
  let authenticate: Mock;
  let stationExists: Mock;
  let setIfNotExist: Mock;
  let deregisterConnection: Mock;

  beforeEach(() => {
    clients = [];
    record = vi.fn().mockResolvedValue({ delivered: true });
    authenticate = vi.fn().mockResolvedValue({ identifier: STATION_ID });
    stationExists = vi.fn().mockResolvedValue(true);
    setIfNotExist = vi.fn().mockResolvedValue(true);
    deregisterConnection = vi.fn().mockResolvedValue(true);
    vi.mocked(recordWsUpgrade).mockClear();
    vi.mocked(recordWsTlsHandshakeFailure).mockClear();
  });

  afterEach(async () => {
    for (const client of clients) client.terminate();
    await networkConnection?.shutdown();
    networkConnection = undefined;
  });

  async function startServer(config = aWebsocketServerConfig()): Promise<number> {
    networkConnection = new WebsocketNetworkConnection(
      mockDeps<typeof WebsocketNetworkConnection>({
        logger,
        router: {
          registerConnection: vi.fn().mockResolvedValue(true),
          deregisterConnection,
        },
        authenticator: { authenticate },
        cache: {
          setIfNotExist,
          updateExpiration: vi.fn().mockResolvedValue(true),
          remove: vi
            .fn()
            .mockResolvedValue(JSON.stringify({ timeConnected: new Date().toISOString() })),
        },
        doesChargingStationExistByOcppConnectionName: stationExists,
        messagesExchangeSink: { record },
        fileStorage: { exists: vi.fn().mockResolvedValue(false), getFile: vi.fn() },
      }),
    );
    await networkConnection.addWebsocketServer(config);
    const { port } = networkConnection.getHttpServers().get(config.id)?.address() as AddressInfo;
    return port;
  }

  function aClient(
    port: number,
    path = `/${STATION_ID}`,
    protocol: string = OCPPVersion.OCPP2_0_1,
    options?: { autoPong?: boolean },
  ): WebSocket {
    const client = new WebSocket(`ws://127.0.0.1:${port}${path}`, protocol, options);
    client.on('error', () => {});
    clients.push(client);
    return client;
  }

  async function connect(port: number, path?: string): Promise<WebSocket> {
    const client = aClient(port, path);
    await new Promise((resolve) => client.once('open', resolve));
    return client;
  }

  /** Resolves with the close code, or 'still open' if the station is not closed promptly. */
  function closeCodeWithin(client: WebSocket, ms: number): Promise<number | 'still open'> {
    return Promise.race([
      new Promise<number>((resolve) => client.once('close', resolve)),
      new Promise<'still open'>((resolve) => setTimeout(() => resolve('still open'), ms)),
    ]);
  }

  function emitted(): WebsocketLifecycleEvent[] {
    return record.mock.calls.map(([event]) => event).filter(isWebsocketLifecycleEvent);
  }

  function eventOfType(type: WebsocketEventType): Promise<WebsocketLifecycleEvent> {
    return vi.waitFor(
      () => {
        const event = emitted().find((candidate) => candidate.type === type);
        if (!event) throw new Error(`no ${type} event yet`);
        return event;
      },
      { timeout: 5000 },
    );
  }

  describe('Open', () => {
    it('describes the socket, without the query string', async () => {
      const port = await startServer();

      await connect(port, `/${STATION_ID}?token=secret`);

      expect(await eventOfType('Open')).toMatchObject({
        kind: MessagesEventKind.Websocket,
        tenantId: 1,
        ocppConnectionName: STATION_ID,
        serverId: SERVER_ID,
        host: hostname(),
        remoteAddress: '127.0.0.1',
        uri: `/${STATION_ID}`,
        subprotocol: OCPPVersion.OCPP2_0_1,
      });
      expect(recordWsUpgrade).toHaveBeenCalledWith(WsUpgradeResult.Upgraded);
    });
  });

  describe('Close', () => {
    it('attributes a close the station started to the station', async () => {
      const port = await startServer();
      const client = await connect(port);
      await eventOfType('Open');

      client.close(1000, 'bye');

      const close = await eventOfType('Close');
      expect(close).toMatchObject({
        ocppConnectionName: STATION_ID,
        serverId: SERVER_ID,
        wsCloseCode: 1000,
        closeReason: 'bye',
        initiator: MessageOrigin.ChargingStation,
      });
      expect(close.source).toBeUndefined();
      expect(close.sentCode).toBeUndefined();
      expect(close.details?.connectedMs).toEqual(expect.any(Number));
    });

    it('carries the cause and the code we sent for an admin disconnect', async () => {
      const port = await startServer();
      await connect(port);
      await eventOfType('Open');

      await networkConnection!.disconnect(1, STATION_ID);

      expect(await eventOfType('Close')).toMatchObject({
        initiator: MessageOrigin.ChargingStationManagementSystem,
        source: 'admin_disconnect',
        sentCode: 1000,
      });
    });

    it('deregisters an admin-disconnected station from the router exactly once', async () => {
      const port = await startServer();
      const client = await connect(port);
      await eventOfType('Open');

      const disconnected = await networkConnection!.disconnect(1, STATION_ID);
      expect(await closeCodeWithin(client, 5000)).toBe(1000);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(disconnected).toBe(true);
      expect(deregisterConnection).toHaveBeenCalledTimes(1);
      expect(emitted().filter((event) => event.type === 'Close')).toHaveLength(1);
    });

    it('folds a frame error into the close that follows it', async () => {
      const port = await startServer();
      const client = await connect(port);
      await eventOfType('Open');

      client.send(Buffer.from([0xff, 0xfe]), { binary: false });

      const close = await eventOfType('Close');
      expect(close).toMatchObject({
        initiator: MessageOrigin.ChargingStationManagementSystem,
        source: 'frame_error',
        // ws stops reading once a frame fails, so the station's echo of 1007 never arrives.
        wsCloseCode: 1006,
        details: { error: { code: 'WS_ERR_INVALID_UTF8' } },
      });
      expect(emitted().map((event) => event.type)).toEqual(['Open', 'Close']);
    });

    it('reports a connection replaced by a newer one from the same station', async () => {
      const port = await startServer();
      await connect(port);
      await eventOfType('Open');

      await connect(port);

      expect(await eventOfType('Close')).toMatchObject({
        initiator: MessageOrigin.ChargingStationManagementSystem,
        source: 'replaced_by_new_connection',
        wsCloseCode: 1006,
      });
      await vi.waitFor(() =>
        expect(emitted().filter((event) => event.type === 'Open')).toHaveLength(2),
      );
    });

    it('reports a station that stopped answering pings', async () => {
      const port = await startServer(aWebsocketServerConfig({ pingInterval: 1 }));
      const client = aClient(port, undefined, undefined, { autoPong: false });
      await new Promise((resolve) => client.once('open', resolve));

      expect(await eventOfType('Close')).toMatchObject({
        initiator: MessageOrigin.ChargingStationManagementSystem,
        source: 'pong_timeout',
        wsCloseCode: 1006,
      });
    });

    it('reports connections closed by a server shutdown', async () => {
      const port = await startServer();
      await connect(port);
      await eventOfType('Open');

      await networkConnection!.shutdown();
      networkConnection = undefined;

      expect(await eventOfType('Close')).toMatchObject({
        source: 'server_shutdown',
        sentCode: 1001,
      });
    });
  });

  describe('ConnectionRejected', () => {
    it('reports an unknown station and emits no Close for it', async () => {
      stationExists.mockResolvedValue(false);
      const port = await startServer();

      aClient(port);

      expect(await eventOfType('ConnectionRejected')).toMatchObject({
        ocppConnectionName: STATION_ID,
        initiator: MessageOrigin.ChargingStationManagementSystem,
        source: 'unknown_station',
        sentCode: 1011,
        closeReason: 'Unknown charging station',
      });
      expect(emitted().map((event) => event.type)).toEqual(['ConnectionRejected']);
    });

    it('finishes closing a rejected station promptly rather than after the close timeout', async () => {
      stationExists.mockResolvedValue(false);
      const port = await startServer();

      const client = aClient(port);

      expect(await closeCodeWithin(client, 5000)).toBe(1011);
    });

    it('rejects, rather than leaving the socket paused, when setup fails before its own guard', async () => {
      stationExists.mockRejectedValue(new Error('database down'));
      const port = await startServer();

      const client = aClient(port);

      expect(await closeCodeWithin(client, 5000)).toBe(1011);
      expect(await eventOfType('ConnectionRejected')).toMatchObject({
        source: 'connection_failed',
        sentCode: 1011,
        details: { error: 'database down' },
      });
    });

    it('still closes a station whose identifier would overflow a close reason', async () => {
      setIfNotExist.mockRejectedValue(new Error('cache down'));
      const port = await startServer(
        aWebsocketServerConfig({ allowUnknownChargingStations: true }),
      );

      const client = aClient(port, `/${'X'.repeat(120)}`);
      const closed = new Promise<string>((resolve) =>
        client.once('close', (_code, reason) => resolve(reason.toString())),
      );

      expect(await closeCodeWithin(client, 5000)).toBe(1011);
      expect(await closed).toBe('Failed to set up connection');
    });

    it('reports a protocol mismatch with what each side offered', async () => {
      const port = await startServer();

      aClient(port, undefined, OCPPVersion.OCPP1_6);

      expect(await eventOfType('ConnectionRejected')).toMatchObject({
        source: 'no_protocol',
        sentCode: 1002,
        details: {
          offeredProtocols: OCPPVersion.OCPP1_6,
          serverProtocols: [OCPPVersion.OCPP2_0_1],
        },
      });
    });
  });

  describe('UpgradeRejected', () => {
    it('reports an authentication failure with the status it was answered with', async () => {
      authenticate.mockRejectedValue(new UpgradeAuthenticationError(`Unauthorized ${STATION_ID}`));
      const port = await startServer();

      aClient(port);

      expect(await eventOfType('UpgradeRejected')).toMatchObject({
        tenantId: 1,
        ocppConnectionName: STATION_ID,
        httpStatus: 401,
        source: 'auth_failed',
        details: { error: `Unauthorized ${STATION_ID}` },
      });
    });

    it('reports an unknown station with its own source rather than as an internal error', async () => {
      authenticate.mockRejectedValue(new UpgradeUnknownError(`Unknown identifier ${STATION_ID}`));
      const port = await startServer();

      aClient(port);

      expect(await eventOfType('UpgradeRejected')).toMatchObject({
        httpStatus: 404,
        source: 'unknown_station',
      });
    });

    it('falls back to 500 for an error that does not know how to answer', async () => {
      authenticate.mockRejectedValue(new Error('database down'));
      const port = await startServer();

      aClient(port);

      expect(await eventOfType('UpgradeRejected')).toMatchObject({
        httpStatus: 500,
        source: 'internal_error',
      });
    });

    it('answers and reports a handshake ws rejects on its own', async () => {
      const port = await startServer();

      const response = await new Promise<http.IncomingMessage>((resolve) => {
        http
          .get({
            host: '127.0.0.1',
            port,
            path: `/${STATION_ID}`,
            headers: {
              Connection: 'Upgrade',
              Upgrade: 'websocket',
              'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
              'Sec-WebSocket-Version': '7',
            },
          })
          .once('response', resolve);
      });

      expect(response.statusCode).toBe(400);
      expect(response.headers['sec-websocket-version']).toBe('13, 8');
      expect(recordWsUpgrade).toHaveBeenCalledWith(WsUpgradeResult.InvalidHandshake);
      expect(recordWsUpgrade).not.toHaveBeenCalledWith(WsUpgradeResult.Upgraded);
      expect(await eventOfType('UpgradeRejected')).toMatchObject({
        ocppConnectionName: STATION_ID,
        httpStatus: 400,
        source: 'invalid_handshake',
        details: { error: 'Missing or invalid Sec-WebSocket-Version header' },
      });
    });

    it('reports a failed TLS handshake, before any station identifier is known', async () => {
      const resource = (name: string) => path.resolve(__dirname, `../../resources/${name}`);
      const port = await startServer(
        aWebsocketServerConfig({
          securityProfile: 2,
          tlsKeyFilePath: resource('LeafKeySample.pem'),
          tlsCertificateChainFilePath: resource('LeafCertificateSample.pem'),
        }),
      );

      const socket = net.connect(port, '127.0.0.1', () => socket.write('GET / HTTP/1.1\r\n\r\n'));
      socket.on('error', () => {});

      const event = await eventOfType('UpgradeRejected');
      socket.destroy();
      expect(event).toMatchObject({
        serverId: SERVER_ID,
        remoteAddress: '127.0.0.1',
        source: 'tls_handshake_failed',
        details: { error: expect.any(String), code: 'ERR_SSL_HTTP_REQUEST' },
      });
      expect(event.ocppConnectionName).toBeUndefined();
      expect(event.uri).toBeUndefined();
      expect(recordWsTlsHandshakeFailure).toHaveBeenCalledWith(SERVER_ID, 'ERR_SSL_HTTP_REQUEST');
      expect(recordWsUpgrade).not.toHaveBeenCalled();
    });
  });
});
