// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DefaultSequelizeInstance, sequelize as dal } from '@citrineos/dal';
import type { Sequelize, TariffData } from '@citrineos/dal';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { toSystemConfig } from '../../src/db/database.js';
import { PAYMENT_MODELS } from '../../src/models/index.js';
import { PAYMENT_MIGRATIONS } from './migrations.js';
import { RuntimeEnv } from '../../src/config/types.js';

export const TENANT_A = 1;
export const TENANT_B = 2;

const ROLE = 'test';
const DATABASE = 'citrineos_test';

export interface TestDatabase {
  sequelize: Sequelize;
  stop(): Promise<void>;
}

/**
 * Core's tables come from its models; this app's tables come from its migrations, which is what
 * the tests exercise. DefaultSequelizeInstance is a process-wide singleton, so this runs once per
 * test file.
 */
export async function startTestDatabase(): Promise<TestDatabase> {
  const container: StartedTestContainer = await new GenericContainer(
    'postgis/postgis:16-3.4-alpine',
  )
    .withEnvironment({ POSTGRES_USER: ROLE, POSTGRES_PASSWORD: ROLE, POSTGRES_DB: DATABASE })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
    .start();

  const sequelize = DefaultSequelizeInstance.getInstance(
    toSystemConfig({
      env: RuntimeEnv.Development,
      database: {
        host: container.getHost(),
        port: container.getMappedPort(5432),
        database: DATABASE,
        username: ROLE,
        password: ROLE,
      },
    }),
  );
  await sequelize.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelize.sync({ force: true });
  for (const migration of PAYMENT_MIGRATIONS) {
    await migration.up(sequelize.getQueryInterface());
  }
  sequelize.addModels(PAYMENT_MODELS);

  return {
    sequelize,
    stop: async () => {
      await sequelize.close().catch(() => undefined);
      await container.stop().catch(() => undefined);
    },
  };
}

export async function resetDatabase(db: TestDatabase): Promise<void> {
  await db.sequelize.query(
    'TRUNCATE TABLE "Checkouts", "PaymentAccounts", "Tariffs", "Tenants" RESTART IDENTITY CASCADE;',
  );
  // Raw SQL because Core's TenantAttributes types the integer id column as a string.
  await db.sequelize.query(
    `INSERT INTO "Tenants" (id, name, "createdAt", "updatedAt")
     VALUES (:a, 'Tenant A', now(), now()), (:b, 'Tenant B', now(), now())`,
    { replacements: { a: TENANT_A, b: TENANT_B } },
  );
}

export async function aTariff(tenantId: number): Promise<TariffData> {
  const tariff = await dal.Tariff.create({
    tenantId,
    currency: 'USD',
    pricePerKwh: 0.42,
    pricePerMin: 0.05,
    pricePerSession: 1.5,
    taxRate: 19,
    authorizationAmount: 50,
    paymentFee: 2,
  });
  return tariff.data;
}
