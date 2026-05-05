// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E parity: StatusNotification populates Connectors + LatestStatusNotifications.
 *
 * Drives StatusNotification(Available) then StatusNotification(Occupied)
 * and asserts:
 *   • The (stationId, evseId, connectorId) Connectors row is updated in
 *     place (one row, latest status).
 *   • LatestStatusNotifications carries the latest snapshot per
 *     (stationId, evseId, connectorId).
 *
 * NestJS-only — legacy uses a different table layout for connector
 * status caching.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TARGET } from './helpers/server-target.js';
import {
  type TestServerHandle,
  seedChargingStation,
  startTestServer,
  uniqueStationId,
} from './helpers/test-server.js';
import { connectOcpp, sendCall } from './helpers/ocpp-ws.js';

const STATION_ID = uniqueStationId('CONN');

let ctx: TestServerHandle;

beforeAll(async () => {
  if (TARGET !== 'nestjs') return;
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);
}, 180_000);

afterAll(async () => {
  if (TARGET !== 'nestjs') return;
  await ctx?.shutdown();
});

describe(`Connector + LatestStatusNotification — target=${TARGET}`, () => {
  it.skipIf(TARGET !== 'nestjs')(
    'upserts Connectors and LatestStatusNotifications on StatusNotification',
    async () => {
      const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

      try {
        const send = (status: string) =>
          sendCall(ws, crypto.randomUUID(), 'StatusNotification', {
            timestamp: new Date().toISOString(),
            connectorStatus: status,
            evseId: 1,
            connectorId: 1,
          });

        await send('Available');
        await new Promise((r) => setTimeout(r, 1_500));

        let conn = await ctx.db.query<{ status: string }>(
          `SELECT status FROM "Connectors"
            WHERE "stationId" = $1 AND "evseId" = 1 AND "connectorId" = 1`,
          [STATION_ID],
        );
        expect(conn.rows).toHaveLength(1);
        expect(conn.rows[0].status).toBe('Available');

        let latest = await ctx.db.query<{ connectorStatus: string }>(
          `SELECT "connectorStatus" FROM "LatestStatusNotifications"
            WHERE "stationId" = $1 AND "evseId" = 1 AND "connectorId" = 1`,
          [STATION_ID],
        );
        expect(latest.rows).toHaveLength(1);
        expect(latest.rows[0].connectorStatus).toBe('Available');

        await send('Occupied');
        await new Promise((r) => setTimeout(r, 1_500));

        // Connectors row must be updated in place — a second row would
        // mean the unique-tuple constraint isn't enforced.
        conn = await ctx.db.query<{ status: string }>(
          `SELECT status FROM "Connectors"
            WHERE "stationId" = $1 AND "evseId" = 1 AND "connectorId" = 1`,
          [STATION_ID],
        );
        expect(conn.rows).toHaveLength(1);
        expect(conn.rows[0].status).toBe('Occupied');

        latest = await ctx.db.query<{ connectorStatus: string }>(
          `SELECT "connectorStatus" FROM "LatestStatusNotifications"
            WHERE "stationId" = $1 AND "evseId" = 1 AND "connectorId" = 1`,
          [STATION_ID],
        );
        expect(latest.rows).toHaveLength(1);
        expect(latest.rows[0].connectorStatus).toBe('Occupied');
      } finally {
        ws.close();
      }
    },
    60_000,
  );
});
