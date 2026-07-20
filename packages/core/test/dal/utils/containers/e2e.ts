import { createLocalConfig } from '../../../../../../apps/ocpp-server/src/config/envs/local';
import { DEFAULT_RABBITMQ_PORT, getRabbitmqContainer } from './rabbitmqContainer';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { DEFAULT_PG_PORT, getDefaultPgClientConfig, getPgContainer } from './pgContainer';
import { Client } from 'pg';

export const TEMP_DIR = mkdtempSync(join(tmpdir(), 'citrineos-e2e-'));

// ─── Paths (resolved relative to this file) ───────────────────────────────────

export const SERVER_ROOT = fileURLToPath(
  new URL('../../../../../../apps/ocpp-server/', import.meta.url),
);
export const SERVER_DIST = fileURLToPath(
  new URL('../../../../../../apps/ocpp-server/dist/index.js', import.meta.url),
);

export function buildTestEnv(
  databasePort: number,
  extraEnv: Record<string, string> = {},
): NodeJS.ProcessEnv {
  const defaultPgConfig = getDefaultPgClientConfig(databasePort);
  return {
    ...process.env,
    // DB connection — overrides the bootstrap config defaults so we hit the
    // testcontainer PG instead of any local instance.
    BOOTSTRAP_CITRINEOS_DATABASE_HOST: defaultPgConfig.host,
    BOOTSTRAP_CITRINEOS_DATABASE_PORT: String(defaultPgConfig.port),
    BOOTSTRAP_CITRINEOS_DATABASE_NAME: defaultPgConfig.database,
    BOOTSTRAP_CITRINEOS_DATABASE_USERNAME: defaultPgConfig.username,
    BOOTSTRAP_CITRINEOS_DATABASE_PASSWORD: defaultPgConfig.password,
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
export const setup = async () => {
  // Start containers in parallel.
  const [pgContainer, rabbitmqContainer] = await Promise.all([
    getPgContainer(),
    getRabbitmqContainer(),
  ]);

  const pgPort = pgContainer.getMappedPort(DEFAULT_PG_PORT);
  const rabbitmqPort = pgContainer.getMappedPort(DEFAULT_RABBITMQ_PORT);

  console.log(`Mapped ports PG:${pgPort} RMQ:${rabbitmqPort}`);
  // Build the system config by reusing the real local.ts config function, then
  // patch only the AMQP URL to point at the testcontainer RabbitMQ port.
  // We also strip the second WS server (port 8082, securityProfile 1) to avoid
  // a bind conflict when the first server is still releasing that port.
  const config = createLocalConfig();
  config.util.messageBroker.amqp!.url = `amqp://guest:guest@localhost:${rabbitmqPort}`;
  config.util.networkConnection.websocketServers =
    config.util.networkConnection.websocketServers.filter((s) => s.securityProfile === 0);

  writeFileSync(join(TEMP_DIR, 'config.json'), JSON.stringify(config, null, 2));

  // Run the real sequelize-cli migrations against the testcontainer DB.
  // sequelize.bridge.config.ts reads BOOTSTRAP_CITRINEOS_DATABASE_* env vars,
  // so the same vars we use to start the server point migrations at test PG.
  // This also runs 20250430110000-create-default-tenant which seeds Tenant id=1.
  execSync('pnpm run db:migrate', {
    cwd: SERVER_ROOT,
    env: buildTestEnv(pgPort),
    stdio: 'inherit',
  });

  // Seed a ChargingStation row for each test scenario stationId.
  // The trigger populate_station_pk_id() on OCPPMessages requires a matching
  // ChargingStations row; without it the trigger raises an error that causes
  // the router to return a CALLERROR before the Reporting module can respond.
  const seedClient = new Client(getDefaultPgClientConfig(pgPort));
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

  return [pgContainer, rabbitmqContainer];
};
