// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Shared lifecycle helpers for the root-level vitest e2e tests so that the same
 * test bodies can be executed against either the original CitrineOS server
 * (Sequelize + base/core/Server) or the NestJS rewrite under nestjs/.
 *
 * Selection happens via the `CITRINEOS_TARGET` env var:
 *   - `old`     — default. Builds & spawns Server/dist/index.js, runs sequelize-cli migrations.
 *   - `nestjs`  — Builds & spawns nestjs/dist/src/main.js, runs drizzle migrations.
 *
 * Each target exposes the same surface:
 *   • runMigrations(opts)  — bring schema + default seed Tenant id=1 up to date
 *   • spawnServer(opts)    — spawn the server child process listening on HTTP 8080,
 *                             WS 8081 (NoSecurity), WS 8082 (BasicAuth)
 *   • writeConfigFile(opts)— produce the target-shaped JSON config in tempDir
 *
 * The DB schemas overlap on the columns these tests touch
 * (ChargingStations / Components / Variables / VariableAttributes / SecurityEvents),
 * so the seed SQL and assertions are target-agnostic.
 */

import { execSync, spawn, type ChildProcess } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

export type Target = 'old' | 'nestjs';

export const TARGET: Target = ((): Target => {
  const v = (process.env.CITRINEOS_TARGET ?? 'old').toLowerCase();
  if (v !== 'old' && v !== 'nestjs') {
    throw new Error(`Invalid CITRINEOS_TARGET="${v}" (expected "old" or "nestjs")`);
  }
  return v as Target;
})();

const MONOREPO_ROOT = fileURLToPath(new URL('../../../../../../', import.meta.url));
const NESTJS_ROOT = join(MONOREPO_ROOT, 'nestjs');

const OLD_SERVER_DIST = join(MONOREPO_ROOT, 'Server', 'dist', 'index.js');
const NESTJS_SERVER_DIST = join(NESTJS_ROOT, 'dist', 'src', 'main.js');

export interface SpawnOpts {
  pgPort: number;
  rabbitPort: number;
  tempDir: string;
  /** Extra environment variables specific to a single test (e.g. feature flags). */
  extraEnv?: Record<string, string>;
}

