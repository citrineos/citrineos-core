import 'reflect-metadata';
import { join } from 'path';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import WebSocket from 'ws';
import { Pool, Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pbkdf2Sync, randomBytes } from 'crypto';
import { APP_CONFIG } from '@modules/config/app-config.module';
import { AmqpModule } from '../src/modules/amqp/amqp.module';
import { DrizzleModule, DRIZZLE } from '../src/database/drizzle.module';
import * as drizzleSchema from '../src/database/schema';
import { OcppRouterModule } from '../src/modules/ocpp-router/ocpp-router.module';
import { SecurityProfile } from '@modules/config/config.schema';

const WS_PORT = 8083;
const STATION_ID = 'NESTJS-AUTH-E2E-CP-001';
const CORRECT_PASSWORD = 'SuperSecret123!';

function pbkdf2Hash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `PBKDF2:1000:64:sha512:${salt}:${hash}`;
}

function basicAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

function connectOcpp(stationId: string, authHeader?: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const opts: WebSocket.ClientOptions = {};
    if (authHeader) opts.headers = { Authorization: authHeader };
    const ws = new WebSocket(`ws://localhost:${WS_PORT}/${stationId}`, ['ocpp2.0.1'], opts);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

describe('BasicAuth WebSocket E2E', () => {
  let pgContainer: StartedTestContainer;
  let rabbitContainer: StartedTestContainer;
  let app: NestFastifyApplication;
  let pgPort: number;
  let db: Client;
  let appPool: Pool;

  beforeAll(async () => {
    [pgContainer, rabbitContainer] = await Promise.all([
      new GenericContainer('postgres:16-alpine')
        .withEnvironment({
          POSTGRES_USER: 'postgres',
          POSTGRES_PASSWORD: 'postgres',
          POSTGRES_DB: 'postgres',
        })
        .withExposedPorts(5432)
        .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 1))
        .start(),

      new GenericContainer('rabbitmq:3-management-alpine')
        .withExposedPorts(5672)
        .withWaitStrategy(Wait.forLogMessage('Server startup complete', 1))
        .start(),
    ]);

    pgPort = pgContainer.getMappedPort(5432);
    const rabbitPort = rabbitContainer.getMappedPort(5672);

    // Run migrations before starting the app.
    const migrationsPool = new Pool({
      host: 'localhost',
      port: pgPort,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    });
    const migrationDb = drizzle(migrationsPool);
    await migrate(migrationDb, { migrationsFolder: join(process.cwd(), 'migrations') });
    await migrationsPool.end();

    appPool = new Pool({
      host: 'localhost',
      port: pgPort,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    });
    const drizzleDb = drizzle(appPool, { schema: drizzleSchema });

    const testConfig = {
      centralSystem: { port: 8099 },
      util: {
        messageBroker: {
          amqp: {
            url: `amqp://guest:guest@localhost:${rabbitPort}`,
            exchange: 'citrineos',
            instanceIdentifier: 'router-auth-e2e-test',
          },
        },
        networkConnection: {
          websocketServers: [
            {
              id: 'ws-auth-e2e',
              host: '0.0.0.0',
              port: WS_PORT,
              pingInterval: 0,
              protocols: ['ocpp2.0.1'],
              securityProfile: SecurityProfile.BasicAuth,
              allowUnknownChargingStations: true,
              tenantId: 1,
              dynamicTenantResolution: false,
            },
          ],
        },
        cache: { memory: true },
        authProvider: { localByPass: true },
      },
      database: {
        host: 'localhost',
        port: pgPort,
        username: 'postgres',
        password: 'postgres',
        name: 'postgres',
      },
    };

    const moduleFixture = await Test.createTestingModule({
      imports: [DrizzleModule, AmqpModule, OcppRouterModule],
    })
      .overrideProvider(APP_CONFIG)
      .useValue(testConfig)
      .overrideProvider(DRIZZLE)
      .useValue(drizzleDb)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );
    await app.init();

    db = new Client({
      host: 'localhost',
      port: pgPort,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    });
    await db.connect();

    // Seed test-specific BasicAuth credential for the station.
    // Tenant id=1 already exists from the 0002_seed_and_constraints migration.
    const now = new Date().toISOString();

    const compResult = await db.query(
      `INSERT INTO "Components" (name, "tenantId", "createdAt", "updatedAt")
       VALUES ('SecurityCtrlr', 1, $1, $2)
       RETURNING id`,
      [now, now],
    );
    const componentId = compResult.rows[0].id;

    const varResult = await db.query(
      `INSERT INTO "Variables" (name, "tenantId", "createdAt", "updatedAt")
       VALUES ('BasicAuthPassword', 1, $1, $2)
       RETURNING id`,
      [now, now],
    );
    const variableId = varResult.rows[0].id;

    await db.query(
      `INSERT INTO "VariableAttributes"
         ("stationId", type, "dataType", value, "componentId", "variableId", "tenantId", "createdAt", "updatedAt")
       VALUES ($1, 'Actual', 'passwordString', $2, $3, $4, 1, $5, $6)`,
      [STATION_ID, pbkdf2Hash(CORRECT_PASSWORD), componentId, variableId, now, now],
    );
  }, 120_000);

  afterAll(async () => {
    await db?.end().catch(() => {});
    await app?.close();
    await appPool?.end().catch(() => {});
    await Promise.allSettled([pgContainer?.stop(), rabbitContainer?.stop()]);
  });

  it('accepts a connection with correct Basic Auth credentials', async () => {
    const ws = await connectOcpp(STATION_ID, basicAuthHeader(STATION_ID, CORRECT_PASSWORD));
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  }, 15_000);

  it('rejects a connection with no Authorization header', async () => {
    await expect(connectOcpp(STATION_ID)).rejects.toThrow();
  }, 15_000);

  it('rejects a connection with a wrong password', async () => {
    await expect(
      connectOcpp(STATION_ID, basicAuthHeader(STATION_ID, 'wrongpassword')),
    ).rejects.toThrow();
  }, 15_000);

  it('rejects a connection where username does not match stationId', async () => {
    await expect(
      connectOcpp(STATION_ID, basicAuthHeader('different-station', CORRECT_PASSWORD)),
    ).rejects.toThrow();
  }, 15_000);
});
