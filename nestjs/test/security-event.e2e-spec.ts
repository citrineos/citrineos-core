import 'reflect-metadata';
import { join } from 'path';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import WebSocket from 'ws';
import { Pool } from 'pg';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { APP_CONFIG } from '@modules/config/app-config.module';
import { AmqpModule } from '../src/modules/amqp/amqp.module';
import { DrizzleModule, DRIZZLE } from '../src/database/drizzle.module';
import * as drizzleSchema from '../src/database/schema';
import { OcppRouterModule } from '../src/modules/ocpp-router/ocpp-router.module';
import { ReportingModule } from '../src/modules/reporting/reporting.module';
import { SecurityProfile } from '@modules/config/config.schema';
import { OCPP_CallAction } from '../src/ocpp/call-action';

// Port chosen to avoid conflicts with a locally running CitrineOS instance.
const WS_PORT = 8082;
const STATION_ID = 'NESTJS-E2E-CP-001';

describe('SecurityEventNotification E2E', () => {
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

    // Run migrations against the fresh DB before starting the app.
    const migrationsPool = new Pool({
      host: 'localhost',
      port: pgPort,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    });
    const migrationDb = drizzle(migrationsPool);
    await migrate(migrationDb, {
      migrationsFolder: join(process.cwd(), 'migrations'),
    });
    await migrationsPool.end();

    // Dedicated pool for the app's Drizzle instance — closed in afterAll.
    appPool = new Pool({
      host: 'localhost',
      port: pgPort,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    });
    const drizzleDb = drizzle(appPool, { schema: drizzleSchema });

    const testConfig = {
      centralSystem: { port: 8098 },
      util: {
        messageBroker: {
          amqp: {
            url: `amqp://guest:guest@localhost:${rabbitPort}`,
            exchange: 'citrineos',
            instanceIdentifier: 'router-e2e-test',
          },
        },
        networkConnection: {
          websocketServers: [
            {
              id: 'ws-e2e',
              host: '0.0.0.0',
              port: WS_PORT,
              pingInterval: 0,
              protocols: ['ocpp2.0.1'],
              securityProfile: SecurityProfile.NoSecurity,
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
      modules: {
        reporting: {
          requests: [OCPP_CallAction.SecurityEventNotification],
          responses: [] as OCPP_CallAction[],
        },
      },
    };

    // Override both APP_CONFIG (so AmqpService and OcppRouterService get the right
    // testcontainer ports) and DRIZZLE (bypassing the PG_POOL factory chain, which
    // would otherwise run against default env-var config before the override applies).
    const moduleFixture = await Test.createTestingModule({
      imports: [DrizzleModule, AmqpModule, OcppRouterModule, ReportingModule],
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
  }, 120_000);

  afterAll(async () => {
    await db?.end().catch(() => {});
    await app?.close();
    await appPool?.end().catch(() => {});
    await Promise.allSettled([pgContainer?.stop(), rabbitContainer?.stop()]);
  });

  it('returns a CallResult [3] and persists the SecurityEvent to the DB', async () => {
    const ws = await new Promise<WebSocket>((resolve, reject) => {
      const sock = new WebSocket(`ws://localhost:${WS_PORT}/${STATION_ID}`, ['ocpp2.0.1']);
      sock.once('open', () => resolve(sock));
      sock.once('error', reject);
    });

    try {
      const msgId = 'test-msg-' + Date.now();
      const payload = {
        type: 'SecurityLogWasCleared',
        timestamp: new Date().toISOString(),
      };

      const response = await new Promise<any[]>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('No OCPP CallResult within 10 s')), 10_000);
        ws.once('message', (data) => {
          clearTimeout(timer);
          resolve(JSON.parse(data.toString()));
        });
        ws.send(JSON.stringify([2, msgId, 'SecurityEventNotification', payload]));
      });

      expect(response[0]).toBe(3);
      expect(response[1]).toBe(msgId);
      expect(response[2]).toEqual({});

      const { rows } = await db.query<{ stationId: string; type: string }>(
        `SELECT "stationId", "type"
         FROM "SecurityEvents"
         WHERE "stationId" = $1
         ORDER BY id DESC
         LIMIT 1`,
        [STATION_ID],
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].stationId).toBe(STATION_ID);
      expect(rows[0].type).toBe(payload.type);
    } finally {
      ws.close();
    }
  }, 30_000);
});