export interface ConfigOpts {
  rabbitPort: number;
  /** Whether to expose the BasicAuth WS server on port 8082 alongside the SP0 server. */
  includeBasicAuth: boolean;
  /**
   * Per-module config overrides merged into the NestJS-target config under
   * `modules.<key>`. No-op on `target=old` (legacy uses a different shape).
   * Used by parity tests that need a specific flatRateCost / dataTransfer /
   * etc. without polluting the default config.
   */
  modulesOverride?: Record<string, Record<string, unknown>>;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const HTTP_PORT = 8080;
export const WS_NOAUTH_PORT = 8081;
export const WS_BASICAUTH_PORT = 8082;

/**
 * Run the target's migrations against the testcontainer Postgres. Brings the
 * schema up plus seeds Tenant id=1.
 */
export function runMigrations(opts: SpawnOpts): void {
  const env = buildEnv(opts);

  if (TARGET === 'old') {
    execSync('npm run migrate', { cwd: MONOREPO_ROOT, env, stdio: 'inherit' });
    return;
  }

  // nestjs: drizzle migrations
  execSync('npm run migrate', { cwd: NESTJS_ROOT, env, stdio: 'inherit' });
}

/**
 * Write the target-shaped config JSON to `${tempDir}/config.json`.
 * The path is fixed so callers don't need to know about target-specific filenames.
 */
export async function writeConfigFile(tempDir: string, opts: ConfigOpts): Promise<string> {
  const path = join(tempDir, 'config.json');

  if (TARGET === 'old') {
    // Dynamic ESM import keeps the old-server config dep out of the nestjs path.
    const { createLocalConfig } = await import('../../../../../../Server/src/config/envs/local.js');
    const config = createLocalConfig();
    config.util.messageBroker.amqp!.url = `amqp://guest:guest@localhost:${opts.rabbitPort}`;
    if (!opts.includeBasicAuth) {
      config.util.networkConnection.websocketServers =
        config.util.networkConnection.websocketServers.filter(
          (s: { securityProfile: number }) => s.securityProfile === 0,
        );
    }
    writeFileSync(path, JSON.stringify(config, null, 2));
    return path;
  }

  // NestJS shape (mirrors src/config/config.schema.ts AppConfig).
  const websocketServers: unknown[] = [
    {
      id: '0',
      host: '0.0.0.0',
      port: WS_NOAUTH_PORT,
      pingInterval: 0,
      protocols: ['ocpp2.0.1', 'ocpp1.6'],
      securityProfile: 0,
      allowUnknownChargingStations: true,
      tenantId: 1,
      dynamicTenantResolution: false,
    },
  ];
  if (opts.includeBasicAuth) {
    websocketServers.push({
      id: '1',
      host: '0.0.0.0',
      port: WS_BASICAUTH_PORT,
      pingInterval: 0,
      protocols: ['ocpp2.0.1', 'ocpp1.6'],
      securityProfile: 1,
      allowUnknownChargingStations: false,
      tenantId: 1,
      dynamicTenantResolution: false,
    });
  }

  const nestConfig: Record<string, unknown> = {
    centralSystem: { host: '0.0.0.0', port: HTTP_PORT },
    util: {
      messageBroker: {
        amqp: {
          url: `amqp://guest:guest@localhost:${opts.rabbitPort}`,
          exchange: 'citrineos',
          instanceIdentifier: `router-e2e-${process.pid}`,
        },
      },
      networkConnection: { websocketServers },
      cache: { memory: true },
      authProvider: { localByPass: true },
    },
  };
  if (opts.modulesOverride) {
    nestConfig.modules = opts.modulesOverride;
  }
  writeFileSync(path, JSON.stringify(nestConfig, null, 2));
  return path;
}

/** Spawn the target's server entry. Caller must already have run migrations + written config. */
export function spawnServer(opts: SpawnOpts): ChildProcess {
  const env = buildEnv(opts);
  const dist = TARGET === 'old' ? OLD_SERVER_DIST : NESTJS_SERVER_DIST;
  return spawn('node', [dist], { env, stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * Cleanly stop a server child: SIGTERM, wait up to `graceMs` for actual exit,
 * then SIGKILL, then poll until the well-known ports (HTTP_PORT, WS_NOAUTH_PORT,
 * WS_BASICAUTH_PORT) are actually released by the OS so the next test can bind.
 *
 * Without the post-exit port poll the OS sometimes keeps the listener around
 * for a few hundred ms after the process exits, which makes back-to-back
 * spawns flake on EADDRINUSE under `--no-file-parallelism`.
 */
export async function stopServer(proc: ChildProcess, graceMs = 1_500): Promise<void> {
  if (proc.exitCode !== null) {
    return;
  }

  const exited = new Promise<void>((resolve) => proc.once('exit', () => resolve()));

  // SIGTERM first to give shutdown hooks a chance.
  proc.kill('SIGTERM');
  await Promise.race([exited, new Promise<void>((r) => setTimeout(r, graceMs))]);

  // Always SIGKILL after the grace window — covers Nest shutdown hook stalls.
  if (proc.exitCode === null) {
    proc.kill('SIGKILL');
    await Promise.race([exited, new Promise<void>((r) => setTimeout(r, 3_000))]);
  }

  // Belt-and-suspenders: also poll until ports are listenable, since the
  // kernel can briefly hold a closing socket beyond child-process exit.
  await waitForPortsFree([HTTP_PORT, WS_NOAUTH_PORT, WS_BASICAUTH_PORT], 20_000);
  await new Promise((r) => setTimeout(r, 500));
}

async function waitForPortsFree(ports: number[], timeoutMs: number): Promise<void> {
  const net = await import('net');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const allFree = await Promise.all(
      ports.map(
        (port) =>
          new Promise<boolean>((resolve) => {
            const tester = net
              .createServer()
              .once('error', () => resolve(false))
              .once('listening', () => tester.close(() => resolve(true)))
              .listen(port, '0.0.0.0');
          }),
      ),
    );
    if (allFree.every(Boolean)) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  // Don't throw — just let the next spawn surface the real error if any.
}

// ─── Internal: env var assembly ──────────────────────────────────────────────

function buildEnv(opts: SpawnOpts): NodeJS.ProcessEnv {
  // Both targets now share the BOOTSTRAP_CITRINEOS_* convention. The NestJS
  // server's app-config.module.ts reads the same envs to mirror the legacy
  // bootstrap-config + system-config split.
  return {
    ...process.env,
    BOOTSTRAP_CITRINEOS_DATABASE_HOST: 'localhost',
    BOOTSTRAP_CITRINEOS_DATABASE_PORT: String(opts.pgPort),
    BOOTSTRAP_CITRINEOS_DATABASE_NAME: 'postgres',
    BOOTSTRAP_CITRINEOS_DATABASE_USERNAME: 'postgres',
    BOOTSTRAP_CITRINEOS_DATABASE_PASSWORD: 'postgres',
    BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE: 'local',
    BOOTSTRAP_CITRINEOS_FILE_ACCESS_LOCAL_DEFAULT_FILE_PATH: opts.tempDir,
    BOOTSTRAP_CITRINEOS_CONFIG_FILENAME: 'config.json',
    APP_ENV: 'local',
    APP_NAME: 'all',
    ...opts.extraEnv,
  };
}
