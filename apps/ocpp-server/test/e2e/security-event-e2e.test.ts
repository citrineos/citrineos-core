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
 * CITRINEOS_USE_DRIZZLE=true — confirming both write the same record.
 *
 * Prerequisites: run `pnpm run test:e2e` (which builds first) rather than
 * `pnpm test`, since the server child process needs ocpp-server/dist/index.js to be
 * current and sequelize-cli needs dist/migrations/*.
 *
 * Why no manual Tenant seed?
 *   The migration 20250430110000-create-default-tenant inserts Tenant id=1
 *   automatically, so we rely on the real migration path here.
 */

import { type ChildProcess, execSync, spawn } from 'child_process';
import { mkdtempSync, writeFileSync } from 'fs';
import { type AddressInfo, createServer } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';
import { Client } from 'pg';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { aSecurityEventNotificationRequest } from '../providers/security-event.js';

// ─── Paths (resolved relative to this file) ───────────────────────────────────

const SERVER_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SERVER_DIST = fileURLToPath(new URL('../../dist/index.js', import.meta.url));

// ─── Shared state across all scenarios ────────────────────────────────────────

let pgContainer: StartedTestContainer;
let rabbitContainer: StartedTestContainer;
let pgPort: number;
let rabbitPort: number;
let tempDir: string;

// Assigned in beforeAll. The schema defaults 8080/8081 are deliberately not used - see the
// comment where these are reserved.
let httpPort: number; // Fastify API + /health endpoint
let wsPort: number; // OCPP WebSocket (allowUnknownChargingStations: true)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Asks the OS for a port nothing is listening on. There is an unavoidable gap between closing this
 * probe and the server binding, but that is far narrower a risk than the config's fixed ports,
 * which a developer running the docker-compose stack already owns.
 */
function reserveFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

function buildTestEnv(extraEnv: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    // DB connection — overrides the schema defaults so we hit the testcontainer PG
    // instead of any local instance.
    CITRINEOS_DATABASE_HOST: 'localhost',
    CITRINEOS_DATABASE_PORT: String(pgPort),
    CITRINEOS_DATABASE_DATABASE: 'postgres',
    CITRINEOS_DATABASE_USERNAME: 'postgres',
    CITRINEOS_DATABASE_PASSWORD: 'postgres',
    // File storage rooted at tempDir, which is where websocket-servers.json is written.
    CITRINEOS_FILEACCESS_TYPE: 'local',
    CITRINEOS_FILEACCESS_LOCAL_DEFAULTFILEPATH: tempDir,
    // The testcontainer RabbitMQ, whose port is only known once it has started.
    CITRINEOS_MESSAGEBROKER_AMQP_URL: `amqp://guest:guest@localhost:${rabbitPort}`,
    // The Fastify API port, reserved in beforeAll rather than left on the default 8080.
    CITRINEOS_PORT: String(httpPort),
    // App config
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
      const res = await fetch(`http://localhost:${httpPort}/health/ready`);
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
    const ws = new WebSocket(`ws://localhost:${wsPort}/${stationId}`, ['ocpp2.0.1']);
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

  // Bind both listeners to an ephemeral port instead of the schema defaults 8080/8081.
  // A developer running the docker-compose stack already owns those, and the server spawned below
  // then loses the race to bind - silently, because it dies before its logger produces output.
  // waitForHealth and the OCPP socket would go on to reach *that* server, which happily answers
  // and persists the SecurityEvent to its own database, leaving this test querying an empty
  // testcontainer and reporting a phantom persistence failure.
  [httpPort, wsPort] = await Promise.all([reserveFreePort(), reserveFreePort()]);

  // Everything else about the system config comes from the schema defaults via
  // buildTestEnv(). The websocket servers are the one part that is not an environment
  // variable: they are read from a JSON file through file storage, whose root
  // buildTestEnv() points at tempDir. Only the securityProfile 0 server is listed, so
  // there is nothing on a second port to collide with a port the previous scenario is still
  // releasing.
  tempDir = mkdtempSync(join(tmpdir(), 'citrineos-e2e-'));
  writeFileSync(
    join(tempDir, 'websocket-servers.json'),
    JSON.stringify(
      [
        {
          id: '0',
          host: '0.0.0.0',
          port: wsPort,
          pingInterval: 60,
          protocols: ['ocpp2.1', 'ocpp2.0.1', 'ocpp1.6'],
          securityProfile: 0,
          allowUnknownChargingStations: true,
          tenantId: 1,
        },
      ],
      null,
      2,
    ),
  );

  // Run the real sequelize-cli migrations against the testcontainer DB.
  // sequelize-bridge.config.ts reads CITRINEOS_DATABASE_* env vars,
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

const SCENARIOS: ReadonlyArray<{ label: string; extraEnv: Record<string, string> }> = [
  { label: 'Sequelize', extraEnv: {} },
  { label: 'Drizzle', extraEnv: { CITRINEOS_USE_DRIZZLE: 'true' } },
];

describe.each(SCENARIOS)('SecurityEventNotification [$label]', ({ label, extraEnv }) => {
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
