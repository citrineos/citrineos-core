// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: AMQP consumer count stays bounded as chargers connect/disconnect.
 *
 * The router queue and module queues each have ONE consumer regardless of how
 * many stations are connected. Per-charger routing happens via headers-binding,
 * not via additional consumers. This test verifies that invariant.
 *
 * Skipped under target=old.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { TARGET } from './helpers/server-target.js';
import {
  type TestServerHandle,
  seedChargingStation,
  startTestServer,
} from './helpers/test-server.js';

const N_CHARGERS = 50;

let ctx: TestServerHandle;

async function consumerCount(): Promise<number> {
  const res = await fetch(`http://localhost:${ctx.rabbitMgmtPort}/api/consumers`, {
    headers: { Authorization: 'Basic ' + Buffer.from('guest:guest').toString('base64') },
  });
  if (!res.ok) return -1;
  const list = (await res.json()) as unknown[];
  return list.length;
}

beforeAll(async () => {
  console.log(`[amqp-scaling] target = ${TARGET}`);
  ctx = await startTestServer({ healthTimeoutMs: 240_000 });

  // Pre-seed all stationIds the test connects with.
  for (let i = 0; i < N_CHARGERS; i++) {
    await seedChargingStation(ctx.db, `SCALE-CP-${i.toString().padStart(3, '0')}`);
  }
}, 240_000);

afterAll(async () => {
  await ctx?.shutdown();
});

describe.skipIf(TARGET === 'old')(`AMQP consumer-count invariant — target=${TARGET}`, () => {
  it(`stays bounded with ${N_CHARGERS} connected chargers (no per-charger consumer growth)`, async () => {
    await new Promise((r) => setTimeout(r, 2_000));
    const baseline = await consumerCount();
    expect(baseline).toBeGreaterThan(0);

    const sockets = await Promise.all(
      Array.from({ length: N_CHARGERS }, (_, i) => {
        const id = `SCALE-CP-${i.toString().padStart(3, '0')}`;
        return new Promise<WebSocket>((resolve, reject) => {
          const ws = new WebSocket(`${ctx.wsUrl}/${id}`, ['ocpp2.0.1']);
          ws.once('open', () => resolve(ws));
          ws.once('error', reject);
        });
      }),
    );
    expect(sockets).toHaveLength(N_CHARGERS);

    await new Promise((r) => setTimeout(r, 2_000));
    const afterConnect = await consumerCount();

    // The invariant: consumer count does NOT grow with charger count.
    expect(afterConnect).toBe(baseline);

    for (const ws of sockets) ws.close();
    await new Promise((r) => setTimeout(r, 2_000));
    const afterDisconnect = await consumerCount();
    expect(afterDisconnect).toBe(baseline);
  }, 120_000);
});
