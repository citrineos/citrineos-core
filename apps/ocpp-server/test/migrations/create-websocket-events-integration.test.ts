// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { QueryTypes, type QueryInterface } from 'sequelize';
import { type BootstrapConfig, DEFAULT_TENANT_ID } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import {
  DefaultDrizzleInstance,
  DefaultSequelizeInstance,
  registeredTables,
  SequelizeWebsocketEventRepository,
} from '@citrineos/dal';
import { validateDrizzleSchema } from '@citrineos/ocpp';
import migration from '../../db/migrations/20261005120000-create-websocket-events.js';

const TS = '2026-10-05T12:00:00.000Z';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let queryInterface: QueryInterface;
let config: SystemConfig;

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

  const database = {
    host: pgContainer.getHost(),
    port: pgContainer.getMappedPort(5432),
    database: 'citrineos_test',
    username: 'test',
    password: 'test',
  };
  const bootstrapConfig = {
    database: {
      ...database,
      dialect: 'postgres',
      sync: false,
      alter: false,
      force: false,
      maxRetries: 1,
      retryDelay: 100,
    },
  } as BootstrapConfig;
  config = bootstrapConfig as SystemConfig;
  sequelizeInstance = DefaultSequelizeInstance.getInstance(bootstrapConfig);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });
  queryInterface = sequelizeInstance.getQueryInterface();

  // sync() built an unpartitioned table from the model; the migration owns the real shape.
  await sequelizeInstance.query('DROP TABLE "WebsocketEvents"');
  await sequelizeInstance.query(
    `INSERT INTO "Tenants" (id, name, "createdAt", "updatedAt") VALUES (${DEFAULT_TENANT_ID}, 'default', NOW(), NOW())`,
  );
  await migration.up(queryInterface);
}, 120_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

async function select<T extends object>(sql: string): Promise<T[]> {
  return sequelizeInstance.query<T>(sql, { type: QueryTypes.SELECT });
}

async function partitions(): Promise<{ name: string; bound: string }[]> {
  return select(
    `SELECT c.relname AS name, pg_get_expr(c.relpartbound, c.oid) AS bound
       FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
      WHERE i.inhparent = '"WebsocketEvents"'::regclass
      ORDER BY c.relname`,
  );
}

async function weekPartitionName(weeksFromNow: number): Promise<string> {
  const [row] = await select<{ name: string }>(
    `SELECT 'WebsocketEvents_' || to_char(
              date_trunc('week', now() AT TIME ZONE 'UTC') + make_interval(weeks => ${weeksFromNow}),
              'IYYY"w"IW') AS name`,
  );
  return row.name;
}

function makeRepo(): SequelizeWebsocketEventRepository {
  return new SequelizeWebsocketEventRepository({ config, sequelizeInstance });
}

