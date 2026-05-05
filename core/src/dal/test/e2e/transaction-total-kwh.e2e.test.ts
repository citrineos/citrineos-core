// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E parity: Transaction.totalKwh recompute on TransactionEvent.
 *
 * Both targets compute totalKwh as `(max − min) / 1000` over the
 * `Energy.Active.Import.Register` samples seen for a transaction. With
 * the seeded samples below (`0`, `1500`, `3000` W·h) the expected
 * totalKwh is `3.0`.
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

const STATION_ID = uniqueStationId('TX-KWH');
const TX_ID = 'tx-kwh-' + Date.now();
const ID_TOKEN = 'tok-tx-kwh-001';

let ctx: TestServerHandle;

beforeAll(async () => {
  console.log(`[transaction-total-kwh] target = ${TARGET}`);
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

describe(`TransactionEvent totalKwh — target=${TARGET}`, () => {
  it('computes totalKwh as max−min of Energy.Active.Import.Register samples', async () => {
    const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

    try {
      // Started @ 0 W·h
      const startResp = await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
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
      expect(startResp[0]).toBe(3);

      for (const w of [1500, 3000]) {
        const r = await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
          eventType: 'Updated',
          timestamp: new Date().toISOString(),
          triggerReason: 'MeterValuePeriodic',
          seqNo: w === 1500 ? 1 : 2,
          transactionInfo: { transactionId: TX_ID, chargingState: 'Charging' },
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValue: [{ value: w, measurand: 'Energy.Active.Import.Register' }],
            },
          ],
        });
        expect(r[0]).toBe(3);
      }

      const endResp = await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
        eventType: 'Ended',
        timestamp: new Date().toISOString(),
        triggerReason: 'EVDeparted',
        seqNo: 3,
        transactionInfo: {
          transactionId: TX_ID,
          chargingState: 'Idle',
          stoppedReason: 'EVDisconnected',
        },
      });
      expect(endResp[0]).toBe(3);

      await new Promise((r) => setTimeout(r, 2_000));

      const tx = await ctx.db.query<{ totalKwh: string | null }>(
        `SELECT "totalKwh" FROM "Transactions"
          WHERE "stationId" = $1 AND "transactionId" = $2`,
        [STATION_ID, TX_ID],
      );
      expect(tx.rows).toHaveLength(1);
      const total = Number(tx.rows[0].totalKwh ?? '0');
      expect(total).toBeGreaterThan(0);
      expect(total).toBeCloseTo(3.0, 2);
    } finally {
      ws.close();
    }
  }, 60_000);
});
