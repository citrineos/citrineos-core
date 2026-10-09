// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AddressInfo } from 'net';
import { OCPPVersion, type WebsocketServerConfig } from '@citrineos/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import { WebsocketNetworkConnection } from '@/transport/index.js';
import { recordWsUpgrade, WsUpgradeResult } from '@/transport/metrics.js';
import { UpgradeAuthenticationError } from '@/transport/network-connection/authenticator/errors/authentication-error.js';
import { UpgradeUnknownError } from '@/transport/network-connection/authenticator/errors/unknown-error.js';
import { createTestContainer, mockDeps } from '@test/test-container.js';

vi.mock('@/transport/metrics.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/transport/metrics.js')>()),
  recordWsUpgrade: vi.fn(),
}));

const STATION_ID = 'CS001';

const config: WebsocketServerConfig = {
  id: 'ws-test',
  host: '127.0.0.1',
  port: 0,
  pingInterval: 60,
  protocols: [OCPPVersion.OCPP2_0_1],
  securityProfile: 0,
  allowUnknownChargingStations: false,
  tenantId: 1,
  dynamicTenantResolution: false,
};

describe('WebsocketNetworkConnection upgrade result', () => {
  const { logger } = createTestContainer();
  let networkConnection: WebsocketNetworkConnection | undefined;

  afterEach(async () => {
    await networkConnection?.shutdown();
    vi.clearAllMocks();
  });

  /** Attempts an upgrade the authenticator rejects with `error`; resolves with the HTTP status. */
  async function statusOfUpgradeRejectedWith(error: Error): Promise<number | undefined> {
    networkConnection = new WebsocketNetworkConnection(
      mockDeps<typeof WebsocketNetworkConnection>({
        logger,
        router: {},
        authenticator: { authenticate: vi.fn().mockRejectedValue(error) },
        messagesExchangeSink: { record: vi.fn().mockResolvedValue({ delivered: true }) },
      }),
    );
    await networkConnection.addWebsocketServer(config);
    const { port } = networkConnection.getHttpServers().get(config.id)?.address() as AddressInfo;

    const station = new WebSocket(`ws://127.0.0.1:${port}/${STATION_ID}`, OCPPVersion.OCPP2_0_1);
    return new Promise((resolve) => {
      station.once('unexpected-response', (_req, res) => resolve(res.statusCode));
      station.once('error', () => resolve(undefined));
    });
  }

  it.each([
    [
      'an authentication failure',
      new UpgradeAuthenticationError('Unauthorized'),
      401,
      WsUpgradeResult.AuthFailed,
    ],
    [
      'an unknown station',
      new UpgradeUnknownError('Unknown identifier CS001'),
      404,
      WsUpgradeResult.UnknownStation,
    ],
    ['any other error', new Error('boom'), 500, WsUpgradeResult.InternalError],
  ])('records %s as its own result', async (_label, error, status, result) => {
    expect(await statusOfUpgradeRejectedWith(error)).toBe(status);

    expect(recordWsUpgrade).toHaveBeenCalledExactlyOnceWith(result);
  });
});
