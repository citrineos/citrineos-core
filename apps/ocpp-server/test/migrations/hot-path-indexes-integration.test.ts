// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { QueryTypes, type QueryInterface } from 'sequelize';
import type { BootstrapConfig } from '@citrineos/base';
import { DefaultSequelizeInstance } from '@citrineos/dal';
import {
  HOT_PATH_INDEXES,
  down,
  up,
} from '../../migrations/20260902120000-add-hot-path-indexes.js';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let queryInterface: QueryInterface;

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

  sequelizeInstance = DefaultSequelizeInstance.getInstance({
    database: {
      host: pgContainer.getHost(),
      port: pgContainer.getMappedPort(5432),
      database: 'citrineos_test',
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      sync: false,
      alter: false,
      force: false,
      maxRetries: 1,
      retryDelay: 100,
    },
  } as unknown as BootstrapConfig);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });
  queryInterface = sequelizeInstance.getQueryInterface();
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

interface IndexRow {
  tablename: string;
  indexname: string;
  indexdef: string;
}

async function indexes(): Promise<IndexRow[]> {
  return sequelizeInstance.query<IndexRow>(
    `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'`,
    { type: QueryTypes.SELECT },
  );
}

describe('Hot-path index migration', () => {
  it('names an index for every column set the repositories read by', async () => {
    const before = (await indexes()).map((row) => row.indexname);

    await up(queryInterface);

    const after = await indexes();
    for (const index of HOT_PATH_INDEXES) {
      expect(before).not.toContain(index.name);
      const row = after.find((candidate) => candidate.indexname === index.name);
      expect(row, index.name).toBeDefined();
      expect(row!.tablename).toBe(index.table);
      expect(row!.indexdef).toContain(
        `(${index.columns.map((column) => `"${column}"`).join(', ')})`,
      );
    }
  });

  it('can be applied twice', async () => {
    await up(queryInterface);
    await up(queryInterface);

    const names = (await indexes()).map((row) => row.indexname);
    for (const index of HOT_PATH_INDEXES) {
      expect(names.filter((name) => name === index.name)).toHaveLength(1);
    }
  });

  it('removes every index it added and nothing else', async () => {
    await up(queryInterface);
    const withIndexes = (await indexes()).map((row) => row.indexname);

    await down(queryInterface);

    const names = (await indexes()).map((row) => row.indexname);
    for (const index of HOT_PATH_INDEXES) {
      expect(names).not.toContain(index.name);
    }
    expect(names.sort()).toEqual(
      withIndexes.filter((name) => !HOT_PATH_INDEXES.some((index) => index.name === name)).sort(),
    );
  });
});
