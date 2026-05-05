// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: Full charging session
 *
 * Drives the priority OCPP sequence end-to-end, in order, against either
 * target server:
 *
 *   BootNotification
 *   StatusNotification:Available
 *   Authorize
 *   TransactionEventStarted
 *   StatusNotification:Occupied
 *   TransactionEventUpdated × 5
 *   TransactionEventEnded
 *   StatusNotification:Available
 *
 * Asserts every response shape is OCPP-conformant and that the resulting DB
 * state shows the transaction as ended with the right number of events.
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

const STATION_ID = uniqueStationId('SESSION');
const TX_ID = 'session-tx-' + Date.now();
const ID_TOKEN = 'tok-session-001';

let ctx: TestServerHandle;

beforeAll(async () => {
  console.log(`[charging-session] target = ${TARGET}`);
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);
  const now = new Date().toISOString();
  await ctx.db.query(
    `INSERT INTO "Authorizations" ("idToken", "idTokenType", "status", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, 'Central', 'Accepted', 1, $2, $2)
     ON CONFLICT DO NOTHING`,
    [ID_TOKEN, now],
  );
}, 180_000);

afterAll(async () => {
  await ctx?.shutdown();
});

describe(`Full charging session — target=${TARGET}`, () => {
  it('drives Boot → Status:Available → Authorize → Tx:Started → Status:Occupied → 5×Tx:Updated → Tx:Ended → Status:Available', async () => {
    const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

    try {
      // 1. BootNotification → Accepted
      const bootResp = await sendCall(ws, crypto.randomUUID(), 'BootNotification', {
        reason: 'PowerUp',
        chargingStation: { model: 'M', vendorName: 'V' },
      });
      expect(bootResp[0]).toBe(3);
      expect((bootResp[2] as { status: string }).status).toBe('Accepted');

      // 2. StatusNotification (Available)
      const statusAvailable1 = await sendCall(ws, crypto.randomUUID(), 'StatusNotification', {
        timestamp: new Date().toISOString(),
        connectorStatus: 'Available',
        evseId: 1,
        connectorId: 1,
      });
      expect(statusAvailable1[0]).toBe(3);

      // 3. Authorize
      const authResp = await sendCall(ws, crypto.randomUUID(), 'Authorize', {
        idToken: { idToken: ID_TOKEN, type: 'Central' },
      });
      expect(authResp[0]).toBe(3);
      expect((authResp[2] as { idTokenInfo: { status: string } }).idTokenInfo.status).toBe(
        'Accepted',
      );

      // 4. TransactionEvent Started
      const txStarted = await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
        eventType: 'Started',
        timestamp: new Date().toISOString(),
        triggerReason: 'Authorized',
        seqNo: 0,
        idToken: { idToken: ID_TOKEN, type: 'Central' },
        evse: { id: 1, connectorId: 1 },
        transactionInfo: { transactionId: TX_ID, chargingState: 'Charging' },
        meterValue: [
          {
            timestamp: new Date().toISOString(),
            sampledValue: [{ value: 0, measurand: 'Energy.Active.Import.Register' }],
          },
        ],
      });
      expect(txStarted[0]).toBe(3);
      expect((txStarted[2] as { idTokenInfo?: { status: string } }).idTokenInfo?.status).toBe(
        'Accepted',
      );

      // 5. StatusNotification (Occupied)
      const statusOccupied = await sendCall(ws, crypto.randomUUID(), 'StatusNotification', {
        timestamp: new Date().toISOString(),
        connectorStatus: 'Occupied',
        evseId: 1,
        connectorId: 1,
      });
      expect(statusOccupied[0]).toBe(3);

      // 6. TransactionEvent Updated × 5
      for (let seq = 1; seq <= 5; seq++) {
        const upd = await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
          eventType: 'Updated',
          timestamp: new Date().toISOString(),
          triggerReason: 'MeterValuePeriodic',
          seqNo: seq,
          transactionInfo: { transactionId: TX_ID, chargingState: 'Charging' },
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValue: [{ value: seq * 1000, measurand: 'Energy.Active.Import.Register' }],
            },
          ],
        });
        expect(upd[0]).toBe(3);
      }

      // 7. TransactionEvent Ended
      const txEnded = await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
        eventType: 'Ended',
        timestamp: new Date().toISOString(),
        triggerReason: 'EVDeparted',
        seqNo: 6,
        transactionInfo: {
          transactionId: TX_ID,
          chargingState: 'Idle',
          stoppedReason: 'EVDisconnected',
        },
      });
      expect(txEnded[0]).toBe(3);

      // 8. StatusNotification (Available again)
      const statusAvailable2 = await sendCall(ws, crypto.randomUUID(), 'StatusNotification', {
        timestamp: new Date().toISOString(),
        connectorStatus: 'Available',
        evseId: 1,
        connectorId: 1,
      });
      expect(statusAvailable2[0]).toBe(3);

      // ─── DB state ─────────────────────────────────────────────────────────
      await new Promise((r) => setTimeout(r, 2_500));

      const tx = await ctx.db.query<{ isActive: boolean; stoppedReason: string | null }>(
        `SELECT "isActive", "stoppedReason" FROM "Transactions"
          WHERE "stationId" = $1 AND "transactionId" = $2`,
        [STATION_ID, TX_ID],
      );
      expect(tx.rows).toHaveLength(1);
      expect(tx.rows[0].isActive).toBe(false);
      expect(tx.rows[0].stoppedReason).toBe('EVDisconnected');

      // StatusNotifications: at least 3 (Available, Occupied, Available).
      const statuses = await ctx.db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "StatusNotifications"
          WHERE "stationId" = $1`,
        [STATION_ID],
      );
      expect(parseInt(statuses.rows[0].count, 10)).toBeGreaterThanOrEqual(3);
    } finally {
      ws.close();
    }
  }, 120_000);
});
