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
import {
  DefaultDrizzleInstance,
  DefaultSequelizeInstance,
  registeredTables,
  sequelize as dal,
} from '@citrineos/dal';
import { validateDrizzleSchema, validateSequelizeSchema } from '@citrineos/ocpp';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../db/migrations/', import.meta.url));
const MIGRATION = '20261002120000-create-network-alert-tables.ts';
const TABLES = ['NetworkAlerts', 'NetworkAlertOccurrences', 'NetworkAlertConfigs'];

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

async function createStation(ocppConnectionName: string): Promise<number> {
  const [row] = await sequelizeInstance.query<{ id: number }>(
    `INSERT INTO "ChargingStations" ("ocppConnectionName", "isOnline", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, false, $2, now(), now()) RETURNING id`,
    { bind: [ocppConnectionName, DEFAULT_TENANT_ID], type: QueryTypes.SELECT },
  );
  return row.id;
}

async function createAlert(stationId: number) {
  const now = new Date().toISOString();
  return dal.NetworkAlert.create({
    type: 'StationConnectivity',
    severity: 'Info',
    status: 'Active',
    stationId,
    firstSeenAt: now,
    lastSeenAt: now,
    details: { offlineSince: now },
  });
}

describe('20261002120000-create-network-alert-tables', () => {
  it('matches the Sequelize models', async () => {
    const report = await validateSequelizeSchema(sequelizeInstance);
    const findings = report.findings.filter((f) => TABLES.includes(f.table));

    expect(report.tablesChecked).toBeGreaterThanOrEqual(TABLES.length);
    expect(findings).toEqual([]);
  });

  it('matches the drizzle schema, indexes included', async () => {
    const report = await validateDrizzleSchema(drizzleInstance, {
      tables: registeredTables().filter((t) => TABLES.includes(t.name)),
    });

    expect(report.tablesChecked).toBe(TABLES.length);
    expect(report.findings).toEqual([]);
  });

  it('creates every foreign key with its delete rule', async () => {
    const rows = await sequelizeInstance.query<{
      table: string;
      column: string;
      references: string;
      onDelete: string;
    }>(
      `SELECT tc.table_name AS "table", kcu.column_name AS "column",
              ccu.table_name AS "references", rc.delete_rule AS "onDelete"
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
       JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
       JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN (:tables)
       ORDER BY 1, 2`,
      { replacements: { tables: TABLES }, type: QueryTypes.SELECT },
    );

    expect(rows).toEqual([
      {
        table: 'NetworkAlertConfigs',
        column: 'tenantId',
        references: 'Tenants',
        onDelete: 'RESTRICT',
      },
      {
        table: 'NetworkAlertOccurrences',
        column: 'alertId',
        references: 'NetworkAlerts',
        onDelete: 'CASCADE',
      },
      {
        table: 'NetworkAlertOccurrences',
        column: 'statusNotificationId',
        references: 'StatusNotifications',
        onDelete: 'SET NULL',
      },
      {
        table: 'NetworkAlertOccurrences',
        column: 'tenantId',
        references: 'Tenants',
        onDelete: 'RESTRICT',
      },
      {
        table: 'NetworkAlerts',
        column: 'connectorId',
        references: 'Connectors',
        onDelete: 'CASCADE',
      },
      { table: 'NetworkAlerts', column: 'evseId', references: 'Evses', onDelete: 'CASCADE' },
      {
        table: 'NetworkAlerts',
        column: 'stationId',
        references: 'ChargingStations',
        onDelete: 'CASCADE',
      },
      { table: 'NetworkAlerts', column: 'tenantId', references: 'Tenants', onDelete: 'RESTRICT' },
    ]);
  });

  it('only indexes alerts that are not resolved in the open lookup', async () => {
    const [row] = await sequelizeInstance.query<{ indexdef: string }>(
      `SELECT indexdef FROM pg_indexes WHERE indexname = 'network_alerts_open_lookup'`,
      { type: QueryTypes.SELECT },
    );

    expect(row.indexdef).toContain(`WHERE ((status)::text <> 'Resolved'::text)`);
  });

  it('round-trips an alert through the model with ISO timestamps', async () => {
    const stationId = await createStation('round-trip');
    const created = await createAlert(stationId);
    const read = await dal.NetworkAlert.findByPk(created.id);

    expect(read?.occurrenceCount).toBe(1);
    expect(read?.firstSeenAt).toBe(created.firstSeenAt);
    expect(read?.resolvedAt).toBeUndefined();
    expect(read?.tenantId).toBe(DEFAULT_TENANT_ID);
  });

  it('removes a station’s alerts and their occurrences when the station is deleted', async () => {
    const stationId = await createStation('cascade');
    const alert = await createAlert(stationId);
    await dal.NetworkAlertOccurrence.create({
      alertId: alert.id,
      type: 'StationConnectivity',
      occurredAt: new Date().toISOString(),
      severity: 'Info',
      details: { durationSeconds: null },
    });

    await sequelizeInstance.query(`DELETE FROM "ChargingStations" WHERE id = $1`, {
      bind: [stationId],
    });

    expect(await dal.NetworkAlert.count({ where: { id: alert.id } })).toBe(0);
    expect(await dal.NetworkAlertOccurrence.count({ where: { alertId: alert.id } })).toBe(0);
  });

  it('allows one config row per tenant and alert type', async () => {
    await dal.NetworkAlertConfig.create({ type: 'ConnectorStatus', enabled: false });

    await expect(
      dal.NetworkAlertConfig.create({ type: 'ConnectorStatus', enabled: true }),
    ).rejects.toThrow();
  });

  it('drops all three tables on down and recreates them on up', async () => {
    const queryInterface = sequelizeInstance.getQueryInterface();
    const migration = await import(`${MIGRATIONS_DIR}${MIGRATION}`);
    const tableCount = async () => {
      const [row] = await sequelizeInstance.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public' AND tablename IN (:tables)`,
        { replacements: { tables: TABLES }, type: QueryTypes.SELECT },
      );
      return row.n;
    };

    await migration.default.down(queryInterface, Sequelize);
    expect(await tableCount()).toBe(0);

    await migration.default.up(queryInterface, Sequelize);
    expect(await tableCount()).toBe(TABLES.length);
  });
});
