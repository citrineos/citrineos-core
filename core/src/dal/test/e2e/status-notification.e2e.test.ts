// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: StatusNotification (OCPP 2.0.1) — Available + Occupied transitions
 *
 * Verifies the simplest contract:
 *   • Charger sends StatusNotification → CSMS replies with empty CallResult `{}`.
 *   • A row lands in the StatusNotifications table.
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

const STATION_ID = uniqueStationId('STATUS');

let ctx: TestServerHandle;

beforeAll(async () => {
  console.log(`[status-notification] target = ${TARGET}`);
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);
}, 180_000);

afterAll(async () => {
  await ctx?.shutdown();
});

describe(`StatusNotification — target=${TARGET}`, () => {
  it.each([
    { connectorStatus: 'Available', evseId: 1, connectorId: 1 },
    { connectorStatus: 'Occupied', evseId: 1, connectorId: 1 },
  ])(
    'persists $connectorStatus on evse=$evseId connector=$connectorId',
    async ({ connectorStatus, evseId, connectorId }) => {
      const msgId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const payload = { timestamp, connectorStatus, evseId, connectorId };

      const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

      try {
        const response = await sendCall(ws, msgId, 'StatusNotification', payload);

        expect(response[0]).toBe(3);
        expect(response[1]).toBe(msgId);
        expect(response[2]).toEqual({});

        await new Promise((r) => setTimeout(r, 1_500));

        const { rows } = await ctx.db.query<{
          stationId: string;
          connectorStatus: string;
          evseId: number;
          connectorId: number;
        }>(
          `SELECT "stationId", "connectorStatus", "evseId", "connectorId"
             FROM "StatusNotifications"
            WHERE "stationId" = $1 AND "connectorStatus" = $2
            ORDER BY id DESC
            LIMIT 1`,
          [STATION_ID, connectorStatus],
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].stationId).toBe(STATION_ID);
        expect(rows[0].connectorStatus).toBe(connectorStatus);
        expect(rows[0].evseId).toBe(evseId);
        expect(rows[0].connectorId).toBe(connectorId);
      } finally {
        ws.close();
      }
    },
    30_000,
  );
});
