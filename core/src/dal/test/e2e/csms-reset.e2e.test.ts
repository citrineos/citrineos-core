// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: CSMS-initiated Reset round-trip.
 *
 * Validates the bidirectional contract: REST → AmqpService.sendCall → router →
 * WS → charger → charger CALL_RESULT → router publishes → cache → REST returns 200.
 *
 * Skipped under target=old.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { TARGET } from './helpers/server-target.js';
import { type TestServerHandle, startTestServer, uniqueStationId } from './helpers/test-server.js';

const STATION_ID = uniqueStationId('RESET');

let ctx: TestServerHandle;
let charger: WebSocket;

beforeAll(async () => {
  console.log(`[csms-reset] target = ${TARGET}`);
  ctx = await startTestServer();

  // Connect a charger that we control: it will receive the Reset CALL and
  // reply with a Result so the REST handler can resolve.
  charger = await new Promise<WebSocket>((resolve, reject) => {
    const sock = new WebSocket(`${ctx.wsUrl}/${STATION_ID}`, ['ocpp2.0.1']);
    sock.once('open', () => resolve(sock));
    sock.once('error', reject);
  });

  charger.on('message', (data) => {
    const frame = JSON.parse(data.toString()) as unknown[];
    if (frame[0] === 2 && frame[2] === 'Reset') {
      charger.send(JSON.stringify([3, frame[1], { status: 'Accepted' }]));
    }
  });

  // Tiny delay to let the router register the WS binding before the REST call.
  await new Promise((r) => setTimeout(r, 500));
}, 240_000);

afterAll(async () => {
  charger?.close();
  await ctx?.shutdown();
});

describe.skipIf(TARGET === 'old')(`CSMS Reset round-trip — target=${TARGET}`, () => {
  it('REST POST /data/provisioning/reset → charger answers Accepted → REST returns Accepted', async () => {
    const res = await fetch(`${ctx.httpUrl}/data/provisioning/reset/${STATION_ID}?tenantId=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'Immediate' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('Accepted');
  }, 45_000);
});
