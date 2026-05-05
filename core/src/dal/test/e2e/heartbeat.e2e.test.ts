// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E parity: Heartbeat bumps `ChargingStation.latestOcppMessageTimestamp`
 * + flips `isOnline=true`.
 *
 * Drives two Heartbeat calls ~1s apart. After each, asserts:
 *   • `isOnline = true`
 *   • `latestOcppMessageTimestamp` is non-null and advances between the
 *     two heartbeats.
 *
 * Mirrors §44 in the parity roadmap. Both targets share the same
 * column shape so this runs cross-server.
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

const STATION_ID = uniqueStationId('HEARTBEAT');

let ctx: TestServerHandle;

beforeAll(async () => {
  console.log(`[heartbeat] target = ${TARGET}`);
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);
}, 180_000);

afterAll(async () => {
  await ctx?.shutdown();
});

describe(`Heartbeat lastSeen — target=${TARGET}`, () => {
  it('bumps latestOcppMessageTimestamp + isOnline on each Heartbeat', async () => {
    const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

    try {
      // First heartbeat
      const r1 = await sendCall(ws, crypto.randomUUID(), 'Heartbeat', {});
      expect(r1[0]).toBe(3);
      await new Promise((r) => setTimeout(r, 1_000));

      const after1 = await ctx.db.query<{
        isOnline: boolean;
        latestOcppMessageTimestamp: Date | null;
      }>(`SELECT "isOnline", "latestOcppMessageTimestamp" FROM "ChargingStations" WHERE id = $1`, [
        STATION_ID,
      ]);
      expect(after1.rows).toHaveLength(1);
      expect(after1.rows[0].isOnline).toBe(true);
      expect(after1.rows[0].latestOcppMessageTimestamp).not.toBeNull();
      const t1 = after1.rows[0].latestOcppMessageTimestamp!.getTime();

      await new Promise((r) => setTimeout(r, 1_200));

      // Second heartbeat
      const r2 = await sendCall(ws, crypto.randomUUID(), 'Heartbeat', {});
      expect(r2[0]).toBe(3);
      await new Promise((r) => setTimeout(r, 1_000));

      const after2 = await ctx.db.query<{ latestOcppMessageTimestamp: Date | null }>(
        `SELECT "latestOcppMessageTimestamp" FROM "ChargingStations" WHERE id = $1`,
        [STATION_ID],
      );
      expect(after2.rows[0].latestOcppMessageTimestamp).not.toBeNull();
      const t2 = after2.rows[0].latestOcppMessageTimestamp!.getTime();
      expect(t2).toBeGreaterThan(t1);
    } finally {
      ws.close();
    }
  }, 60_000);
});
