// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { QueryTypes } from 'sequelize';
import type { Sequelize } from 'sequelize-typescript';
import { baseCalculateTotalCost, DEFAULT_TENANT_ID } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import {
  DefaultSequelizeInstance,
  SequelizeTariffRepository,
  Tariff,
  Tenant,
} from '../../../index.js';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
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
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

describe('SequelizeTariffRepository with only the required prices set', () => {
  let repository: SequelizeTariffRepository;
  let tariffId: number;

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    repository = new SequelizeTariffRepository({
      config,
      logger: undefined,
      sequelizeInstance,
    } as never);

    const tariff = await Tariff.create({
      tenantId: DEFAULT_TENANT_ID,
      currency: 'EUR',
      pricePerKwh: 0.3,
    } as never);
    tariffId = (tariff as unknown as { id: number }).id;
  });

  it('reads the unset prices back as null', async () => {
    const tariff = await repository.findById(DEFAULT_TENANT_ID, tariffId);

    expect({
      pricePerMin: tariff?.pricePerMin,
      pricePerSession: tariff?.pricePerSession,
      authorizationAmount: tariff?.authorizationAmount,
      paymentFee: tariff?.paymentFee,
      taxRate: tariff?.taxRate,
    }).toEqual({
      pricePerMin: null,
      pricePerSession: null,
      authorizationAmount: null,
      paymentFee: null,
      taxRate: null,
    });
  });

  it('prices a session from the tariff it reads', async () => {
    const tariff = await repository.findById(DEFAULT_TENANT_ID, tariffId);

    const price = baseCalculateTotalCost(
      10,
      30,
      tariff!.pricePerSession,
      tariff!.pricePerKwh,
      tariff!.pricePerMin,
      tariff!.currency,
      tariff!.taxRate,
    );

    expect(price).toEqual({ excl_vat: 3 });
  });

  it('leaves the unset prices NULL in the database when the tariff is updated', async () => {
    await repository.upsertTariff(DEFAULT_TENANT_ID, {
      id: tariffId,
      currency: 'EUR',
      pricePerKwh: 0.35,
    } as never);

    const [row] = await sequelizeInstance.query(
      'SELECT "pricePerMin"::text, "pricePerSession"::text, "authorizationAmount"::text, ' +
        '"paymentFee"::text, "taxRate"::text FROM "Tariffs" WHERE id = :id',
      { replacements: { id: tariffId }, type: QueryTypes.SELECT },
    );
    expect(row).toEqual({
      pricePerMin: null,
      pricePerSession: null,
      authorizationAmount: null,
      paymentFee: null,
      taxRate: null,
    });
  });
});
