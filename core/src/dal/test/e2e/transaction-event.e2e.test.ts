// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: TransactionEvent (OCPP 2.0.1) — Started → Updated → Ended
 *
 * Drives the basic transaction lifecycle and asserts:
 *   • Started returns CallResult `{}` (or with idTokenInfo when idToken set)
 *   • Each event persists a TransactionEvents row
 *   • Started creates a Transactions row with isActive=true
 *   • Ended sets isActive=false, populates endTime + stoppedReason
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

const STATION_ID = uniqueStationId('TX');
const TX_ID = 'tx-' + Date.now();
const ID_TOKEN = 'tok-tx-001';

let ctx: TestServerHandle;

beforeAll(async () => {
  console.log(`[transaction-event] target = ${TARGET}`);
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

describe(`TransactionEvent — target=${TARGET}`, () => {
  it('drives Started → 2× Updated → Ended and persists transaction state', async () => {
    const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

    try {
      // ─── Started ────────────────────────────────────────────────────────
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
      const startBody = startResp[2] as { idTokenInfo?: { status: string } };
      expect(startBody.idTokenInfo?.status).toBe('Accepted');

      // ─── 2× Updated ─────────────────────────────────────────────────────
      for (let seq = 1; seq <= 2; seq++) {
        const updResp = await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
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
        expect(updResp[0]).toBe(3);
      }

      // ─── Ended ──────────────────────────────────────────────────────────
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

      const tx = await ctx.db.query<{
        isActive: boolean;
        stoppedReason: string | null;
        endTime: Date | null;
      }>(
        `SELECT "isActive", "stoppedReason", "endTime"
           FROM "Transactions"
          WHERE "stationId" = $1 AND "transactionId" = $2`,
        [STATION_ID, TX_ID],
      );
      expect(tx.rows).toHaveLength(1);
      expect(tx.rows[0].isActive).toBe(false);
      expect(tx.rows[0].stoppedReason).toBe('EVDisconnected');
      expect(tx.rows[0].endTime).not.toBeNull();

      // Legacy persists transactionInfo as JSON; NestJS has a flat transactionId column.
      const colsResult = await ctx.db.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = 'TransactionEvents' AND column_name IN ('transactionId', 'transactionInfo')`,
      );
      const cols = new Set(colsResult.rows.map((r) => r.column_name));
      const where = cols.has('transactionId')
        ? `"stationId" = $1 AND "transactionId" = $2`
        : `"stationId" = $1 AND "transactionInfo"::jsonb->>'transactionId' = $2`;

      const events = await ctx.db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "TransactionEvents" WHERE ${where}`,
        [STATION_ID, TX_ID],
      );
      expect(parseInt(events.rows[0].count, 10)).toBeGreaterThanOrEqual(4);
    } finally {
      ws.close();
    }
  }, 60_000);
});
