// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AddressInfo } from 'net';
import { OCPPVersion, type WebsocketServerConfig } from '@citrineos/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import { WebsocketNetworkConnection } from '@/transport/index.js';
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
});
