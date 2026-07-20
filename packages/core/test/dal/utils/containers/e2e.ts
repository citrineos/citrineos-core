import { createLocalConfig } from '../../../../../../apps/ocpp-server/src/config/envs/local';
import { DEFAULT_RABBITMQ_PORT } from './rabbitmqContainer';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { StartedTestContainer } from 'testcontainers';
import { fileURLToPath } from 'url';
import { DEFAULT_PG_CLIENT_CONFIG, DEFAULT_PG_PORT } from './pgContainer';
import { Client } from 'pg';

export const TEMP_DIR = mkdtempSync(join(tmpdir(), 'citrineos-e2e-'));

// ─── Paths (resolved relative to this file) ───────────────────────────────────

export const SERVER_ROOT = fileURLToPath(
  new URL('../../../../../../apps/ocpp-server/', import.meta.url),
);
export const SERVER_DIST = fileURLToPath(
  new URL('../../../../../../apps/ocpp-server/dist/index.js', import.meta.url),
);

export function buildTestEnv(extraEnv: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    // DB connection — overrides the bootstrap config defaults so we hit the
    // testcontainer PG instead of any local instance.
    BOOTSTRAP_CITRINEOS_DATABASE_HOST: DEFAULT_PG_CLIENT_CONFIG.host,
    BOOTSTRAP_CITRINEOS_DATABASE_PORT: String(DEFAULT_PG_PORT),
    BOOTSTRAP_CITRINEOS_DATABASE_NAME: DEFAULT_PG_CLIENT_CONFIG.database,
    BOOTSTRAP_CITRINEOS_DATABASE_USERNAME: DEFAULT_PG_CLIENT_CONFIG.user,
    BOOTSTRAP_CITRINEOS_DATABASE_PASSWORD: DEFAULT_PG_CLIENT_CONFIG.password,
    // System config file — points at our pre-written config.json in tempDir.
    BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE: 'local',
    BOOTSTRAP_CITRINEOS_FILE_ACCESS_LOCAL_DEFAULT_FILE_PATH: TEMP_DIR,
    BOOTSTRAP_CITRINEOS_CONFIG_FILENAME: 'config.json',
    // App config
    APP_ENV: 'local',
    APP_NAME: 'all',
    ...extraEnv,
  };
}

// setup() spins up all passed-in testcontainers, runs the real sequelize-cli migrations
// against the test DB (same path as production), then starts the CitrineOS server as a child process.
export const setup = async (...containers: Promise<StartedTestContainer>[]) => {
  // Start containers in parallel.
  const startedContainers = await Promise.all(containers);

  // Build the system config by reusing the real local.ts config function, then
  // patch only the AMQP URL to point at the testcontainer RabbitMQ port.
  // We also strip the second WS server (port 8082, securityProfile 1) to avoid
  // a bind conflict when the first server is still releasing that port.
  const config = createLocalConfig();
  config.util.messageBroker.amqp!.url = `amqp://guest:guest@localhost:${DEFAULT_RABBITMQ_PORT}`;
  config.util.networkConnection.websocketServers =
    config.util.networkConnection.websocketServers.filter((s) => s.securityProfile === 0);

  writeFileSync(join(TEMP_DIR, 'config.json'), JSON.stringify(config, null, 2));

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
  const seedClient = new Client(DEFAULT_PG_CLIENT_CONFIG);
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

  return startedContainers;
};
