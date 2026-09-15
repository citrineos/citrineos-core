// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { SystemConfig, TariffDto } from '@citrineos/types';
import {
  DefaultSequelizeInstance,
  DrizzleTariffRepository,
  SequelizeTariffRepository,
  Tariff,
  Tenant,
} from '../../../index.js';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const TENANT_ID = DEFAULT_TENANT_ID;
const TARIFF_ID = 'STD';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let drizzleInstance: NodePgDatabase;
let drizzlePool: pg.Pool;
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

  config = {
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

  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });

  drizzlePool = new pg.Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.username,
    password: config.database.password,
  });
  drizzleInstance = drizzle(drizzlePool);
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
  await Tenant.create({ id: TENANT_ID, name: String(TENANT_ID) } as never);
});

function aStationDefaultTariff(): TariffDto {
  return {
    tenantId: TENANT_ID,
    currency: 'EUR',
    pricePerKwh: 0,
    tariffId: TARIFF_ID,
    energy: { prices: [{ priceKwh: 0.25 }] },
  } as TariffDto;
}

async function storedTariff() {
  const tariff = await Tariff.findOne({ where: { tariffId: TARIFF_ID } });
  return {
    pricePerKwh: Number(tariff?.getDataValue('pricePerKwh')),
    pricePerMin: Number(tariff?.getDataValue('pricePerMin')),
    energy: tariff?.getDataValue('energy'),
  };
}

describe.each([
  ['SequelizeTariffRepository', () => new SequelizeTariffRepository({ config, sequelizeInstance })],
  ['DrizzleTariffRepository', () => new DrizzleTariffRepository({ config, drizzleInstance })],
])('%s.upsertTariffByTariffId', (_name, aRepository) => {
  it("keeps an existing tariff's central prices when the station accepts it as its default", async () => {
    await Tariff.create({
      tenantId: TENANT_ID,
      currency: 'EUR',
      pricePerKwh: 0.3,
      pricePerMin: 0.05,
      tariffId: TARIFF_ID,
    } as never);

    await aRepository().upsertTariffByTariffId(TENANT_ID, aStationDefaultTariff());

    expect(await storedTariff()).toEqual({
      pricePerKwh: 0.3,
      pricePerMin: 0.05,
      energy: { prices: [{ priceKwh: 0.25 }] },
    });
  });

  it('creates a tariff with no central price when the tariffId is new', async () => {
    await aRepository().upsertTariffByTariffId(TENANT_ID, aStationDefaultTariff());

    const { pricePerKwh, energy } = await storedTariff();
    expect({ pricePerKwh, energy }).toEqual({
      pricePerKwh: 0,
      energy: { prices: [{ priceKwh: 0.25 }] },
    });
  });
});
