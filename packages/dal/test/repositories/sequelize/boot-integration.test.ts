// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootConfig, BootstrapConfig } from '@citrineos/base';
import {
  Boot,
  ChargingStation,
  DefaultSequelizeInstance,
  SequelizeBootRepository,
  Tenant,
} from '../../../index.js';

// Regression coverage for the Boot tenant leak: keyed by OCPP connection name
// alone, "Boots" was globally unique, so two tenants with a same-named station
// could not both have a record. It is now keyed by a NOT NULL unique stationId.

const TENANT_A = 1;
const TENANT_B = 2;
const SHARED_NAME = 'CS-001';

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
  await Tenant.create({ id: TENANT_A as any, name: TENANT_A });
  await Tenant.create({ id: TENANT_B as any, name: TENANT_B });
});

function makeRepo(): SequelizeBootRepository {
  return new SequelizeBootRepository({ config: {} as BootstrapConfig, sequelizeInstance });
}

function aBootConfig(status: string): BootConfig {
  return { status } as BootConfig;
}

async function aStation(tenantId: number, ocppConnectionName = SHARED_NAME) {
  return ChargingStation.create({
    ocppConnectionName,
    isOnline: false,
    tenantId,
  } as any);
}

describe('SequelizeBootRepository tenant scoping', () => {
  it('keeps separate boot records for two tenants sharing a station name', async () => {
    const repo = makeRepo();
    const stationA = await aStation(TENANT_A);
    const stationB = await aStation(TENANT_B);

    const bootA = await repo.createOrUpdateByKey(TENANT_A, aBootConfig('Accepted'), SHARED_NAME);
    const bootB = await repo.createOrUpdateByKey(TENANT_B, aBootConfig('Pending'), SHARED_NAME);

    expect(bootA!.id).not.toBe(bootB!.id);
    expect(bootA!.stationId).toBe(stationA.id);
    expect(bootB!.stationId).toBe(stationB.id);

    expect((await repo.readByKey(TENANT_A, SHARED_NAME))!.status).toBe('Accepted');
    expect((await repo.readByKey(TENANT_B, SHARED_NAME))!.status).toBe('Pending');
    expect(await Boot.count()).toBe(2);
  });

  it('updateByKey only touches the calling tenant', async () => {
    const repo = makeRepo();
    await aStation(TENANT_A);
    await aStation(TENANT_B);
    await repo.createOrUpdateByKey(TENANT_A, aBootConfig('Accepted'), SHARED_NAME);
    await repo.createOrUpdateByKey(TENANT_B, aBootConfig('Accepted'), SHARED_NAME);

    await repo.updateByKey(TENANT_A, { status: 'Rejected' }, SHARED_NAME);

    expect((await repo.readByKey(TENANT_A, SHARED_NAME))!.status).toBe('Rejected');
    expect((await repo.readByKey(TENANT_B, SHARED_NAME))!.status).toBe('Accepted');
  });

  it('deleteByKey only touches the calling tenant', async () => {
    const repo = makeRepo();
    await aStation(TENANT_A);
    await aStation(TENANT_B);
    await repo.createOrUpdateByKey(TENANT_A, aBootConfig('Accepted'), SHARED_NAME);
    await repo.createOrUpdateByKey(TENANT_B, aBootConfig('Accepted'), SHARED_NAME);

    const deleted = await repo.deleteByKey(TENANT_A, SHARED_NAME);

    expect(deleted).toBeDefined();
    expect(await repo.existsByKey(TENANT_A, SHARED_NAME)).toBe(false);
    expect(await repo.existsByKey(TENANT_B, SHARED_NAME)).toBe(true);
  });

  it('refuses to write a boot record for a station that does not exist', async () => {
    const repo = makeRepo();

    await expect(
      repo.createOrUpdateByKey(TENANT_A, aBootConfig('Pending'), SHARED_NAME),
    ).rejects.toThrow(/no charging station/i);
  });

  it('does not see another tenant’s station when resolving the key', async () => {
    const repo = makeRepo();
    await aStation(TENANT_B);

    // The name exists, but only under tenant B.
    await expect(
      repo.createOrUpdateByKey(TENANT_A, aBootConfig('Pending'), SHARED_NAME),
    ).rejects.toThrow(/no charging station/i);
    expect(await repo.readByKey(TENANT_A, SHARED_NAME)).toBeUndefined();
  });

  it('deletes the boot record when its charging station is deleted', async () => {
    const repo = makeRepo();
    const station = await aStation(TENANT_A);
    await repo.createOrUpdateByKey(TENANT_A, aBootConfig('Accepted'), SHARED_NAME);

    await station.destroy();

    expect(await repo.existsByKey(TENANT_A, SHARED_NAME)).toBe(false);
  });
});
