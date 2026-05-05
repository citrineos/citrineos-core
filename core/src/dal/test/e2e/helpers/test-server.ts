// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * One-call test fixture: boots Postgres + RabbitMQ testcontainers, runs
 * migrations, spawns the CitrineOS server (legacy or nestjs based on
 * `CITRINEOS_TARGET`), waits for `/health`, and returns a handle the
 * test can use to drive WebSocket / REST traffic + assert against the DB.
 *
 * Why this exists
 * ---------------
 * Every e2e test in this directory previously had ~80 lines of
 * `beforeAll` boilerplate to spin up the same infrastructure. That's
 * ~30s of fixture setup × N tests = N × 30s of waiting before any
 * assertions run. This harness collapses the setup to:
 *
 *   const ctx = await startTestServer();
 *   afterAll(() => ctx.shutdown());
 *
 * For even faster runs, vitest's `globalSetup` boots one shared
 * harness for the entire suite — see `helpers/global-setup.ts`. Tests
 * that need a fresh server can still call `startTestServer()` directly.
 */

import { ChildProcess } from 'child_process';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Client } from 'pg';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import {
  HTTP_PORT,
  TARGET,
  WS_BASICAUTH_PORT,
  WS_NOAUTH_PORT,
  runMigrations,
  spawnServer,
  stopServer,
  writeConfigFile,
} from './server-target.js';

export interface TestServerOpts {
  /** Bind the BasicAuth WebSocket server too (port 8082). */
  includeBasicAuth?: boolean;
  /** Per-module config overrides (NestJS-target only — legacy ignores). */
  modulesOverride?: Record<string, Record<string, unknown>>;
  /** Extra env vars passed to the spawned server (e.g. feature flags). */
  extraEnv?: Record<string, string>;
  /** Maximum time to wait for `/health` to come up. */
  healthTimeoutMs?: number;
  /**
   * Mutate the on-disk config JSON after it's written but before the
   * server spawns. Use for setting fields the harness doesn't expose
   * directly (e.g. `util.webhooks`, custom OCPI config sections).
   */
  patchConfig?: (config: Record<string, unknown>) => void;
}

export interface TestServerHandle {
  pgPort: number;
  rabbitPort: number;
  /** RabbitMQ HTTP management port — for asserting consumer counts, etc. */
  rabbitMgmtPort: number;
  httpUrl: string;
  wsUrl: string;
  basicAuthWsUrl?: string;
  /** Connected pg client. Tests can run their own queries on this. */
  db: Client;
  shutdown(): Promise<void>;
}

/**
 * Boot a fresh CitrineOS test instance. Returns a handle whose
 * `shutdown()` tears everything down. Idempotent — call once per
 * `beforeAll` (or once globally via `globalSetup`).
 */
export async function startTestServer(opts: TestServerOpts = {}): Promise<TestServerHandle> {
  const healthTimeoutMs = opts.healthTimeoutMs ?? 120_000;

  const [pgContainer, rabbitContainer] = await Promise.all([
    new GenericContainer('postgis/postgis:16-3.5')
      .withEnvironment({
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
        POSTGRES_DB: 'postgres',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage('ready to accept connections', 2))
      .withStartupTimeout(120_000)
      .start(),
    new GenericContainer('rabbitmq:3-management-alpine')
      .withExposedPorts(5672, 15672)
      .withWaitStrategy(Wait.forLogMessage('Server startup complete', 1))
      .withStartupTimeout(120_000)
      .start(),
  ]);

  const pgPort = pgContainer.getMappedPort(5432);
  const rabbitPort = rabbitContainer.getMappedPort(5672);
  const rabbitMgmtPort = rabbitContainer.getMappedPort(15672);

  const tempDir = mkdtempSync(join(tmpdir(), 'citrineos-e2e-'));
  const configPath = await writeConfigFile(tempDir, {
    rabbitPort,
    includeBasicAuth: opts.includeBasicAuth ?? false,
    modulesOverride: opts.modulesOverride,
  });
  if (opts.patchConfig) {
    const fs = await import('node:fs');
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    opts.patchConfig(cfg);
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
  }
  runMigrations({ pgPort, rabbitPort, tempDir });

  const server = spawnServer({
    pgPort,
    rabbitPort,
    tempDir,
    extraEnv: opts.extraEnv,
  });
  // Capture stderr always (errors should surface), stdout only when verbose.
  server.stderr?.on('data', (chunk: Buffer) => process.stderr.write(`[server:${TARGET}] ${chunk}`));
  server.stdout?.on('data', (chunk: Buffer) => {
    if (process.env.CITRINEOS_E2E_VERBOSE) process.stdout.write(`[server:${TARGET}] ${chunk}`);
  });

  await waitForHealth(healthTimeoutMs);

  const db = new Client({
    host: 'localhost',
    port: pgPort,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });
  await db.connect();

  const handle: TestServerHandle = {
    pgPort,
    rabbitPort,
    rabbitMgmtPort,
    httpUrl: `http://localhost:${HTTP_PORT}`,
    wsUrl: `ws://localhost:${WS_NOAUTH_PORT}`,
    basicAuthWsUrl: opts.includeBasicAuth ? `ws://localhost:${WS_BASICAUTH_PORT}` : undefined,
    db,
    async shutdown() {
      await db.end().catch(() => {});
      await stopServer(server).catch(() => {});
      await Promise.allSettled([pgContainer.stop(), rabbitContainer.stop()]);
    },
  };
  return handle;
}

async function waitForHealth(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${HTTP_PORT}/health`);
      if (res.ok) return;
    } catch {
      /* server not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not become healthy within ${timeoutMs}ms`);
}

/**
 * Helper for tests that just need a stationId seeded into ChargingStations
 * so the OCPP router accepts the WS handshake. Mirrors the inline
 * `INSERT INTO "ChargingStations"` you'll see at the top of every
 * existing e2e test.
 */
export async function seedChargingStation(
  db: Client,
  stationId: string,
  tenantId = 1,
): Promise<void> {
  const now = new Date().toISOString();
  await db.query(
    `INSERT INTO "ChargingStations" (id, "isOnline", "createdAt", "updatedAt", "tenantId")
     VALUES ($1, false, $2, $3, $4) ON CONFLICT DO NOTHING`,
    [stationId, now, now, tenantId],
  );
}

/**
 * Generate a stationId that's stable across re-runs of the same test
 * but unique across tests in the same suite (so a shared-server run
 * doesn't see two tests both seeding `E2E-FOO`).
 *
 * Callers pass a short test-specific tag.
 */
export function uniqueStationId(tag: string): string {
  // Hex random 4 bytes — collision odds within a single suite ≈ 1/4B.
  const r = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0');
  return `E2E-${tag.toUpperCase()}-${r}`;
}
