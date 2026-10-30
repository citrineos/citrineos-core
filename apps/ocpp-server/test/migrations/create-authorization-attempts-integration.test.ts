// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { QueryTypes, type QueryInterface } from 'sequelize';
import { type BootstrapConfig, DEFAULT_TENANT_ID } from '@citrineos/base';
import type { AuthorizationAttemptCreate, SystemConfig } from '@citrineos/types';
import {
  DefaultDrizzleInstance,
  DefaultSequelizeInstance,
  DrizzleAuthorizationAttemptRepository,
  registeredTables,
  SequelizeAuthorizationAttemptRepository,
} from '@citrineos/dal';
import { validateDrizzleSchema } from '@citrineos/ocpp';
import migration from '../../db/migrations/20261016120000-create-authorization-attempts.js';

const TS = '2026-10-16T12:00:00.000Z';

const ATTEMPT: Omit<AuthorizationAttemptCreate, 'stationId' | 'tenantId'> = {
  ocppVersion: 'ocpp2.0.1',
  action: 'Authorize',
  correlationId: 'corr-1',
  timestamp: TS,
  idToken: 'TOKEN-1',
  idTokenType: 'ISO14443',
  responseStatus: 'Unknown',
  reason: 'NotFound',
};

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
  await sequelizeInstance.query('DROP TABLE "AuthorizationAttempts"');
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
      WHERE i.inhparent = '"AuthorizationAttempts"'::regclass
      ORDER BY c.relname`,
  );
}

async function weekPartitionName(weeksFromNow: number): Promise<string> {
  const [row] = await select<{ name: string }>(
    `SELECT 'AuthorizationAttempts_' || to_char(
              date_trunc('week', now() AT TIME ZONE 'UTC') + make_interval(weeks => ${weeksFromNow}),
              'IYYY"w"IW') AS name`,
  );
  return row.name;
}

function makeRepo(): SequelizeAuthorizationAttemptRepository {
  return new SequelizeAuthorizationAttemptRepository({ config, sequelizeInstance });
}

describe('20261016120000-create-authorization-attempts', () => {
  it('creates AuthorizationAttempts range partitioned on createdAt', async () => {
    const [row] = await select<{ strategy: string; key: string }>(
      `SELECT p.partstrat AS strategy, pg_get_partkeydef(p.partrelid) AS key
         FROM pg_partitioned_table p WHERE p.partrelid = '"AuthorizationAttempts"'::regclass`,
    );

    expect(row).toEqual({ strategy: 'r', key: 'RANGE ("createdAt")' });
  });

  it('keys rows on (id, createdAt), since a partitioned unique key needs the partition key', async () => {
    const rows = await select<{ column: string }>(
      `SELECT a.attname AS column
         FROM pg_index ix
         JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = ANY (ix.indkey)
        WHERE ix.indrelid = '"AuthorizationAttempts"'::regclass AND ix.indisprimary
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
      tables: registeredTables().filter((t) => t.name === 'AuthorizationAttempts'),
    });

    expect(report.tablesChecked).toBe(1);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  it('routes a repository insert into the current week', async () => {
    const created = await makeRepo().createAuthorizationAttempt(
      DEFAULT_TENANT_ID,
      'cp-unknown',
      ATTEMPT,
    );

    const [row] = await select<{ partition: string }>(
      `SELECT tableoid::regclass::text AS partition FROM "AuthorizationAttempts" WHERE id = ${created.id}`,
    );
    expect(row.partition).toBe(`"${await weekPartitionName(0)}"`);
    expect(created.stationId).toBeNull();
  });

  it('writes the same row through the drizzle repository', async () => {
    const repo = new DrizzleAuthorizationAttemptRepository({ config });
    const created = await repo.createAuthorizationAttempt(DEFAULT_TENANT_ID, 'cp-unknown', {
      ...ATTEMPT,
      details: { errorCode: 'InternalError' },
      transactionId: 'tx-1',
    });

    expect(created).toMatchObject({
      ...ATTEMPT,
      details: { errorCode: 'InternalError' },
      transactionId: 'tx-1',
      stationId: null,
      tenantId: DEFAULT_TENANT_ID,
    });
  });

  it('keeps an attempt and clears its links when the station and authorization are deleted', async () => {
    await sequelizeInstance.query(
      `INSERT INTO "ChargingStations" ("ocppConnectionName", "isOnline", "tenantId", "createdAt", "updatedAt")
       VALUES ('cp-delete', false, ${DEFAULT_TENANT_ID}, NOW(), NOW())`,
    );
    const [authorization] = await select<{ id: number }>(
      `INSERT INTO "Authorizations" ("idToken", "idTokenType", status, "tenantId", "createdAt", "updatedAt")
       VALUES ('TOKEN-1', 'ISO14443', 'Accepted', ${DEFAULT_TENANT_ID}, NOW(), NOW())
       RETURNING id`,
    );
    const created = await makeRepo().createAuthorizationAttempt(DEFAULT_TENANT_ID, 'cp-delete', {
      ...ATTEMPT,
      authorizationId: authorization.id,
      storedStatus: 'Accepted',
      responseStatus: 'Accepted',
      reason: 'Accepted',
    });
    expect(created.stationId).not.toBeNull();

    await sequelizeInstance.query(`DELETE FROM "ChargingStations" WHERE id = ${created.stationId}`);
    await sequelizeInstance.query(`DELETE FROM "Authorizations" WHERE id = ${authorization.id}`);

    const [row] = await select<{ stationId: number | null; authorizationId: number | null }>(
      `SELECT "stationId", "authorizationId" FROM "AuthorizationAttempts" WHERE id = ${created.id}`,
    );
    expect(row).toEqual({ stationId: null, authorizationId: null });
  });

  describe('rotate_authorization_attempts_partitions', () => {
    it('only reports what it would create on a dry run', async () => {
      await sequelizeInstance.query(`CALL rotate_authorization_attempts_partitions(9999, 3, true)`);

      expect(await partitions()).toHaveLength(2);
    });

    it('provisions future weeks', async () => {
      await sequelizeInstance.query(
        `CALL rotate_authorization_attempts_partitions(9999, 3, false)`,
      );

      expect((await partitions()).map((p) => p.name)).toEqual([
        await weekPartitionName(0),
        await weekPartitionName(1),
        await weekPartitionName(2),
        await weekPartitionName(3),
      ]);
    });
  });

  it('down drops the table, its partitions and the rotation procedure', async () => {
    await migration.down(queryInterface);

    const [row] = await select<{ table: string | null; procs: number }>(
      `SELECT to_regclass('"AuthorizationAttempts"')::text AS table,
              (SELECT count(*)::int FROM pg_proc WHERE proname = 'rotate_authorization_attempts_partitions') AS procs`,
    );
    expect(row).toEqual({ table: null, procs: 0 });
    expect(
      await select(`SELECT 1 FROM pg_class WHERE relname LIKE 'AuthorizationAttempts\\_%'`),
    ).toEqual([]);
  });
});
