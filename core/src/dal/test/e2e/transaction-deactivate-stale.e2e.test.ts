// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E parity: deactivate stale active transactions on TransactionEvent.Started.
 *
 * Drives two back-to-back Started events on the same EVSE. Asserts:
 *   • The first Transaction row is deactivated (`isActive = false`)
 *   • The second Transaction row is active (`isActive = true`)
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

const STATION_ID = uniqueStationId('TX-STALE');
const TX_ID_OLD = 'tx-stale-old-' + Date.now();
const TX_ID_NEW = 'tx-stale-new-' + Date.now();
const ID_TOKEN = 'tok-stale-001';

let ctx: TestServerHandle;

function startedEvent(transactionId: string, seq: number) {
  return {
    eventType: 'Started',
    timestamp: new Date().toISOString(),
    triggerReason: 'Authorized',
    seqNo: seq,
    idToken: { idToken: ID_TOKEN, type: 'Central' },
    evse: { id: 1, connectorId: 1 },
    transactionInfo: { transactionId, chargingState: 'Charging' },
  };
}

beforeAll(async () => {
  console.log(`[transaction-deactivate-stale] target = ${TARGET}`);
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

describe(`TransactionEvent.Started deactivate-stale — target=${TARGET}`, () => {
  it('marks the prior active transaction inactive when a new Started arrives on the same EVSE', async () => {
    const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

    try {
      const r1 = await sendCall(
        ws,
        crypto.randomUUID(),
        'TransactionEvent',
        startedEvent(TX_ID_OLD, 0),
      );
      expect(r1[0]).toBe(3);

      await new Promise((r) => setTimeout(r, 1_000));

      const r2 = await sendCall(
        ws,
        crypto.randomUUID(),
        'TransactionEvent',
        startedEvent(TX_ID_NEW, 0),
      );
      expect(r2[0]).toBe(3);

      await new Promise((r) => setTimeout(r, 2_000));

      const oldRow = await ctx.db.query<{ isActive: boolean }>(
        `SELECT "isActive" FROM "Transactions"
          WHERE "stationId" = $1 AND "transactionId" = $2`,
        [STATION_ID, TX_ID_OLD],
      );
      expect(oldRow.rows).toHaveLength(1);
      expect(oldRow.rows[0].isActive).toBe(false);

      const newRow = await ctx.db.query<{ isActive: boolean }>(
        `SELECT "isActive" FROM "Transactions"
          WHERE "stationId" = $1 AND "transactionId" = $2`,
        [STATION_ID, TX_ID_NEW],
      );
      expect(newRow.rows).toHaveLength(1);
      expect(newRow.rows[0].isActive).toBe(true);
    } finally {
      ws.close();
    }
  }, 60_000);
});
