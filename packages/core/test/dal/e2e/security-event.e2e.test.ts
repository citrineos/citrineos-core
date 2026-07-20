// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: SecurityEventNotification over OCPP WebSocket
 *
 * The test verifies the full path:
 *   charger (WS OCPP 2.0.1) → CSMS → Reporting module → SecurityEvents table
 *
 * It runs twice — once with the default Sequelize repository and once with
 * CITRINEOS_USE_DRIZZLE_SECURITY_EVENT=true — confirming both write the same record.
 *
 * Prerequisites: run `pnpm run test:e2e` (which builds first) rather than
 * `pnpm test`, since the server child process needs ocpp-server/dist/index.js to be
 * current and sequelize-cli needs dist/migrations/*.
 *
 * Why no manual Tenant seed?
 *   The migration 20250430110000-create-default-tenant inserts Tenant id=1
 *   automatically, so we rely on the real migration path here.
 */

import { type ChildProcess, spawn } from 'child_process';

import { Client } from 'pg';
import { type StartedTestContainer } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { aSecurityEventNotificationRequest } from '../providers/SecurityEvent.js';
import { DEFAULT_PG_PORT, getDefaultPgClientConfig } from '../utils/containers/pgContainer';
import { buildTestEnv, SERVER_DIST, setup } from '../utils/containers/e2e';

// ─── Ports used by the server under test ─────────────────────────────────────

const HTTP_PORT = 8080; // Fastify API + /health endpoint
const WS_PORT = 8081; // OCPP WebSocket (allowUnknownChargingStations: true)

// ─── Shared state across all scenarios ────────────────────────────────────────

let containers: StartedTestContainer[];
let mappedPgPort: number;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function spawnServer(extraEnv: Record<string, string> = {}): ChildProcess {
  return spawn('node', [SERVER_DIST], {
    env: buildTestEnv(mappedPgPort, extraEnv),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function waitForHealth(timeoutMs = 45_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${HTTP_PORT}/health/ready`);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not become healthy within ${timeoutMs}ms`);
}

async function killServer(proc: ChildProcess): Promise<void> {
  if (proc.exitCode !== null || proc.signalCode !== null) return;
  const exited = new Promise<void>((resolve) => proc.once('exit', () => resolve()));
  proc.kill('SIGTERM');
  const timeout = new Promise<void>((resolve) =>
    setTimeout(() => {
      if (proc.exitCode === null && proc.signalCode === null) proc.kill('SIGKILL');
      resolve();
    }, 10_000),
  );
  await Promise.race([exited, timeout]);
  await exited; // ensure we don't return until the OS has reaped the process
}

// ─── OCPP WebSocket helpers ───────────────────────────────────────────────────

function connectOcpp(stationId: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}/${stationId}`, ['ocpp2.0.1']);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function sendCall(ws: WebSocket, msgId: string, action: string, payload: object): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`No OCPP response for ${action} within 10 s`)),
      10_000,
    );
    ws.once('message', (data) => {
      clearTimeout(timeout);
      try {
        resolve(JSON.parse(data.toString()) as any[]);
      } catch (e) {
        reject(e);
      }
    });
    ws.send(JSON.stringify([2, msgId, action, payload]));
  });
}

// ─── Shared lifecycle: containers + migrations ────────────────────────────────

beforeAll(async () => {
  containers = await setup();
  mappedPgPort = containers[0].getMappedPort(DEFAULT_PG_PORT);
}, 120_000);

afterAll(async () => {
  await Promise.allSettled(containers.map((c) => c.stop()));
});

// ─── Test scenarios ───────────────────────────────────────────────────────────

describe.each([
  { label: 'Sequelize', extraEnv: {} },
  {
    label: 'Drizzle',
    extraEnv: { CITRINEOS_USE_DRIZZLE_SECURITY_EVENT: 'true' } as Record<string, string>,
  },
])('SecurityEventNotification [$label]', ({ label, extraEnv }) => {
  let server: ChildProcess;
  let db: Client;

  // Unique stationId per scenario so rows from each run don't collide.
  const stationId = `E2E-CP-${label.toUpperCase()}`;

  beforeAll(async () => {
    console.log(`Starting server for scenario "${label}"...`);
    server = spawnServer(extraEnv);

    // Surface server output so failures are debuggable without digging into logs.
    server.stdout?.on('data', (c: Buffer) => process.stdout.write(`[server:${label}] ${c}`));
    server.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(`[server:${label}] ${chunk}`);
    });

    await waitForHealth(45_000);

    // Open a direct pg connection for the DB assertion step.
    db = new Client(getDefaultPgClientConfig(mappedPgPort));
    await db.connect();
  }, 60_000);

  afterAll(async () => {
    await db?.end();
    if (server) await killServer(server);
  }, 30_000);

  it('acknowledges and persists both listed and unlisted security event types', async () => {
    const ws = await connectOcpp(stationId);

    try {
      const msgId = crypto.randomUUID();
      const payload = aSecurityEventNotificationRequest({ type: 'SecurityLogWasCleared' });

      // OCPP 2.0.1 Call:   [2, uniqueId, action, payload]
      // OCPP 2.0.1 Result: [3, uniqueId, payload]
      const response = await sendCall(ws, msgId, 'SecurityEventNotification', payload);

      console.log(`[${label}] OCPP response:`, response);
      expect(response[0]).toBe(3);
      expect(response[1]).toBe(msgId);
      expect(response[2]).toEqual({});

      const { rows } = await db.query<{ ocppConnectionName: string; type: string }>(
        `SELECT "ocppConnectionName", "type"
           FROM "SecurityEvents"
          WHERE "ocppConnectionName" = $1
          ORDER BY id DESC
          LIMIT 1`,
        [stationId],
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].ocppConnectionName).toBe(stationId);
      expect(rows[0].type).toBe(payload.type);

      const unlistedMsgId = crypto.randomUUID();
      const unlistedPayload = aSecurityEventNotificationRequest({
        type: 'InvalidCentralSystemCertificate',
      });

      const unlistedResponse = await sendCall(
        ws,
        unlistedMsgId,
        'SecurityEventNotification',
        unlistedPayload,
      );

      console.log(`[${label}] OCPP response (unlisted type):`, unlistedResponse);
      expect(unlistedResponse[0]).toBe(3);
      expect(unlistedResponse[1]).toBe(unlistedMsgId);
      expect(unlistedResponse[2]).toEqual({});

      const { rows: unlistedRows } = await db.query<{ type: string }>(
        `SELECT "type"
           FROM "SecurityEvents"
          WHERE "ocppConnectionName" = $1
          ORDER BY id DESC
          LIMIT 1`,
        [stationId],
      );

      expect(unlistedRows[0].type).toBe(unlistedPayload.type);
    } finally {
      ws.close();
    }
  }, 30_000);
});
