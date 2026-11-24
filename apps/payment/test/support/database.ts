// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DefaultSequelizeInstance } from '@citrineos/dal';
import type { TariffData } from '@citrineos/dal';
import type pg from 'pg';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { PaymentConfig } from '../../src/config/types.js';
import { RuntimeEnv } from '../../src/config/types.js';
import { connectDatabase, toSystemConfig, type PaymentDatabase } from '../../src/db/database.js';
import { migratePaymentTables } from '../../src/db/migrate.js';

export const TENANT_A = 1;
export const TENANT_B = 2;

const ROLE = 'test';
const DATABASE = 'citrineos_test';

export interface TestDatabase {
  db: PaymentDatabase;
  /** The pool behind `db`, for raw SQL with $1-style parameters. */
  pool: pg.Pool;
  config: PaymentConfig['database'];
  stop(): Promise<void>;
}

/**
 * Core's tables come from its Sequelize models, which are still what defines Core's schema; this
 * app's tables come from its own migrations, which is what the tests exercise. Runs once per test
 * file.
 */
export async function startTestDatabase(): Promise<TestDatabase> {
  const container: StartedTestContainer = await new GenericContainer(
    'postgis/postgis:16-3.4-alpine',
  )
    .withEnvironment({ POSTGRES_USER: ROLE, POSTGRES_PASSWORD: ROLE, POSTGRES_DB: DATABASE })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
    .start();

  const config: PaymentConfig['database'] = {
    host: container.getHost(),
    port: container.getMappedPort(5432),
    database: DATABASE,
    username: ROLE,
    password: ROLE,
  };
  const core = DefaultSequelizeInstance.getInstance(
    toSystemConfig({ env: RuntimeEnv.Development, database: config }),
  );
  await core.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await core.sync({ force: true });
  await core.close();

  const connection = await connectDatabase({ database: config });
  await migratePaymentTables(connection.db);

  return {
    db: connection.db,
    pool: connection.pool,
    config,
    stop: async () => {
      await connection.close().catch(() => undefined);
      await container.stop().catch(() => undefined);
    },
  };
}

export async function resetDatabase(db: TestDatabase): Promise<void> {
  await db.pool.query(
    'TRUNCATE TABLE "Checkouts", "PaymentAccounts", "Tariffs", "Tenants" RESTART IDENTITY CASCADE;',
  );
  await db.pool.query(
    `INSERT INTO "Tenants" (id, name, "createdAt", "updatedAt")
     VALUES ($1, 'Tenant A', now(), now()), ($2, 'Tenant B', now(), now())`,
    [TENANT_A, TENANT_B],
  );
}

export async function aTariff(db: TestDatabase, tenantId: number): Promise<TariffData> {
  const tariff = {
    currency: 'USD',
    pricePerKwh: 0.42,
    pricePerMin: 0.05,
    pricePerSession: 1.5,
    taxRate: 19,
    authorizationAmount: 50,
    paymentFee: 2,
  };
  const { rows } = await db.pool.query<{ id: number }>(
    `INSERT INTO "Tariffs" ("tenantId", currency, "pricePerKwh", "pricePerMin", "pricePerSession",
       "taxRate", "authorizationAmount", "paymentFee", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now()) RETURNING id`,
    [
      tenantId,
      tariff.currency,
      tariff.pricePerKwh,
      tariff.pricePerMin,
      tariff.pricePerSession,
      tariff.taxRate,
      tariff.authorizationAmount,
      tariff.paymentFee,
    ],
  );
  return { id: rows[0].id, ...tariff };
}

/**
 * Raw SQL with `:name` parameters, the rows it returns. For setting up and inspecting Core's
 * tables, which no repository of this app writes.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  db: TestDatabase,
  text: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const values: unknown[] = [];
  const positional = text.replace(/(?<!:):([A-Za-z_]\w*)/g, (match, name: string) => {
    if (!(name in params)) {
      return match;
    }
    values.push(params[name]);
    return `$${values.length}`;
  });
  return (await db.pool.query<T>(positional, values)).rows;
}
