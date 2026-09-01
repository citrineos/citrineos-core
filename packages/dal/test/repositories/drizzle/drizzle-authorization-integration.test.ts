// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { IdTokenEnum } from '@citrineos/types';
import {
  Authorization,
  DefaultSequelizeInstance,
  DrizzleAuthorizationRepository,
  Tariff,
  Tenant,
} from '../../../index.js';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

/**
 * The Sequelize repository eager-loads the group Authorization on every querystring read, and
 * inner-joins the Tariff in findAllAuthorizationsWithTariffs. Both relations are part of the
 * IAuthorizationRepository contract its callers rely on, so the Drizzle implementation - which
 * serves the same interface behind CITRINEOS_USE_DRIZZLE - has to populate them too.
 */
const GROUP_TOKEN = 'FLEET-PARENT';
const CARD_TOKEN = 'DRIVER-CARD-1';
const TARIFF_TOKEN = 'DRIVER-CARD-2';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let drizzleInstance: NodePgDatabase;
let drizzlePool: pg.Pool;
let config: BootstrapConfig;

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
  } as unknown as BootstrapConfig;

  // Both layers describe the same schema; Sequelize is used to create it.
  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });

  // Own the pool here rather than the shared singleton, which exposes no way to close it.
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

function aRepository(): DrizzleAuthorizationRepository {
  return new DrizzleAuthorizationRepository({ config, drizzleInstance });
}

describe('DrizzleAuthorizationRepository relations', () => {
  beforeEach(async () => {
    await Authorization.destroy({ where: {}, truncate: true, cascade: true });
    await Tariff.destroy({ where: {}, truncate: true, cascade: true });
    await Tenant.destroy({ where: {}, truncate: true, cascade: true });

    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);

    const group = await Authorization.create({
      idToken: GROUP_TOKEN,
      idTokenType: IdTokenEnum.ISO14443,
      status: 'Accepted',
      tenantId: DEFAULT_TENANT_ID,
    } as never);

    await Authorization.create({
      idToken: CARD_TOKEN,
      idTokenType: IdTokenEnum.ISO14443,
      status: 'Accepted',
      groupAuthorizationId: (group as unknown as { id: number }).id,
      tenantId: DEFAULT_TENANT_ID,
    } as never);

    const tariff = await Tariff.create({
      currency: 'GBP',
      pricePerKwh: 0.45,
      tariffId: 'driver-tariff-1',
      tenantId: DEFAULT_TENANT_ID,
    } as never);

    await Authorization.create({
      idToken: TARIFF_TOKEN,
      idTokenType: IdTokenEnum.ISO14443,
      status: 'Accepted',
      tariffId: (tariff as unknown as { id: number }).id,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
  });

  it('surfaces the group authorization, which becomes IdTokenInfo.groupIdToken', async () => {
    const found = await aRepository().readOnlyOneByQuerystring(DEFAULT_TENANT_ID, {
      idToken: CARD_TOKEN,
    });

    expect(found).toBeDefined();
    expect(found!.groupAuthorization?.idToken).toBe(GROUP_TOKEN);
  });

  it('leaves groupAuthorization unset for a token that belongs to no group', async () => {
    const found = await aRepository().readOnlyOneByQuerystring(DEFAULT_TENANT_ID, {
      idToken: GROUP_TOKEN,
    });

    expect(found).toBeDefined();
    expect(found!.groupAuthorization).toBeUndefined();
  });

  it('returns the tariff alongside each authorization that has one', async () => {
    // GetTariffsRequestOcpp21Handler skips any authorization whose tariff is falsy, so an
    // unpopulated relation drops every driver tariff from the response without an error.
    const found = await aRepository().findAllAuthorizationsWithTariffs(DEFAULT_TENANT_ID);

    expect(found).toHaveLength(1);
    expect(found[0].idToken).toBe(TARIFF_TOKEN);
    expect(found[0].tariff?.tariffId).toBe('driver-tariff-1');
  });
});
