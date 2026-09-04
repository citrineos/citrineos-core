// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SystemConfig } from '@citrineos/types';
import {
  Boot,
  ChargingStation,
  DefaultSequelizeInstance,
  SequelizeBootRepository,
  SequelizeTariffRepository,
  SequelizeTenantRepository,
  Tariff,
  Tenant,
} from '../../../index.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// ---------------------------------------------------------------------------
// Companion to TenantScopedDelete: the read-by-key paths in the Sequelize base
// repository take a tenantId and must honour it. readByKey and existsByKey
// resolved through findByPk, which ignores it entirely.
// ---------------------------------------------------------------------------

const TENANT_A = 1;
const TENANT_B = 2;
const SHARED_STATION_NAME = 'CS001';

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
  } as unknown as SystemConfig;

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
  await Tenant.create({ id: TENANT_A as any, name: TENANT_A });
  await Tenant.create({ id: TENANT_B as any, name: TENANT_B });
});

async function aStation(tenantId: number, ocppConnectionName = SHARED_STATION_NAME) {
  return ChargingStation.create({ ocppConnectionName, isOnline: false, tenantId } as any);
}

function aBootRepo(): SequelizeBootRepository {
  return new SequelizeBootRepository({ config: {} as SystemConfig, sequelizeInstance });
}

function aTariffRepo(): SequelizeTariffRepository {
  return new SequelizeTariffRepository({ config: {} as SystemConfig, sequelizeInstance });
}

describe('SequelizeRepository read tenant scoping', () => {
  describe('readByKey', () => {
    it("does not return another tenant's boot config for the same station name", async () => {
      // ChargingStation.ocppConnectionName is documented as unique per tenant but shareable
      // between tenants, so two operators naming a station CS001 is expected. Boot is keyed on
      // the station, which readByKey resolves within the tenant - so tenant B must not read
      // tenant A's boot config, including its heartbeat interval and accepted/rejected status.
      const stationA = await aStation(TENANT_A);
      await aStation(TENANT_B);
      await Boot.create({
        stationId: stationA.id,
        tenantId: TENANT_A,
        heartbeatInterval: 3600,
      } as any);

      const bootForTenantB = await aBootRepo().readByKey(TENANT_B, SHARED_STATION_NAME);

      expect(bootForTenantB).toBeUndefined();
    });

    it('returns the boot config belonging to the requesting tenant', async () => {
      const stationA = await aStation(TENANT_A);
      await Boot.create({
        stationId: stationA.id,
        tenantId: TENANT_A,
        heartbeatInterval: 3600,
      } as any);

      const bootForTenantA = await aBootRepo().readByKey(TENANT_A, SHARED_STATION_NAME);

      expect(bootForTenantA?.heartbeatInterval).toBe(3600);
    });

    it("does not return another tenant's row for a numeric primary key", async () => {
      const tariff = await Tariff.create({
        currency: 'USD',
        pricePerKwh: 1,
        tenantId: TENANT_A,
      } as any);

      const found = await aTariffRepo().readByKey(TENANT_B, tariff.id);

      expect(found).toBeUndefined();
    });
  });

  describe('the tenancy root itself', () => {
    it('reads a Tenant by key, which has no tenantId column of its own', async () => {
      // Tenants is where tenancy bottoms out: its own id is the tenant id. Adding a tenantId
      // predicate here queries a column that does not exist, and the station connection path
      // reads this row to resolve maxChargingStations - so getting it wrong refuses connections.
      const repo = new SequelizeTenantRepository({
        config: {} as SystemConfig,
        sequelizeInstance,
      });

      const tenant = await repo.readByKey(TENANT_A, TENANT_A);

      expect(tenant?.id).toBe(TENANT_A);
    });
  });

  describe('existsByKey', () => {
    it("does not report another tenant's row as existing", async () => {
      const stationA = await aStation(TENANT_A);
      await aStation(TENANT_B);
      await Boot.create({ stationId: stationA.id, tenantId: TENANT_A } as any);

      const exists = await aBootRepo().existsByKey(TENANT_B, SHARED_STATION_NAME);

      expect(exists).toBe(false);
    });

    it('reports the requesting tenant own row as existing', async () => {
      const stationA = await aStation(TENANT_A);
      await Boot.create({ stationId: stationA.id, tenantId: TENANT_A } as any);

      const exists = await aBootRepo().existsByKey(TENANT_A, SHARED_STATION_NAME);

      expect(exists).toBe(true);
    });
  });
});
