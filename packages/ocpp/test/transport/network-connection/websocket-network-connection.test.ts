// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AddressInfo } from 'net';
import { OCPPVersion, type WebsocketServerConfig } from '@citrineos/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import { CacheNamespace } from '@citrineos/base';
import { ConnectionNotFoundError, WebsocketNetworkConnection } from '@/transport/index.js';
import { createTestContainer, mockDeps } from '@test/test-container.js';

const STATION_ID = 'CS001';

function aWebsocketServerConfig(overrides?: Partial<WebsocketServerConfig>): WebsocketServerConfig {
  return {
    id: 'ws-test',
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

describe('WebsocketNetworkConnection', () => {
  const { logger } = createTestContainer();
  let networkConnection: WebsocketNetworkConnection | undefined;
  let client: WebSocket | undefined;

  afterEach(async () => {
    client?.terminate();
    await networkConnection?.shutdown();
  });

  async function extensionsNegotiatedWith(config: WebsocketServerConfig): Promise<string> {
    networkConnection = new WebsocketNetworkConnection(
      mockDeps<typeof WebsocketNetworkConnection>({
        logger,
        router: {},
        authenticator: { authenticate: vi.fn().mockResolvedValue({ identifier: STATION_ID }) },
        doesChargingStationExistByOcppConnectionName: vi.fn().mockResolvedValue(false),
      }),
    );
    await networkConnection.addWebsocketServer(config);
    const { port } = networkConnection.getHttpServers().get(config.id)?.address() as AddressInfo;

    const station = new WebSocket(`ws://127.0.0.1:${port}/${STATION_ID}`, OCPPVersion.OCPP2_0_1, {
      perMessageDeflate: true,
    });
    client = station;
    return new Promise((resolve, reject) => {
      station.once('open', () => resolve(station.extensions));
      station.once('error', reject);
    });
  }

  it('negotiates permessage-deflate with a station that offers it', async () => {
    const extensions = await extensionsNegotiatedWith(aWebsocketServerConfig());

    expect(extensions).toContain('permessage-deflate');
  });

  it('does not negotiate permessage-deflate when the server turns it off', async () => {
    const extensions = await extensionsNegotiatedWith(
      aWebsocketServerConfig({ perMessageDeflate: false }),
    );

    expect(extensions).toBe('');
  });

  describe('connection lifecycle', () => {
    const IDENTIFIER = `1:${STATION_ID}`;

    function aConnectedStation(router: Record<string, unknown>, cache: Record<string, unknown>) {
      networkConnection = new WebsocketNetworkConnection(
        mockDeps<typeof WebsocketNetworkConnection>({
          logger,
          router,
          cache,
          authenticator: { authenticate: vi.fn().mockResolvedValue({ identifier: STATION_ID }) },
          doesChargingStationExistByOcppConnectionName: vi.fn().mockResolvedValue(true),
        }),
      );
      return networkConnection;
    }

    async function connect(connection: WebsocketNetworkConnection): Promise<WebSocket> {
      const config = aWebsocketServerConfig();
      await connection.addWebsocketServer(config);
      const { port } = connection.getHttpServers().get(config.id)?.address() as AddressInfo;
      const station = new WebSocket(`ws://127.0.0.1:${port}/${STATION_ID}`, OCPPVersion.OCPP2_0_1);
      client = station;
      await new Promise((resolve, reject) => {
        station.once('open', resolve);
        station.once('error', reject);
      });
      return station;
    }

    function holdsSocket(connection: WebsocketNetworkConnection): boolean {
      return (
        connection as unknown as { _identifierConnections: Map<string, unknown> }
      )._identifierConnections.has(IDENTIFIER);
    }

    function aCache() {
      return {
        setIfNotExist: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        remove: vi.fn().mockResolvedValue(null),
        updateExpiration: vi.fn().mockResolvedValue(true),
      };
    }

    it('holds the socket before registering, so messages bound to it can be sent', async () => {
      let heldAtRegistration: boolean | undefined;
      const router = {
        registerConnection: vi.fn(async () => {
          heldAtRegistration = holdsSocket(connection);
          return true;
        }),
        deregisterConnection: vi.fn().mockResolvedValue(true),
      };
      const connection = aConnectedStation(router, aCache());

      await connect(connection);
      await vi.waitFor(() => expect(router.registerConnection).toHaveBeenCalled());

      expect(heldAtRegistration).toBe(true);
    });

    it('lets go of the socket when registering fails', async () => {
      const router = {
        registerConnection: vi.fn().mockResolvedValue(false),
        deregisterConnection: vi.fn().mockResolvedValue(true),
      };
      const connection = aConnectedStation(router, aCache());

      await connect(connection);
      await vi.waitFor(() => expect(router.registerConnection).toHaveBeenCalled());

      await vi.waitFor(() => expect(holdsSocket(connection)).toBe(false));
    });

    it('unbinds the station before releasing its connection slot', async () => {
      const cache = aCache();
      const router = {
        registerConnection: vi.fn().mockResolvedValue(true),
        deregisterConnection: vi.fn().mockResolvedValue(true),
      };
      const connection = aConnectedStation(router, cache);
      const station = await connect(connection);
      await vi.waitFor(() => expect(holdsSocket(connection)).toBe(true));
      station.close();
      await vi.waitFor(() =>
        expect(cache.remove).toHaveBeenCalledWith(IDENTIFIER, CacheNamespace.Connections),
      );

      const [deregisteredAt] = router.deregisterConnection.mock.invocationCallOrder;
      const [releasedAt] = cache.remove.mock.invocationCallOrder;
      expect(deregisteredAt).toBeLessThan(releasedAt);
    });

    it('throws ConnectionNotFoundError for a station whose websocket is not here', async () => {
      const cache = aCache();
      cache.get.mockResolvedValue('{"id":"ws-other"}');
      const connection = aConnectedStation({}, cache);

      await expect(connection.sendMessage(IDENTIFIER, 'payload')).rejects.toBeInstanceOf(
        ConnectionNotFoundError,
      );
    });
  });
});
