// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SystemConfig } from '@citrineos/types';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { DefaultSequelizeInstance, Tenant } from '../../index.js';

// Shared Postgres harness for the DAL integration suites. DefaultSequelizeInstance
// is a process-wide singleton (first getInstance wins), so the unit of isolation
// stays one container per test file; this wraps the per-file boilerplate only.
//
// Usage:
//   beforeAll(async () => { h = await startPgHarness(); }, 90_000);
//   beforeEach(async () => { await resetDb(h); });
//   afterAll(async () => { await h.stop(); });

// Tenant rows every suite keys its fixtures on.
const SEEDED_TENANT_IDS = [1, 2];

// The container role, reused by the connection settings so the two cannot drift.
const LOCAL_ROLE = 'test';

export interface PgHarness {
  container: StartedTestContainer;
  sequelizeInstance: Sequelize;
  config: SystemConfig;
  stop(): Promise<void>;
}

export async function startPgHarness(): Promise<PgHarness> {
  const container = await new GenericContainer('postgis/postgis:16-3.4-alpine')
    .withEnvironment({
      POSTGRES_USER: LOCAL_ROLE,
      POSTGRES_PASSWORD: LOCAL_ROLE,
      POSTGRES_DB: 'citrineos_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
    .start();

  const config = {
    database: {
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: 'citrineos_test',
      dialect: 'postgres',
      username: LOCAL_ROLE,
      password: LOCAL_ROLE,
      sync: false,
      alter: false,
      force: false,
      maxRetries: 1,
      retryDelay: 100,
    },
  } as unknown as SystemConfig;

  const sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });

  return {
    container,
    sequelizeInstance,
    config,
    // Closes sequelize, then the container; either may already be gone.
    stop: async () => {
      await sequelizeInstance.close().catch(() => undefined);
      await container.stop().catch(() => undefined);
    },
  };
}

// Wipes every table and re-seeds the tenants (ids 1 and 2) the suites key rows on.
// A single TRUNCATE lists every model table so Postgres orders the locks itself;
// sequelize.truncate({cascade}) truncates per model in parallel and deadlocks
// intermittently under load.
export async function resetDb(h: PgHarness): Promise<void> {
  const tables = Object.values(h.sequelizeInstance.models).map((model) => {
    const t = model.getTableName();
    return typeof t === 'string' ? `"${t}"` : `"${t.tableName}"`;
  });
  await h.sequelizeInstance.query(
    `TRUNCATE TABLE ${[...new Set(tables)].join(', ')} RESTART IDENTITY CASCADE;`,
  );
  // Tenant.name is NOT NULL; ids are set explicitly so RESTART IDENTITY does not
  // renumber them between tests.
  await Tenant.bulkCreate(
    SEEDED_TENANT_IDS.map((id) => ({ id: id as unknown as string, name: String(id) })),
  );
}