describe('20261005120000-create-websocket-events', () => {
  it('creates WebsocketEvents range partitioned on createdAt', async () => {
    const [row] = await select<{ strategy: string; key: string }>(
      `SELECT p.partstrat AS strategy, pg_get_partkeydef(p.partrelid) AS key
         FROM pg_partitioned_table p WHERE p.partrelid = '"WebsocketEvents"'::regclass`,
    );

    expect(row).toEqual({ strategy: 'r', key: 'RANGE ("createdAt")' });
  });

  it('keys rows on (id, createdAt), since a partitioned unique key needs the partition key', async () => {
    const rows = await select<{ column: string }>(
      `SELECT a.attname AS column
         FROM pg_index ix
         JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = ANY (ix.indkey)
        WHERE ix.indrelid = '"WebsocketEvents"'::regclass AND ix.indisprimary
        ORDER BY array_position(ix.indkey, a.attnum)`,
    );

    expect(rows.map((r) => r.column)).toEqual(['id', 'createdAt']);
  });

  it('provisions this week from MINVALUE and the next week ahead', async () => {
    const parts = await partitions();

    expect(parts.map((p) => p.name)).toEqual([
      await weekPartitionName(0),
      await weekPartitionName(1),
    ]);
    expect(parts[0].bound).toContain('MINVALUE');
  });

  it('matches the drizzle declarations, indexes included', async () => {
    const report = await validateDrizzleSchema(DefaultDrizzleInstance.getInstance(config), {
      tables: registeredTables().filter((t) => t.name === 'WebsocketEvents'),
    });

    expect(report.tablesChecked).toBe(1);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  it('routes a repository insert into the current week', async () => {
    const created = await makeRepo().createWebsocketEvent(DEFAULT_TENANT_ID, undefined, {
      serverId: 'ws-0',
      host: 'pod-a',
      type: 'UpgradeRejected',
      timestamp: TS,
      httpStatus: 401,
    });

    const [row] = await select<{ partition: string }>(
      `SELECT tableoid::regclass::text AS partition FROM "WebsocketEvents" WHERE id = ${created.id}`,
    );
    expect(row.partition).toBe(`"${await weekPartitionName(0)}"`);
  });

  it('keeps a station event and clears its stationId when the station is deleted', async () => {
    await sequelizeInstance.query(
      `INSERT INTO "ChargingStations" ("ocppConnectionName", "isOnline", "tenantId", "createdAt", "updatedAt")
       VALUES ('cp-delete', false, ${DEFAULT_TENANT_ID}, NOW(), NOW())`,
    );
    const created = await makeRepo().createWebsocketEvent(DEFAULT_TENANT_ID, 'cp-delete', {
      serverId: 'ws-0',
      host: 'pod-a',
      type: 'Open',
      timestamp: TS,
    });
    expect(created.stationId).not.toBeNull();

    await sequelizeInstance.query(`DELETE FROM "ChargingStations" WHERE id = ${created.stationId}`);

    const [row] = await select<{ stationId: number | null }>(
      `SELECT "stationId" FROM "WebsocketEvents" WHERE id = ${created.id}`,
    );
    expect(row).toEqual({ stationId: null });
  });

  describe('rotate_websocket_events_partitions', () => {
    it('only reports what it would create on a dry run', async () => {
      await sequelizeInstance.query(`CALL rotate_websocket_events_partitions(9999, 3, true)`);

      expect(await partitions()).toHaveLength(2);
    });

    it('provisions future weeks', async () => {
      await sequelizeInstance.query(`CALL rotate_websocket_events_partitions(9999, 3, false)`);

      expect((await partitions()).map((p) => p.name)).toEqual([
        await weekPartitionName(0),
        await weekPartitionName(1),
        await weekPartitionName(2),
        await weekPartitionName(3),
      ]);
    });

    it('drops expired weeks it manages, and leaves a partition it did not name alone', async () => {
      // Swap the MINVALUE catch-all for explicit past weeks, as rotation would leave them.
      await sequelizeInstance.query(`DROP TABLE "${await weekPartitionName(0)}"`);
      await sequelizeInstance.query(
        `CREATE TABLE "${await weekPartitionName(0)}" PARTITION OF "WebsocketEvents"
           FOR VALUES FROM (date_trunc('week', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
                        TO ((date_trunc('week', now() AT TIME ZONE 'UTC') + interval '1 week') AT TIME ZONE 'UTC')`,
      );
      for (const weeksAgo of [3, 1]) {
        await sequelizeInstance.query(
          `CREATE TABLE "${await weekPartitionName(-weeksAgo)}" PARTITION OF "WebsocketEvents"
             FOR VALUES FROM ((date_trunc('week', now() AT TIME ZONE 'UTC') - interval '${weeksAgo} week') AT TIME ZONE 'UTC')
                          TO ((date_trunc('week', now() AT TIME ZONE 'UTC') - interval '${weeksAgo - 1} week') AT TIME ZONE 'UTC')`,
        );
      }
      await sequelizeInstance.query(
        `CREATE TABLE "WebsocketEvents_manual" PARTITION OF "WebsocketEvents"
           FOR VALUES FROM (MINVALUE)
                        TO ((date_trunc('week', now() AT TIME ZONE 'UTC') - interval '3 week') AT TIME ZONE 'UTC')`,
      );

      // Keeps the current week and the one before it.
      await sequelizeInstance.query(`CALL rotate_websocket_events_partitions(2, 0, false)`);

      const names = (await partitions()).map((p) => p.name);
      expect(names).not.toContain(await weekPartitionName(-3));
      expect(names).toContain(await weekPartitionName(-1));
      expect(names).toContain(await weekPartitionName(0));
      expect(names).toContain('WebsocketEvents_manual');
    });
  });

  it('down drops the table, its partitions and the rotation procedure', async () => {
    await migration.down(queryInterface);

    const [row] = await select<{ table: string | null; procs: number }>(
      `SELECT to_regclass('"WebsocketEvents"')::text AS table,
              (SELECT count(*)::int FROM pg_proc WHERE proname = 'rotate_websocket_events_partitions') AS procs`,
    );
    expect(row).toEqual({ table: null, procs: 0 });
    expect(await select(`SELECT 1 FROM pg_class WHERE relname LIKE 'WebsocketEvents\\_%'`)).toEqual(
      [],
    );
  });
});
