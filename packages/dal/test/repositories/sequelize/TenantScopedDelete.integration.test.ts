// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import {
  DefaultSequelizeInstance,
  SequelizeTariffRepository,
  Tariff,
  Tenant,
} from '@citrineos/dal';
import type { TariffQueryString } from '@dal/interfaces/queries/Tariff.js';

// ---------------------------------------------------------------------------
// Regression coverage for the cross-tenant DELETE bug: a delete scoped to
// tenant A must never touch another tenant's rows. Both the delete-by-query
// and delete-by-key paths in the Sequelize base repository are exercised.
// ---------------------------------------------------------------------------

const TENANT_A = 1;
const TENANT_B = 2;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;

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
      sync: false,
      alter: false,
      force: false,
      maxRetries: 1,
      retryDelay: 100,
    },
  } as unknown as BootstrapConfig;

  sequelizeInstance = DefaultSequelizeInstance.getInstance(dbConfig);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance.close();
  await pgContainer.stop();
});

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
  await Tenant.create({ id: TENANT_A as any });
  await Tenant.create({ id: TENANT_B as any });
});

function makeRepo(): SequelizeTariffRepository {
  return new SequelizeTariffRepository({ config: {} as BootstrapConfig, sequelizeInstance });
}

function aTariffForTenantB(): Promise<Tariff> {
  return Tariff.create({ currency: 'USD', pricePerKwh: 1, tenantId: TENANT_B } as any);
}

describe('SequelizeRepository delete tenant scoping', () => {
  describe('deleteAllByQuery (via Tariff deleteAllByQuerystring)', () => {
    it("does not delete another tenant's row matched by id", async () => {
      const repo = makeRepo();
      const tariff = await aTariffForTenantB();

      const deleted = await repo.deleteAllByQuerystring(TENANT_A, {
        tenantId: TENANT_A,
        id: tariff.id,
      } as unknown as TariffQueryString);

      expect(deleted).toHaveLength(0);
      expect(await Tariff.findByPk(tariff.id)).not.toBeNull();
    });

    it('deletes the row for its owning tenant', async () => {
      const repo = makeRepo();
      const tariff = await aTariffForTenantB();

      const deleted = await repo.deleteAllByQuerystring(TENANT_B, {
        tenantId: TENANT_B,
        id: tariff.id,
      } as unknown as TariffQueryString);

      expect(deleted).toHaveLength(1);
      expect(await Tariff.findByPk(tariff.id)).toBeNull();
    });
  });

  describe('deleteByKey', () => {
    it("does not delete another tenant's row by primary key", async () => {
      const repo = makeRepo();
      const tariff = await aTariffForTenantB();

      const result = await repo.deleteByKey(TENANT_A, String(tariff.id));

      expect(result).toBeUndefined();
      expect(await Tariff.findByPk(tariff.id)).not.toBeNull();
    });

    it('deletes the row by primary key for its owning tenant', async () => {
      const repo = makeRepo();
      const tariff = await aTariffForTenantB();

      const result = await repo.deleteByKey(TENANT_B, String(tariff.id));

      expect(result).toBeDefined();
      expect(await Tariff.findByPk(tariff.id)).toBeNull();
    });
  });
});
