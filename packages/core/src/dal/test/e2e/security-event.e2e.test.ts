// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: SecurityEventNotification over OCPP WebSocket
 *
 * Spins up real PostgreSQL and RabbitMQ containers via testcontainers, runs the
 * real sequelize-cli migrations against the test DB (same path as production),
 * then starts the CitrineOS server as a child process.
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

import { execSync, spawn, type ChildProcess } from 'child_process';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Client } from 'pg';
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { createLocalConfig } from '../../../../../../apps/ocpp-server/src/config/envs/local.js';
import { aSecurityEventNotificationRequest } from '../providers/SecurityEvent.js';

// ─── Paths (resolved relative to this file) ───────────────────────────────────

const SERVER_ROOT = fileURLToPath(new URL('../../../../../../apps/ocpp-server/', import.meta.url));
const SERVER_DIST = fileURLToPath(
  new URL('../../../../../../apps/ocpp-server/dist/index.js', import.meta.url),
);

// ─── Ports used by the server under test ─────────────────────────────────────

const HTTP_PORT = 8080; // Fastify API + /health endpoint
const WS_PORT = 8081; // OCPP WebSocket (allowUnknownChargingStations: true)

// ─── Shared state across all scenarios ────────────────────────────────────────

let pgContainer: StartedTestContainer;
let rabbitContainer: StartedTestContainer;
let pgPort: number;
let rabbitPort: number;
let tempDir: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTestEnv(extraEnv: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    // DB connection — overrides the bootstrap config defaults so we hit the
    // testcontainer PG instead of any local instance.
    BOOTSTRAP_CITRINEOS_DATABASE_HOST: 'localhost',
    BOOTSTRAP_CITRINEOS_DATABASE_PORT: String(pgPort),
    BOOTSTRAP_CITRINEOS_DATABASE_NAME: 'postgres',
    BOOTSTRAP_CITRINEOS_DATABASE_USERNAME: 'postgres',
    BOOTSTRAP_CITRINEOS_DATABASE_PASSWORD: 'postgres',
    // System config file — points at our pre-written config.json in tempDir.
    BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE: 'local',
    BOOTSTRAP_CITRINEOS_FILE_ACCESS_LOCAL_DEFAULT_FILE_PATH: tempDir,
    BOOTSTRAP_CITRINEOS_CONFIG_FILENAME: 'config.json',
    // App config
    APP_ENV: 'local',
    APP_NAME: 'all',
    ...extraEnv,
  };
}

function spawnServer(extraEnv: Record<string, string> = {}): ChildProcess {
  return spawn('node', [SERVER_DIST], {
    env: buildTestEnv(extraEnv),
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
  // Start containers in parallel.
  [pgContainer, rabbitContainer] = await Promise.all([
    new GenericContainer('postgis/postgis:16-3.5')
      .withEnvironment({
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
        POSTGRES_DB: 'postgres',
      })
      .withExposedPorts(5432)
      // postgis/postgis restarts postgres after running PostGIS init scripts,
      // so "ready to accept connections" appears twice. Wait for the second.
      .withWaitStrategy(Wait.forLogMessage('ready to accept connections', 2))
      .start(),

    new GenericContainer('rabbitmq:3-management-alpine')
      .withExposedPorts(5672, 15672)
      .withWaitStrategy(Wait.forLogMessage('Server startup complete', 1))
      .start(),
  ]);

  pgPort = pgContainer.getMappedPort(5432);
  rabbitPort = rabbitContainer.getMappedPort(5672);

  // Build the system config by reusing the real local.ts config function, then
  // patch only the AMQP URL to point at the testcontainer RabbitMQ port.
  // We also strip the second WS server (port 8082, securityProfile 1) to avoid
  // a bind conflict when the first server is still releasing that port.
  const config = createLocalConfig();
  config.util.messageBroker.amqp!.url = `amqp://guest:guest@localhost:${rabbitPort}`;
  config.util.networkConnection.websocketServers =
    config.util.networkConnection.websocketServers.filter((s) => s.securityProfile === 0);

  tempDir = mkdtempSync(join(tmpdir(), 'citrineos-e2e-'));
  writeFileSync(join(tempDir, 'config.json'), JSON.stringify(config, null, 2));

  // Run the real sequelize-cli migrations against the testcontainer DB.
  // sequelize.bridge.config.ts reads BOOTSTRAP_CITRINEOS_DATABASE_* env vars,
  // so the same vars we use to start the server point migrations at test PG.
  // This also runs 20250430110000-create-default-tenant which seeds Tenant id=1.
  execSync('pnpm run db:migrate', {
    cwd: SERVER_ROOT,
    env: buildTestEnv(),
    stdio: 'inherit',
  });

  // Seed a ChargingStation row for each test scenario stationId.
  // The trigger populate_station_pk_id() on OCPPMessages requires a matching
  // ChargingStations row; without it the trigger raises an error that causes
  // the router to return a CALLERROR before the Reporting module can respond.
  const seedClient = new Client({
    host: 'localhost',
    port: pgPort,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });
  await seedClient.connect();
  const now = new Date().toISOString();
  for (const stationId of ['E2E-CP-SEQUELIZE', 'E2E-CP-DRIZZLE']) {
    await seedClient.query(
      `INSERT INTO "ChargingStations" ("ocppConnectionName", "isOnline", "createdAt", "updatedAt", "tenantId")
       VALUES ($1, false, $2, $3, 1)
       ON CONFLICT DO NOTHING`,
      [stationId, now, now],
    );
  }
  await seedClient.end();
}, 120_000);

afterAll(async () => {
  await Promise.allSettled([pgContainer?.stop(), rabbitContainer?.stop()]);
});

// ─── Test scenarios ───────────────────────────────────────────────────────────

describe.each([
  { label: 'Sequelize', extraEnv: {} },
  { label: 'Drizzle', extraEnv: { CITRINEOS_USE_DRIZZLE_SECURITY_EVENT: 'true' } },
])('SecurityEventNotification [$label]', ({ label, extraEnv }) => {
  let server: ChildProcess;
  let db: Client;

  // Unique stationId per scenario so rows from each run don't collide.
  const stationId = `E2E-CP-${label.toUpperCase()}`;

  beforeAll(async () => {
    console.log(
      `Starting server for scenario "${label}" with ports PG:${pgPort} RMQ:${rabbitPort}...`,
    );
    server = spawnServer(extraEnv);

    // Surface server output so failures are debuggable without digging into logs.
    server.stdout?.on('data', (c: Buffer) => process.stdout.write(`[server:${label}] ${c}`));
    server.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(`[server:${label}] ${chunk}`);
    });

    await waitForHealth(45_000);

    // Open a direct pg connection for the DB assertion step.
    db = new Client({
      host: 'localhost',
      port: pgPort,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    });
    await db.connect();
  }, 60_000);

  afterAll(async () => {
    await db?.end();
    if (server) await killServer(server);
  }, 30_000);

  it('returns a CallResult and persists the SecurityEvent record', async () => {
    const msgId = crypto.randomUUID();
    const payload = aSecurityEventNotificationRequest({ type: 'SecurityLogWasCleared' });

    const ws = await connectOcpp(stationId);

    try {
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
    } finally {
      ws.close();
    }
  }, 30_000);
});
