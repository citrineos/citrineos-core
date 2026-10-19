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
import { DefaultDrizzleInstance, DefaultSequelizeInstance, registeredTables } from '@citrineos/dal';
import { validateDrizzleSchema, validateSequelizeSchema } from '@citrineos/ocpp';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../db/migrations/', import.meta.url));
const MIGRATION = '20261015130000-add-status-notification-connector-database-id.ts';
const TABLE = 'StatusNotifications';

let pgContainer: StartedTestContainer;
let sequelizeInstance: SequelizeInstance;
let drizzleInstance: ReturnType<typeof DefaultDrizzleInstance.getInstance>;

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

  const config = configSchema.parse({
    database: {
      host: pgContainer.getHost(),
      port: pgContainer.getMappedPort(5432),
      database: 'citrineos_test',
      username: 'test',
      password: 'test',
      maxRetries: 1,
      retryDelay: 100,
    },
  });
  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  drizzleInstance = DefaultDrizzleInstance.getInstance(config);

  const queryInterface = sequelizeInstance.getQueryInterface();
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.ts'))
    .sort();
  for (const file of files) {
    const migration = await import(`${MIGRATIONS_DIR}${file}`);
    await (migration.default ?? migration).up(queryInterface, Sequelize);
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

async function createConnector(ocppConnectionName: string): Promise<number> {
  const stationId = await insertReturningId(
    `INSERT INTO "ChargingStations" ("ocppConnectionName", "isOnline", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, false, $2, now(), now()) RETURNING id`,
    [ocppConnectionName, DEFAULT_TENANT_ID],
  );
  const evseId = await insertReturningId(
    `INSERT INTO "Evses" ("stationId", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, $2, now(), now()) RETURNING id`,
    [stationId, DEFAULT_TENANT_ID],
  );
  return insertReturningId(
    `INSERT INTO "Connectors" ("stationId", "evseId", "connectorId", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, $2, 1, $3, now(), now()) RETURNING id`,
    [stationId, evseId, DEFAULT_TENANT_ID],
  );
}

async function createStatusNotification(connectorDatabaseId: number): Promise<number> {
  return insertReturningId(
    `INSERT INTO "StatusNotifications" ("connectorId", "connectorDatabaseId", "connectorStatus", "tenantId", "createdAt", "updatedAt")
     VALUES (1, $1, 'Available', $2, now(), now()) RETURNING id`,
    [connectorDatabaseId, DEFAULT_TENANT_ID],
  );
}

describe('20261015130000-add-status-notification-connector-database-id', () => {
  it('matches the Sequelize models', async () => {
    const report = await validateSequelizeSchema(sequelizeInstance);

    expect(report.findings.filter((f) => f.table === TABLE)).toEqual([]);
  });

  it('matches the drizzle schema, indexes included', async () => {
    const report = await validateDrizzleSchema(drizzleInstance, {
      tables: registeredTables().filter((t) => t.name === TABLE),
    });

    expect(report.tablesChecked).toBe(1);
    expect(report.findings).toEqual([]);
  });

  it('references Connectors and nulls the link when the connector is deleted', async () => {
    const [constraint] = await sequelizeInstance.query<{ references: string; onDelete: string }>(
      `SELECT ccu.table_name AS "references", rc.delete_rule AS "onDelete"
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
       JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
       JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = :table
         AND kcu.column_name = 'connectorDatabaseId'`,
      { replacements: { table: TABLE }, type: QueryTypes.SELECT },
    );
    expect(constraint).toEqual({ references: 'Connectors', onDelete: 'SET NULL' });

    const connectorId = await createConnector('CS-SET-NULL');
    const statusNotificationId = await createStatusNotification(connectorId);
    await sequelizeInstance.query(`DELETE FROM "Connectors" WHERE id = $1`, {
      bind: [connectorId],
    });

    const [row] = await sequelizeInstance.query<{ connectorDatabaseId: number | null }>(
      `SELECT "connectorDatabaseId" FROM "StatusNotifications" WHERE id = $1`,
      { bind: [statusNotificationId], type: QueryTypes.SELECT },
    );
    expect(row.connectorDatabaseId).toBeNull();
  });

  it('rejects a link to a connector that does not exist', async () => {
    await expect(createStatusNotification(999_999)).rejects.toThrow(/foreign key constraint/);
  });

  it('drops the column on down and restores it on up', async () => {
    const queryInterface = sequelizeInstance.getQueryInterface();
    const migration = await import(`${MIGRATIONS_DIR}${MIGRATION}`);
    const hasColumn = async () =>
      'connectorDatabaseId' in (await queryInterface.describeTable(TABLE));

    await migration.default.down(queryInterface, Sequelize);
    expect(await hasColumn()).toBe(false);

    await migration.default.up(queryInterface, Sequelize);
    expect(await hasColumn()).toBe(true);
  });
});
