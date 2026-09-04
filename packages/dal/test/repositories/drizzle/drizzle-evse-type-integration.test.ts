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
  Connector,
  DefaultSequelizeInstance,
  DrizzleEvseTypeRepository,
  EvseType,
  SequelizeLocationRepository,
  Tenant,
} from '../../../index.js';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

/**
 * findEvseByIdAndConnectorId matches on the OCPP EVSE id (`id`), not the primary key
 * (`databaseId`), and treats connectorId as a value including null — a row with no
 * connectorId denotes the EVSE as a whole. The Sequelize original expresses that as
 * `where: { id, connectorId }`, which Sequelize turns into `connectorId IS NULL` for a
 * null value; the Drizzle version has to say so explicitly.
 *
 * EvseTypes.connectorId carries a real FK onto Connectors.id — declared from the
 * Connector side (`@HasMany(() => EvseType, 'connectorId')`), not on the EvseType
 * model — so connector-level fixtures have to commission a real Connector first.
 */
const OTHER_TENANT_ID = DEFAULT_TENANT_ID + 1;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let drizzleInstance: NodePgDatabase;
let drizzlePool: pg.Pool;
let config: BootstrapConfig;
let locationRepository: SequelizeLocationRepository;

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

  locationRepository = new SequelizeLocationRepository({ config, sequelizeInstance });
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

function aRepository(): DrizzleEvseTypeRepository {
  return new DrizzleEvseTypeRepository({ config, drizzleInstance });
}

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
  await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
  await Tenant.create({ id: OTHER_TENANT_ID, name: 'B' } as never);
});

// A connector-level EvseType needs a real Connectors row to point at, and a Connector
// in turn needs a station plus an FK-valid evse/evseType pair — which the Sequelize
// commissioning helper produces.
const STATION = 'cs-evse-type-1';

async function aConnector(): Promise<number> {
  const station = await ChargingStation.create({
    ocppConnectionName: STATION,
    isOnline: true,
    tenantId: DEFAULT_TENANT_ID,
  } as never);
  const { evseId, evseTypeConnectorId } = await locationRepository.commissionEvseForOcpp16Connector(
    DEFAULT_TENANT_ID,
    STATION,
    1,
  );
  const connector = await Connector.create({
    stationId: (station as unknown as { id: number }).id,
    evseId,
    connectorId: 1,
    evseTypeConnectorId,
    ocppConnectionName: STATION,
    status: 'Available',
    errorCode: 'NoError',
    timestamp: new Date().toISOString(),
    tenantId: DEFAULT_TENANT_ID,
  } as never);
  return (connector as unknown as { id: number }).id;
}

describe('DrizzleEvseTypeRepository.findEvseByIdAndConnectorId', () => {
  it('finds the EVSE-level row when connectorId is null', async () => {
    await EvseType.create({ id: 1, connectorId: null, tenantId: DEFAULT_TENANT_ID } as never);

    const found = await aRepository().findEvseByIdAndConnectorId(DEFAULT_TENANT_ID, 1, null);

    expect(found).toBeDefined();
    expect(found!.id).toBe(1);
    expect(found!.connectorId).toBeNull();
  });

  it('does not return a connector-level row when asked for the EVSE-level one', async () => {
    // Only a row WITH a connectorId exists; a null lookup must not fall back to it.
    const connectorId = await aConnector();
    await EvseType.create({ id: 5, connectorId, tenantId: DEFAULT_TENANT_ID } as never);

    const found = await aRepository().findEvseByIdAndConnectorId(DEFAULT_TENANT_ID, 5, null);

    expect(found).toBeUndefined();
  });

  it('finds the connector-level row when connectorId is supplied', async () => {
    const connectorId = await aConnector();
    await EvseType.create({ id: 5, connectorId: null, tenantId: DEFAULT_TENANT_ID } as never);
    await EvseType.create({ id: 5, connectorId, tenantId: DEFAULT_TENANT_ID } as never);

    const found = await aRepository().findEvseByIdAndConnectorId(DEFAULT_TENANT_ID, 5, connectorId);

    expect(found).toBeDefined();
    expect(found!.connectorId).toBe(connectorId);
  });

  it('matches on the OCPP id, not the primary key', async () => {
    // Two rows so databaseId and id deliberately diverge.
    await EvseType.create({ id: 7, connectorId: null, tenantId: DEFAULT_TENANT_ID } as never);
    const second = await EvseType.create({
      id: 9,
      connectorId: null,
      tenantId: DEFAULT_TENANT_ID,
    } as never);

    const found = await aRepository().findEvseByIdAndConnectorId(DEFAULT_TENANT_ID, 9, null);

    expect(found!.id).toBe(9);
    expect(found!.databaseId).toBe((second as unknown as { databaseId: number }).databaseId);
  });

  it('returns undefined for an unknown id', async () => {
    const found = await aRepository().findEvseByIdAndConnectorId(DEFAULT_TENANT_ID, 999, null);

    expect(found).toBeUndefined();
  });

  it('does not read an EVSE type belonging to another tenant', async () => {
    await EvseType.create({ id: 1, connectorId: null, tenantId: DEFAULT_TENANT_ID } as never);

    const found = await aRepository().findEvseByIdAndConnectorId(OTHER_TENANT_ID, 1, null);

    expect(found).toBeUndefined();
  });
});
