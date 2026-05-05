// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: WebhookService.emit fires `boot.notification` to a configured
 * receiver when a charger sends BootNotification.
 *
 * NestJS-only.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as http from 'http';
import { AddressInfo } from 'net';
import { TARGET } from './helpers/server-target.js';
import {
  type TestServerHandle,
  seedChargingStation,
  startTestServer,
  uniqueStationId,
} from './helpers/test-server.js';
import { connectOcpp, sendCall } from './helpers/ocpp-ws.js';

const STATION_ID = uniqueStationId('WEBHOOK');

interface ReceivedHook {
  eventType: string;
  stationId: string;
  payload: Record<string, unknown>;
}

let ctx: TestServerHandle;
let webhookServer: http.Server;
const received: ReceivedHook[] = [];

async function startWebhookReceiver(): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          received.push(JSON.parse(body) as ReceivedHook);
        } catch {
          // ignore non-JSON requests
        }
        res.writeHead(204);
        res.end();
      });
    });
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address() as AddressInfo;
      resolve({ server: srv, port: addr.port });
    });
  });
}

beforeAll(async () => {
  if (TARGET !== 'nestjs') return;

  const { server, port } = await startWebhookReceiver();
  webhookServer = server;

  ctx = await startTestServer({
    patchConfig: (cfg) => {
      const util = cfg.util as Record<string, unknown>;
      util.webhooks = [{ url: `http://127.0.0.1:${port}`, events: ['boot.notification'] }];
    },
  });
  await seedChargingStation(ctx.db, STATION_ID);
}, 180_000);

afterAll(async () => {
  if (TARGET !== 'nestjs') return;
  await ctx?.shutdown();
  await new Promise<void>((r) => webhookServer?.close(() => r()));
});

describe(`WebhookService.emit — target=${TARGET}`, () => {
  it.skipIf(TARGET !== 'nestjs')(
    'fires boot.notification to the configured receiver after BootNotification',
    async () => {
      const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

      try {
        const resp = await sendCall(ws, crypto.randomUUID(), 'BootNotification', {
          reason: 'PowerUp',
          chargingStation: { model: 'Test-Model', vendorName: 'Test-Vendor' },
        });
        expect(resp[0]).toBe(3);

        await new Promise((r) => setTimeout(r, 1_500));

        const bootEvents = received.filter((e) => e.eventType === 'boot.notification');
        expect(bootEvents.length).toBeGreaterThanOrEqual(1);
        expect(bootEvents[0].stationId).toBe(STATION_ID);
        const payload = bootEvents[0].payload as { request?: Record<string, unknown> };
        expect(payload.request).toBeDefined();
      } finally {
        ws.close();
      }
    },
    60_000,
  );
});
