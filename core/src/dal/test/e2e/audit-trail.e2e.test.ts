// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: OcppMessages audit trail captures every frame on a CSMS round-trip.
 *
 * Drives a CSMS-initiated Reset through the REST endpoint with a fake
 * charger that ACKs the CALL. Asserts the audit table contains both:
 *   • a `csms`-origin / state=1 row (CSMS sent the CALL)
 *   • a `cs`-origin   / state=2 row (charger sent the CALL_RESULT)
 * with the same `correlationId` and `action='Reset'`.
 *
 * NestJS-only — legacy uses a different REST surface for CSMS-initiated
 * calls and a different audit-table shape.
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

const STATION_ID = uniqueStationId('AUDIT');

let ctx: TestServerHandle;
let charger: WebSocket;

beforeAll(async () => {
  if (TARGET !== 'nestjs') {
    console.log(`[audit-trail] skipped — target=${TARGET}, NestJS-only`);
    return;
  }

  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);

  // Fake charger: ACKs every Reset CALL with `{status: 'Accepted'}`.
  charger = new WebSocket(`${ctx.wsUrl}/${STATION_ID}`, ['ocpp2.0.1']);
  await new Promise<void>((resolve, reject) => {
    charger.once('open', () => resolve());
    charger.once('error', reject);
  });
  charger.on('message', (data) => {
    const frame = JSON.parse(data.toString()) as unknown[];
    const [type, msgId, action] = frame as [number, string, string];
    if (type === 2 && action === 'Reset') {
      charger.send(JSON.stringify([3, msgId, { status: 'Accepted' }]));
    }
  });
}, 180_000);

afterAll(async () => {
  if (TARGET !== 'nestjs') return;
  charger?.close();
  await ctx?.shutdown();
});

describe(`OcppMessages audit trail — target=${TARGET}`, () => {
  it.skipIf(TARGET !== 'nestjs')(
    'persists the CSMS CALL and charger CALL_RESULT for a Reset round-trip',
    async () => {
      // Allow the fake charger's WS to fully bind on the server side.
      await new Promise((r) => setTimeout(r, 500));

      const res = await fetch(`${ctx.httpUrl}/data/provisioning/reset/${STATION_ID}?tenantId=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Immediate' }),
      });
      expect(res.ok).toBe(true);

      // Allow async audit writes to drain.
      await new Promise((r) => setTimeout(r, 1_500));

      const rows = await ctx.db.query<{
        origin: string;
        state: number;
        action: string;
        correlationId: string;
      }>(
        `SELECT "origin", "state", "action", "correlationId"
           FROM "OcppMessages"
          WHERE "stationId" = $1 AND "action" = 'Reset'
          ORDER BY "createdAt" ASC`,
        [STATION_ID],
      );

      const csmsCall = rows.rows.find((r) => r.origin === 'csms' && r.state === 1);
      const chargerResult = rows.rows.find((r) => r.origin === 'cs' && r.state === 2);

      expect(csmsCall, 'CSMS-origin Reset CALL row missing').toBeDefined();
      expect(chargerResult, 'charger-origin Reset CALL_RESULT row missing').toBeDefined();
      expect(csmsCall!.correlationId).toBe(chargerResult!.correlationId);
    },
    60_000,
  );
});
