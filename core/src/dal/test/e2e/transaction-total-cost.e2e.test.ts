// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: Transaction.totalCost on TransactionEvent.Ended.
 *
 * Drives Started → Updated×2 → Ended with `Energy.Active.Import.Register`
 * samples 0 / 1500 / 3000 W·h. With `flatRateCost.pricePerKwh = 0.30`,
 * totalKwh = 3.0 → totalCost = 0.90.
 *
 * NestJS-only.
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

const STATION_ID = uniqueStationId('TX-COST');
const TX_ID = 'tx-cost-' + Date.now();
const ID_TOKEN = 'tok-tx-cost-001';

let ctx: TestServerHandle;

beforeAll(async () => {
  if (TARGET !== 'nestjs') return;
  ctx = await startTestServer({
    modulesOverride: {
      transactions: {
        // Disable periodic CostNotifier — we want only the final-tick cost write.
        costUpdatedInterval: 0,
        flatRateCost: { pricePerKwh: '0.30', currency: 'USD' },
      },
    },
  });
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
  if (TARGET !== 'nestjs') return;
  await ctx?.shutdown();
});

describe(`TransactionEvent totalCost — target=${TARGET}`, () => {
  it.skipIf(TARGET !== 'nestjs')(
    'computes totalCost = totalKwh × flatRateCost.pricePerKwh on Ended',
    async () => {
      const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

      try {
        // Started @ 0 W·h
        await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
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

        for (const w of [1500, 3000]) {
          await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
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
        }

        await sendCall(ws, crypto.randomUUID(), 'TransactionEvent', {
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

        await new Promise((r) => setTimeout(r, 2_500));

        const tx = await ctx.db.query<{
          totalKwh: string | null;
          totalCost: string | null;
          currency: string | null;
        }>(
          `SELECT "totalKwh", "totalCost", "currency"
             FROM "Transactions"
            WHERE "stationId" = $1 AND "transactionId" = $2`,
          [STATION_ID, TX_ID],
        );
        expect(tx.rows).toHaveLength(1);
        expect(Number(tx.rows[0].totalKwh ?? '0')).toBeCloseTo(3.0, 2);
        expect(Number(tx.rows[0].totalCost ?? '0')).toBeCloseTo(0.9, 2);
        expect(tx.rows[0].currency).toBe('USD');
      } finally {
        ws.close();
      }
    },
    60_000,
  );
});
