// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Client } from 'pg';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP_VERSION_LIST, websocketServersConfigSchema } from '@citrineos/types';
import { DEFAULT_RABBITMQ_PORT, getRabbitmqContainer } from './rabbitmq-container.js';
import { DEFAULT_PG_PORT, getDefaultPgClientConfig, getPgContainer } from './pg-container.js';
import { WS_PORT } from './ports.js';

// ─── Paths (resolved relative to this file) ───────────────────────────────────

export const TEMP_DIR = mkdtempSync(join(tmpdir(), 'citrineos-e2e-'));

export const SERVER_ROOT = fileURLToPath(
  new URL('../../../../../../apps/ocpp-server/', import.meta.url),
);

export const SERVER_ASSETS_DIR = join(SERVER_ROOT, 'src', 'assets');
export const WEBSOCKET_SERVERS_FILE = 'websocket-servers.json';

// Set by setup() once RabbitMQ has a mapped port. buildTestEnv() cannot know it
// before the container is up, and every caller of buildTestEnv() runs after setup().
let amqpUrl: string | undefined;

function writeWebsocketServersConfig(): void {
  const websocketServers = websocketServersConfigSchema.parse([
    {
      id: '0',
      securityProfile: 0,
      allowUnknownChargingStations: true,
      pingInterval: 60,
      host: '0.0.0.0',
      port: WS_PORT,
      protocols: OCPP_VERSION_LIST,
      tenantId: DEFAULT_TENANT_ID,
      dynamicTenantResolution: false,
    },
  ]);

  writeFileSync(
    join(TEMP_DIR, WEBSOCKET_SERVERS_FILE),
    JSON.stringify(websocketServers, null, 2),
    'utf-8',
  );
}

export function buildTestEnv(
  databasePort: number,
  extraEnv: Record<string, string> = {},
): NodeJS.ProcessEnv {
  if (!amqpUrl) {
    throw new Error('buildTestEnv() called before setup(): the RabbitMQ port is not known yet.');
  }

  const defaultPgConfig = getDefaultPgClientConfig(databasePort);

  return {
    ...process.env,
    // DB connection — overrides the schema defaults so we hit the testcontainer PG
    // instead of any local instance.
    CITRINEOS_DATABASE_HOST: defaultPgConfig.host,
    CITRINEOS_DATABASE_PORT: String(defaultPgConfig.port),
    CITRINEOS_DATABASE_DATABASE: defaultPgConfig.database,
    CITRINEOS_DATABASE_USERNAME: defaultPgConfig.user,
    CITRINEOS_DATABASE_PASSWORD: defaultPgConfig.password,

    // Broker on the testcontainer's mapped port.
    CITRINEOS_MESSAGEBROKER_AMQP_URL: amqpUrl,

    // fileAccess root: websocket-servers.json is read through it. Absolute, so it does
    // not depend on the working directory the server was spawned from.
    CITRINEOS_FILEACCESS_LOCAL_DEFAULTFILEPATH: TEMP_DIR,
    CITRINEOS_WEBSOCKETSERVERCONFIGFILE: WEBSOCKET_SERVERS_FILE,

    // The Swagger logo is the one path read straight from the working directory rather
    // than through fileAccess, so it gets the app's real asset path.
    CITRINEOS_SWAGGER_LOGOPATH: join(SERVER_ASSETS_DIR, 'logo.png'),

    // App config
    APP_ENV: 'local',
    APP_NAME: 'all',
    ...extraEnv,
  };
}

/**
 * Starts the testcontainers, writes the websocket servers config, runs the real
 * sequelize-cli migrations against the test DB (the same path as production), and seeds
 * the rows the OCPP scenarios need. The server itself is spawned per scenario with
 * `spawnServer(buildTestEnv(pgPort, extraEnv))`, so each one can vary the environment.
 *
 * Requires apps/ocpp-server to be built: `db:migrate` resolves
 * dist/config/sequelize-bridge.config.js and dist/migrations through .sequelizerc.
 */
export const setup = async () => {
  // Start containers in parallel.
  const [pgContainer, rabbitmqContainer] = await Promise.all([
    getPgContainer(),
    getRabbitmqContainer(),
  ]);

  const pgPort = pgContainer.getMappedPort(DEFAULT_PG_PORT);
  const rabbitmqPort = rabbitmqContainer.getMappedPort(DEFAULT_RABBITMQ_PORT);
  amqpUrl = `amqp://guest:guest@localhost:${rabbitmqPort}`;

  console.log(`Mapped ports PG:${pgPort} RMQ:${rabbitmqPort}`);

  writeWebsocketServersConfig();

  execSync('pnpm run db:migrate', {
    cwd: SERVER_ROOT,
    env: buildTestEnv(pgPort),
    stdio: 'inherit',
  });

  const seedClient = new Client(getDefaultPgClientConfig(pgPort));
  await seedClient.connect();
  const now = new Date().toISOString();
  for (const stationId of ['E2E-CP-SEQUELIZE', 'E2E-CP-DRIZZLE']) {
    await seedClient.query(
      `INSERT INTO "ChargingStations" ("ocppConnectionName", "isOnline", "createdAt", "updatedAt", "tenantId")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [stationId, false, now, now, DEFAULT_TENANT_ID],
    );
  }
  await seedClient.end();

  return [pgContainer, rabbitmqContainer];
};
