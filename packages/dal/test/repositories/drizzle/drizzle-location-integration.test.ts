// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  ChargingStation,
  DefaultSequelizeInstance,
  DrizzleLocationRepository,
  Location,
  Tenant,
} from '@dal/index.js';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

/**
 * The Sequelize repository eager-loads the charging pool on readLocationById
 * (`include: [ChargingStation]`), so the Drizzle implementation - which serves the same
 * ILocationRepository behind CITRINEOS_USE_DRIZZLE - has to populate it too. A flat Drizzle
 * row cannot carry the relation, which is why it is fetched separately and asserted here.
 */
const OTHER_TENANT_ID = DEFAULT_TENANT_ID + 1;

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

function aRepository(): DrizzleLocationRepository {
  return new DrizzleLocationRepository({ config, drizzleInstance });
}

async function aLocation(name: string, tenantId: number): Promise<number> {
  const location = await Location.create({
    name,
    address: '1 Test Way',
    city: 'Testville',
    postalCode: '12345',
    state: 'TS',
    country: 'NLD',
    coordinates: { type: 'Point', coordinates: [4.895168, 52.370216] },
    tenantId,
  } as never);
  return (location as unknown as { id: number }).id;
}

describe('DrizzleLocationRepository.readLocationById', () => {
  let pooledLocationId: number;
  let emptyLocationId: number;
  let otherTenantLocationId: number;

  beforeEach(async () => {
    await ChargingStation.destroy({ where: {}, truncate: true, cascade: true });
    await Location.destroy({ where: {}, truncate: true, cascade: true });
    await Tenant.destroy({ where: {}, truncate: true, cascade: true });

    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await Tenant.create({ id: OTHER_TENANT_ID, name: 'B' } as never);

    pooledLocationId = await aLocation('Pooled', DEFAULT_TENANT_ID);
    emptyLocationId = await aLocation('Empty', DEFAULT_TENANT_ID);
    otherTenantLocationId = await aLocation('Other tenant', OTHER_TENANT_ID);

    await ChargingStation.create({
      ocppConnectionName: 'cs-001',
      isOnline: false,
      locationId: pooledLocationId,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
    await ChargingStation.create({
      ocppConnectionName: 'cs-002',
      isOnline: false,
      locationId: pooledLocationId,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
  });

  it('maps the scalar columns, including the PostGIS point', async () => {
    const found = await aRepository().readLocationById(DEFAULT_TENANT_ID, pooledLocationId);

    expect(found).toBeDefined();
    expect(found!.name).toBe('Pooled');
    expect(found!.city).toBe('Testville');
    expect(found!.coordinates.type).toBe('Point');
    expect(found!.coordinates.coordinates[0]).toBeCloseTo(4.895168);
    expect(found!.coordinates.coordinates[1]).toBeCloseTo(52.370216);
  });

  it('populates the charging pool, which the Sequelize layer eager-loads', async () => {
    const found = await aRepository().readLocationById(DEFAULT_TENANT_ID, pooledLocationId);

    expect(found).toBeDefined();
    expect(found!.chargingPool?.map((station) => station.ocppConnectionName).sort()).toEqual([
      'cs-001',
      'cs-002',
    ]);
  });

  it('returns an empty pool for a location with no charging stations', async () => {
    const found = await aRepository().readLocationById(DEFAULT_TENANT_ID, emptyLocationId);

    expect(found).toBeDefined();
    expect(found!.chargingPool).toEqual([]);
  });

  it('does not read a location belonging to another tenant', async () => {
    const found = await aRepository().readLocationById(DEFAULT_TENANT_ID, otherTenantLocationId);

    expect(found).toBeUndefined();
  });

  it('returns undefined for an unknown id', async () => {
    const found = await aRepository().readLocationById(DEFAULT_TENANT_ID, 999_999);

    expect(found).toBeUndefined();
  });
});
