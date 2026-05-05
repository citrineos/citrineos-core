// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: RemoteCommands tracking on CSMS-initiated round-trips.
 *
 * Drives a CSMS-initiated Reset via REST, fakes the charger ACKing
 * `{status: 'Accepted'}`, and asserts a row lands in `RemoteCommands`
 * with `result='accepted'` plus the request and response payloads.
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

const STATION_ID = uniqueStationId('REMCMD');

let ctx: TestServerHandle;
let charger: WebSocket;

beforeAll(async () => {
  if (TARGET !== 'nestjs') return;
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);

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

describe(`RemoteCommands tracking — target=${TARGET}`, () => {
  it.skipIf(TARGET !== 'nestjs')(
    'records a row with result=accepted for a Reset round-trip',
    async () => {
      await new Promise((r) => setTimeout(r, 500));

      const res = await fetch(
        `${ctx.httpUrl}/ocpp/2.0.1/configuration/reset?identifier=${STATION_ID}&tenantId=1`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'Immediate' }),
        },
      );
      expect(res.ok).toBe(true);

      await new Promise((r) => setTimeout(r, 1_500));

      const rows = await ctx.db.query<{
        action: string;
        result: string;
        requestPayload: Record<string, unknown>;
        responsePayload: Record<string, unknown>;
      }>(
        `SELECT "action", "result", "requestPayload", "responsePayload"
           FROM "RemoteCommands"
          WHERE "stationId" = $1 AND "action" = 'Reset'
          ORDER BY "createdAt" DESC
          LIMIT 1`,
        [STATION_ID],
      );
      expect(rows.rows).toHaveLength(1);
      expect(rows.rows[0].result).toBe('accepted');
      expect(rows.rows[0].requestPayload).toMatchObject({ type: 'Immediate' });
      expect(rows.rows[0].responsePayload).toMatchObject({ status: 'Accepted' });
    },
    60_000,
  );
});
