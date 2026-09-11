// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { QueryInterface } from 'sequelize';
import type { Sequelize } from 'sequelize-typescript';
import { DefaultSequelizeInstance } from '@citrineos/dal';
import { validateSequelizeSchema } from '@/util/index.js';
import type { SystemConfig } from '@citrineos/types';

const MIGRATIONS_DIR = fileURLToPath(
  new URL('../../../../apps/ocpp-server/migrations/', import.meta.url),
);

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
}

async function runMigrations(queryInterface: QueryInterface): Promise<string[]> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.ts'))
    .sort();
  for (const file of files) {
    const module = (await import(pathToFileURL(join(MIGRATIONS_DIR, file)).href)) as Migration & {
      default?: Migration;
    };
    await (module.default ?? module).up(queryInterface);
  }
  return files;
}

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let migrationsRun: string[];

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

  const dbConfig = {
    database: {
      host: pgContainer.getHost(),
      port: pgContainer.getMappedPort(5432),
      database: 'citrineos_test',
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      schema: 'public',
      sync: false,
      alter: false,
      force: false,
      maxRetries: 1,
      retryDelay: 100,
    },
  } as unknown as SystemConfig;

  sequelizeInstance = DefaultSequelizeInstance.getInstance(dbConfig);
  migrationsRun = await runMigrations(sequelizeInstance.getQueryInterface());
}, 240_000);

afterAll(async () => {
  await sequelizeInstance.close();
  await pgContainer.stop();
});

describe('SequelizeSchemaValidatorMigrationsIntegration', () => {
  describe('validateSequelizeSchema against a schema built by the migrations', () => {
    it('applies every migration', () => {
      expect(migrationsRun.length).toBeGreaterThan(0);
    });

    it('reports no errors', async () => {
      const report = await validateSequelizeSchema(sequelizeInstance, { schema: 'public' });

      expect(report.errors, JSON.stringify(report.errors, null, 2)).toEqual([]);
      expect(report.tablesChecked).toBeGreaterThan(0);
      expect(report.columnsChecked).toBeGreaterThan(0);
    });

    it('reports no warnings', async () => {
      const report = await validateSequelizeSchema(sequelizeInstance, { schema: 'public' });

      expect(report.warnings, JSON.stringify(report.warnings, null, 2)).toEqual([]);
    });
  });
});
