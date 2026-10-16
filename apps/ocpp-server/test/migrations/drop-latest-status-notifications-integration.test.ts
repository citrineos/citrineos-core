// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize as SequelizeInstance } from 'sequelize-typescript';
import { QueryTypes, Sequelize } from 'sequelize';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { configSchema } from '@citrineos/types';
import { DefaultSequelizeInstance } from '@citrineos/dal';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../db/migrations/', import.meta.url));
const MIGRATION = '20261015140000-drop-latest-status-notifications.ts';

let pgContainer: StartedTestContainer;
let sequelizeInstance: SequelizeInstance;

async function runMigration(file: string, direction: 'up' | 'down'): Promise<void> {
  const migration = await import(`${MIGRATIONS_DIR}${file}`);
  await (migration.default ?? migration)[direction](
    sequelizeInstance.getQueryInterface(),
    Sequelize,
  );
}

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:16-3.4-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'citrineos_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
    .start();

  sequelizeInstance = DefaultSequelizeInstance.getInstance(
    configSchema.parse({
      database: {
        host: pgContainer.getHost(),
        port: pgContainer.getMappedPort(5432),
        database: 'citrineos_test',
        username: 'test',
        password: 'test',
        maxRetries: 1,
        retryDelay: 100,
      },
    }),
  );

  const earlier = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.ts') && file < MIGRATION)
    .sort();
  for (const file of earlier) {
    await runMigration(file, 'up');
  }
}, 180_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

async function insertReturningId(sql: string, bind: unknown[]): Promise<number> {
  const [row] = await sequelizeInstance.query<{ id: number }>(sql, {
    bind,
    type: QueryTypes.SELECT,
  });
  return row.id;
}

async function createStation(ocppConnectionName: string, protocol: string): Promise<number> {
  return insertReturningId(
    `INSERT INTO "ChargingStations" ("ocppConnectionName", "isOnline", "protocol", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, false, $2, $3, now(), now()) RETURNING id`,
    [ocppConnectionName, protocol, DEFAULT_TENANT_ID],
  );
}

async function createEvse(stationId: number, evseTypeId: number): Promise<number> {
  return insertReturningId(
    `INSERT INTO "Evses" ("stationId", "evseTypeId", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, now(), now()) RETURNING id`,
    [stationId, evseTypeId, DEFAULT_TENANT_ID],
  );
}

async function createConnector(
  stationId: number,
  evseId: number,
  connectorId: number | null,
  evseTypeConnectorId: number | null,
): Promise<number> {
  return insertReturningId(
    `INSERT INTO "Connectors" ("stationId", "evseId", "connectorId", "evseTypeConnectorId", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, now(), now()) RETURNING id`,
    [stationId, evseId, connectorId, evseTypeConnectorId, DEFAULT_TENANT_ID],
  );
}

async function createLatestStatus(
  stationId: number,
  evseId: number | null,
  connectorId: number,
  createdAt: string,
): Promise<number> {
  const statusNotificationId = await insertReturningId(
    `INSERT INTO "StatusNotifications" ("stationId", "evseId", "connectorId", "connectorStatus", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'Available', $4, $5, $5) RETURNING id`,
    [stationId, evseId, connectorId, DEFAULT_TENANT_ID, createdAt],
  );
  await sequelizeInstance.query(
    `INSERT INTO "LatestStatusNotifications" ("stationId", "statusNotificationId", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, now(), now())`,
    { bind: [stationId, statusNotificationId, DEFAULT_TENANT_ID] },
  );
  return statusNotificationId;
}

async function pointerOf(connectorId: number): Promise<number | null> {
  const [row] = await sequelizeInstance.query<{ latestStatusNotificationId: number | null }>(
    `SELECT "latestStatusNotificationId" FROM "Connectors" WHERE id = $1`,
    { bind: [connectorId], type: QueryTypes.SELECT },
  );
  return row.latestStatusNotificationId;
}

async function tableExists(): Promise<boolean> {
  const [row] = await sequelizeInstance.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public' AND tablename = 'LatestStatusNotifications'`,
    { type: QueryTypes.SELECT },
  );
  return row.n === 1;
}

describe('20261015140000-drop-latest-status-notifications', () => {
  it('moves each connector onto its newest latest status, then drops the table, and down restores it', async () => {
    // 1.6: the status names the connector by its station-wide connectorId.
    const station16 = await createStation('CS-16', 'ocpp1.6');
    const evse16 = await createEvse(station16, 1);
    const connector16 = await createConnector(station16, evse16, 2, null);
    await createLatestStatus(station16, 1, 2, '2026-10-01T00:00:00Z');
    const newer16 = await createLatestStatus(station16, 1, 2, '2026-10-02T00:00:00Z');

    // 2.0.1: the status names the connector by EVSE and the connectorId within it. The other
    // EVSE's connector 1 reports the same per-EVSE number and must not pick this status up.
    const station201 = await createStation('CS-201', 'ocpp2.0.1');
    const evseA = await createEvse(station201, 1);
    const evseB = await createEvse(station201, 2);
    const connectorA = await createConnector(station201, evseA, null, 1);
    const connectorB = await createConnector(station201, evseB, null, 1);
    const status201 = await createLatestStatus(station201, 2, 1, '2026-10-01T00:00:00Z');

    // A connector that already has a pointer keeps it.
    const evseKeep = await createEvse(station16, 3);
    const connectorKeep = await createConnector(station16, evseKeep, 3, null);
    const existing = await createLatestStatus(station16, 3, 3, '2026-10-01T00:00:00Z');
    await createLatestStatus(station16, 3, 3, '2026-10-03T00:00:00Z');
    await sequelizeInstance.query(
      `UPDATE "Connectors" SET "latestStatusNotificationId" = $1 WHERE id = $2`,
      { bind: [existing, connectorKeep] },
    );

    await runMigration(MIGRATION, 'up');

    expect(await pointerOf(connector16)).toBe(newer16);
    expect(await pointerOf(connectorB)).toBe(status201);
    expect(await pointerOf(connectorA)).toBeNull();
    expect(await pointerOf(connectorKeep)).toBe(existing);
    expect(await tableExists()).toBe(false);

    await runMigration(MIGRATION, 'down');

    expect(await tableExists()).toBe(true);
    const restored = await sequelizeInstance.query<{ statusNotificationId: number }>(
      `SELECT "statusNotificationId" FROM "LatestStatusNotifications" ORDER BY "statusNotificationId"`,
      { type: QueryTypes.SELECT },
    );
    expect(restored.map((r) => r.statusNotificationId)).toEqual(
      [existing, newer16, status201].sort((a, b) => a - b),
    );
  });
});
