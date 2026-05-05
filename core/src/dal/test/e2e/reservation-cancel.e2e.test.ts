// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E parity: TransactionEvent.Started with `reservationId` deactivates
 * the matching Reservation row.
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

const STATION_ID = uniqueStationId('RES-CANCEL');
const TX_ID = 'tx-rescancel-' + Date.now();
const ID_TOKEN = 'tok-rescancel-001';
const RESERVATION_ID = 4242;

let ctx: TestServerHandle;

beforeAll(async () => {
  console.log(`[reservation-cancel] target = ${TARGET}`);
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);
  const now = new Date().toISOString();
  await ctx.db.query(
    `INSERT INTO "Authorizations" ("idToken", "idTokenType", "status", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, 'Central', 'Accepted', 1, $2, $2)
     ON CONFLICT DO NOTHING`,
    [ID_TOKEN, now],
  );
  await ctx.db.query(
    `INSERT INTO "Reservations" ("stationId", "reservationId", "isActive", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, $2, true, 1, $3, $3)
     ON CONFLICT DO NOTHING`,
    [STATION_ID, RESERVATION_ID, now],
  );
}, 180_000);

afterAll(async () => {
  await ctx?.shutdown();
});

describe(`Reservation cancelled on TransactionEvent.Started — target=${TARGET}`, () => {
  it('marks the matching reservation inactive when a Started event references it', async () => {
    const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

    try {
      const r = await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
        eventType: 'Started',
        timestamp: new Date().toISOString(),
        triggerReason: 'Authorized',
        seqNo: 0,
        idToken: { idToken: ID_TOKEN, type: 'Central' },
        evse: { id: 1, connectorId: 1 },
        reservationId: RESERVATION_ID,
        transactionInfo: { transactionId: TX_ID, chargingState: 'Charging' },
      });
      expect(r[0]).toBe(3);

      await new Promise((r) => setTimeout(r, 2_000));

      const rows = await ctx.db.query<{ isActive: boolean }>(
        `SELECT "isActive" FROM "Reservations"
          WHERE "stationId" = $1 AND "reservationId" = $2`,
        [STATION_ID, RESERVATION_ID],
      );
      expect(rows.rows).toHaveLength(1);
      expect(rows.rows[0].isActive).toBe(false);
    } finally {
      ws.close();
    }
  }, 60_000);
});
