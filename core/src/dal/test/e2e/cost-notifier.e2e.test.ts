// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: CostNotifier fires a periodic CostUpdated CALL while a
 * transaction is active.
 *
 * Configures `costUpdatedInterval=2`s + `flatRateCost.pricePerKwh=0.30`.
 * Drives a TransactionEvent.Started with a meter sample at 5000 W·h
 * (= 5 kWh → expected $1.50). Asserts the charger receives a
 * `CostUpdated` CALL within ~6s with the expected `totalCost`.
 *
 * NestJS-only.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { TARGET } from './helpers/server-target.js';
import {
  type TestServerHandle,
  seedChargingStation,
  startTestServer,
  uniqueStationId,
} from './helpers/test-server.js';

const STATION_ID = uniqueStationId('COSTNOTIFIER');
const TX_ID = 'tx-cn-' + Date.now();
const ID_TOKEN = 'tok-cn-001';

let ctx: TestServerHandle;

beforeAll(async () => {
  if (TARGET !== 'nestjs') return;
  ctx = await startTestServer({
    modulesOverride: {
      transactions: {
        costUpdatedInterval: 2,
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

describe(`CostNotifier periodic dispatch — target=${TARGET}`, () => {
  it.skipIf(TARGET !== 'nestjs')(
    'sends a CostUpdated CALL within ~6s of Started, with totalCost = totalKwh × pricePerKwh',
    async () => {
      const ws = new WebSocket(`${ctx.wsUrl}/${STATION_ID}`, ['ocpp2.0.1']);
      await new Promise<void>((resolve, reject) => {
        ws.once('open', () => resolve());
        ws.once('error', reject);
      });

      let costUpdatedFrame: { totalCost?: number; transactionId?: string } | null = null;
      const sawCostUpdated = new Promise<void>((resolve) => {
        ws.on('message', (data) => {
          const frame = JSON.parse(data.toString()) as unknown[];
          const [type, msgId, action, payload] = frame as [
            number,
            string,
            string,
            Record<string, unknown>,
          ];
          if (type === 2 && action === 'CostUpdated') {
            costUpdatedFrame = payload as { totalCost?: number; transactionId?: string };
            ws.send(JSON.stringify([3, msgId, {}]));
            resolve();
          }
        });
      });

      const started = JSON.stringify([
        2,
        crypto.randomUUID(),
        'TransactionEvent',
        {
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
              sampledValue: [{ value: 5000, measurand: 'Energy.Active.Import.Register' }],
            },
          ],
        },
      ]);
      ws.send(started);

      await Promise.race([
        sawCostUpdated,
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('CostUpdated CALL not received within 6s')), 6_000),
        ),
      ]);

      expect(costUpdatedFrame).not.toBeNull();
      expect(costUpdatedFrame!.transactionId).toBe(TX_ID);
      expect(costUpdatedFrame!.totalCost).toBeCloseTo(1.5, 2);

      ws.close();
    },
    30_000,
  );
});
