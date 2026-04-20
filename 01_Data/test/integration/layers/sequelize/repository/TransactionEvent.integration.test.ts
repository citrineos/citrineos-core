// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { IChargingStationSequenceRepository } from '@citrineos/data';
import {
  ChargingStation,
  DefaultSequelizeInstance,
  Evse,
  SequelizeTransactionEventRepository,
  Tenant,
  Transaction,
} from '@citrineos/data';

const STATION_ID = 'station-abc';
const OTHER_STATION_ID = 'station-other';
const EVSE_TYPE_ID = 1;
const OTHER_EVSE_TYPE_ID = 2;
const OLD_TXN_ID = 'txn-old-001';
const NEW_TXN_ID = 'txn-new-002';

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
});

function makeRepo(): SequelizeTransactionEventRepository {
  const mockChargingStationSequence = {} as unknown as IChargingStationSequenceRepository;
  return new SequelizeTransactionEventRepository(
    {} as BootstrapConfig,
    /* logger */ undefined,
    /* namespace */ undefined,
    sequelizeInstance,
    /* transaction */ undefined,
    /* station */ undefined,
    /* evse */ undefined,
    /* meterValue */ undefined,
    /* startTransaction */ undefined,
    /* stopTransaction */ undefined,
    /* connector */ undefined,
    mockChargingStationSequence,
  );
}

async function seedTenant(): Promise<Tenant> {
  return Tenant.create({ id: DEFAULT_TENANT_ID, name: 'Test Tenant' });
}

async function seedStation(stationId: string): Promise<ChargingStation> {
  return ChargingStation.create({
    id: stationId,
    isOnline: false,
    tenantId: DEFAULT_TENANT_ID,
  });
}

async function seedEvse(stationId: string, evseTypeId: number): Promise<Evse> {
  return Evse.create({
    stationId,
    evseTypeId,
    evseId: `${stationId}-evse-${evseTypeId}`,
    tenantId: DEFAULT_TENANT_ID,
  });
}

async function seedTransaction(
  stationId: string,
  transactionId: string,
  evseId: number,
  isActive: boolean,
): Promise<Transaction> {
  return Transaction.create({
    stationId,
    transactionId,
    evseId,
    isActive,
    tenantId: DEFAULT_TENANT_ID,
  });
}

describe('SequelizeTransactionEventRepository.deactivateActiveTransactionsByStationIdAndEvseId', () => {
  it('sets isActive=false on an existing active transaction at the same EVSE', async () => {
    await seedTenant();
    await seedStation(STATION_ID);
    const evse = await seedEvse(STATION_ID, EVSE_TYPE_ID);
    await seedTransaction(STATION_ID, OLD_TXN_ID, evse.id, true);

    const repo = makeRepo();
    const deactivated = await repo.deactivateActiveTransactionsByStationIdAndEvseId(
      DEFAULT_TENANT_ID,
      STATION_ID,
      EVSE_TYPE_ID,
      NEW_TXN_ID,
    );

    expect(deactivated).toHaveLength(1);

    const reloaded = await Transaction.findOne({ where: { transactionId: OLD_TXN_ID } });
    expect(reloaded?.isActive).toBe(false);
  });

  it('does NOT deactivate the new transaction itself (excludeTransactionId)', async () => {
    await seedTenant();
    await seedStation(STATION_ID);
    const evse = await seedEvse(STATION_ID, EVSE_TYPE_ID);
    await seedTransaction(STATION_ID, NEW_TXN_ID, evse.id, true);

    const repo = makeRepo();
    const deactivated = await repo.deactivateActiveTransactionsByStationIdAndEvseId(
      DEFAULT_TENANT_ID,
      STATION_ID,
      EVSE_TYPE_ID,
      NEW_TXN_ID,
    );

    expect(deactivated).toHaveLength(0);

    const reloaded = await Transaction.findOne({ where: { transactionId: NEW_TXN_ID } });
    expect(reloaded?.isActive).toBe(true);
  });

  it('does NOT deactivate active transactions at a different EVSE', async () => {
    await seedTenant();
    await seedStation(STATION_ID);
    await seedEvse(STATION_ID, EVSE_TYPE_ID);
    const otherEvse = await seedEvse(STATION_ID, OTHER_EVSE_TYPE_ID);
    await seedTransaction(STATION_ID, OLD_TXN_ID, otherEvse.id, true);

    const repo = makeRepo();
    const deactivated = await repo.deactivateActiveTransactionsByStationIdAndEvseId(
      DEFAULT_TENANT_ID,
      STATION_ID,
      EVSE_TYPE_ID,
      NEW_TXN_ID,
    );

    expect(deactivated).toHaveLength(0);

    const reloaded = await Transaction.findOne({ where: { transactionId: OLD_TXN_ID } });
    expect(reloaded?.isActive).toBe(true);
  });

  it('deactivates multiple concurrent active transactions at the same EVSE', async () => {
    await seedTenant();
    await seedStation(STATION_ID);
    const evse = await seedEvse(STATION_ID, EVSE_TYPE_ID);
    await seedTransaction(STATION_ID, 'txn-old-A', evse.id, true);
    await seedTransaction(STATION_ID, 'txn-old-B', evse.id, true);

    const repo = makeRepo();
    const deactivated = await repo.deactivateActiveTransactionsByStationIdAndEvseId(
      DEFAULT_TENANT_ID,
      STATION_ID,
      EVSE_TYPE_ID,
      NEW_TXN_ID,
    );

    expect(deactivated).toHaveLength(2);

    const reloadedA = await Transaction.findOne({ where: { transactionId: 'txn-old-A' } });
    const reloadedB = await Transaction.findOne({ where: { transactionId: 'txn-old-B' } });
    expect(reloadedA?.isActive).toBe(false);
    expect(reloadedB?.isActive).toBe(false);
  });

  it('returns an empty array when there are no active transactions at the EVSE', async () => {
    await seedTenant();
    await seedStation(STATION_ID);
    const evse = await seedEvse(STATION_ID, EVSE_TYPE_ID);
    await seedTransaction(STATION_ID, OLD_TXN_ID, evse.id, false);

    const repo = makeRepo();
    const deactivated = await repo.deactivateActiveTransactionsByStationIdAndEvseId(
      DEFAULT_TENANT_ID,
      STATION_ID,
      EVSE_TYPE_ID,
      NEW_TXN_ID,
    );

    expect(deactivated).toHaveLength(0);
  });

  it('does NOT deactivate active transactions for a different station', async () => {
    await seedTenant();
    await seedStation(STATION_ID);
    await seedStation(OTHER_STATION_ID);
    await seedEvse(STATION_ID, EVSE_TYPE_ID);
    const otherEvse = await seedEvse(OTHER_STATION_ID, EVSE_TYPE_ID);
    await seedTransaction(OTHER_STATION_ID, OLD_TXN_ID, otherEvse.id, true);

    const repo = makeRepo();
    const deactivated = await repo.deactivateActiveTransactionsByStationIdAndEvseId(
      DEFAULT_TENANT_ID,
      STATION_ID,
      EVSE_TYPE_ID,
      NEW_TXN_ID,
    );

    expect(deactivated).toHaveLength(0);

    const reloaded = await Transaction.findOne({ where: { transactionId: OLD_TXN_ID } });
    expect(reloaded?.isActive).toBe(true);
  });
});
