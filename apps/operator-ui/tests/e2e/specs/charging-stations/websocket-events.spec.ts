// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from 'node:crypto';
import { test, expect } from '../../fixtures';
import type { ApiClient } from '../../fixtures/api-client';

// Proves the websocket lifecycle pipeline end to end: WebsocketNetworkConnection publishes each
// event to the messages exchange, the messages module persists it to WebsocketEvents, and Hasura
// serves it. Persistence is asynchronous (via the broker), so every read polls.

test.use({ storageState: 'playwright/.auth/admin.json' });

// Host ports of the local stack's websocket servers (see websocket-servers.json).
const OPEN_SERVER = 'ws://localhost:8081';
const AUTH_SERVER = 'ws://localhost:8082';

interface WebsocketEventRow {
  type: string;
  stationId: number | null;
  uri: string | null;
  subprotocol: string | null;
  httpStatus: number | null;
  sentCode: number | null;
  closeReason: string | null;
  initiator: string | null;
  source: string | null;
}

async function eventsAt(api: ApiClient, uri: string): Promise<WebsocketEventRow[]> {
  const { WebsocketEvents } = await api.gql<{ WebsocketEvents: WebsocketEventRow[] }>(
    `query WebsocketEventsAt($uri: String!) {
       WebsocketEvents(where: { uri: { _eq: $uri } }, order_by: { id: asc }) {
         type stationId uri subprotocol httpStatus sentCode closeReason initiator source
       }
     }`,
    { uri },
  );
  return WebsocketEvents;
}

/** Opens a socket and resolves once the server has closed it, whether or not it ever opened. */
function connectUntilClosed(url: string, protocols?: string[]): Promise<number> {
  return new Promise((resolve) => {
    const socket = protocols ? new WebSocket(url, protocols) : new WebSocket(url);
    socket.onclose = (event) => resolve(event.code);
    socket.onerror = () => {};
  });
}

test.describe('charging-stations › websocket events @everest', () => {
  test('E2E-156: the live station connection is recorded as an Open linked to the station @everest', async ({
    everestStation,
    apiClient,
  }) => {
    await expect
      .poll(
        async () =>
          (await eventsAt(apiClient, `/${everestStation.ocppConnectionName}`)).filter(
            (e) => e.type === 'Open',
          ),
        {
          timeout: 30_000,
        },
      )
      .toContainEqual(
        expect.objectContaining({
          type: 'Open',
          stationId: everestStation.id,
          subprotocol: expect.stringMatching(/^ocpp/),
        }),
      );
  });

  test('E2E-157: a socket with no subprotocol is recorded as a rejected connection @everest', async ({
    apiClient,
  }) => {
    const name = `e2e-noproto-${randomUUID()}`;

    expect(await connectUntilClosed(`${OPEN_SERVER}/${name}`)).toBe(1002);

    await expect
      .poll(() => eventsAt(apiClient, `/${name}`), { timeout: 30_000 })
      .toEqual([
        expect.objectContaining({
          type: 'ConnectionRejected',
          stationId: null,
          sentCode: 1002,
          closeReason: 'Protocol not specified',
          initiator: 'csms',
          source: 'no_protocol',
        }),
      ]);
  });

  test('E2E-158: an unknown station refused at upgrade is recorded with its HTTP status @everest', async ({
    apiClient,
  }) => {
    const name = `e2e-unknown-${randomUUID()}`;

    await connectUntilClosed(`${AUTH_SERVER}/${name}`, ['ocpp2.0.1']);

    await expect
      .poll(() => eventsAt(apiClient, `/${name}`), { timeout: 30_000 })
      .toEqual([
        expect.objectContaining({
          type: 'UpgradeRejected',
          stationId: null,
          httpStatus: 404,
          initiator: 'csms',
        }),
      ]);
  });
});
