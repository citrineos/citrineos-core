// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  ChargingStation,
  Connector,
  DefaultSequelizeInstance,
  DrizzleEvseRepository,
  Evse,
  EvseType,
  Tenant,
} from '@dal/index.js';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

/**
 * Two things here are not covered by construction and can fail silently:
 *
 *  - stationId is set by a `@BeforeCreate` hook on the Sequelize Evse model. Drizzle has
 *    no hooks, so the repository replicates it; miss it and rows persist with a null FK
 *    and no error at all.
 *  - commissionEvseForOcpp16Connector writes an EvseType and an Evse that must land
 *    together, and its return value has to satisfy the Connector FK constraints.
 */
const STATION = 'cs-evse-1';
const OTHER_TENANT_ID = DEFAULT_TENANT_ID + 1;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let drizzleInstance: NodePgDatabase;
let drizzlePool: pg.Pool;
let config: BootstrapConfig;
let stationId: number;

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
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

function aRepository(): DrizzleEvseRepository {
  return new DrizzleEvseRepository({ config, drizzleInstance });
}

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
  await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
  await Tenant.create({ id: OTHER_TENANT_ID, name: 'B' } as never);

  const station = await ChargingStation.create({
    ocppConnectionName: STATION,
    isOnline: true,
    tenantId: DEFAULT_TENANT_ID,
  } as never);
  stationId = (station as unknown as { id: number }).id;
});

describe('DrizzleEvseRepository.commissionEvseForOcpp16Connector', () => {
  it('creates the evse and evse type, and returns FK-valid ids', async () => {
    const { evseId, evseTypeConnectorId } = await aRepository().commissionEvseForOcpp16Connector(
      DEFAULT_TENANT_ID,
      STATION,
      1,
    );

    expect(evseId).toBeGreaterThan(0);
    expect(evseTypeConnectorId).toBeGreaterThan(0);

    // The real assertion: the ids satisfy whatever FK rules the live DB enforces.
    await expect(
      Connector.create({
        stationId,
        evseId,
        connectorId: 1,
        evseTypeConnectorId,
        ocppConnectionName: STATION,
        status: 'Available',
        errorCode: 'NoError',
        timestamp: new Date().toISOString(),
        tenantId: DEFAULT_TENANT_ID,
      } as never),
    ).resolves.toBeDefined();
  });

  it('resolves stationId from the connection name, replicating the Sequelize hook', async () => {
    const { evseId } = await aRepository().commissionEvseForOcpp16Connector(
      DEFAULT_TENANT_ID,
      STATION,
      1,
    );

    const evse = await Evse.findOne({ where: { id: evseId } });
    expect((evse as unknown as { stationId: number }).stationId).toBe(stationId);
  });

  it('is idempotent - commissioning the same connector twice reuses both rows', async () => {
    const repo = aRepository();
    const first = await repo.commissionEvseForOcpp16Connector(DEFAULT_TENANT_ID, STATION, 1);
    const second = await repo.commissionEvseForOcpp16Connector(DEFAULT_TENANT_ID, STATION, 1);

    expect(second).toEqual(first);
    await expect(Evse.count()).resolves.toBe(1);
    await expect(EvseType.count()).resolves.toBe(1);
  });

  it('commissions distinct pairs for distinct connectors', async () => {
    const repo = aRepository();
    const first = await repo.commissionEvseForOcpp16Connector(DEFAULT_TENANT_ID, STATION, 1);
    const second = await repo.commissionEvseForOcpp16Connector(DEFAULT_TENANT_ID, STATION, 2);

    expect(second.evseId).not.toBe(first.evseId);
    expect(second.evseTypeConnectorId).not.toBe(first.evseTypeConnectorId);
  });
});

describe('DrizzleEvseRepository.createOrUpdateEvse', () => {
  it('inserts and resolves stationId from the connection name', async () => {
    const saved = await aRepository().createOrUpdateEvse(DEFAULT_TENANT_ID, {
      ocppConnectionName: STATION,
      evseTypeId: 1,
      evseId: 'EVSE-1',
    } as never);

    expect(saved.id).toBeGreaterThan(0);
    // Without the hook replication this would silently be null.
    expect(saved.stationId).toBe(stationId);
  });

  it('updates in place rather than inserting a second row', async () => {
    const repo = aRepository();
    const first = await repo.createOrUpdateEvse(DEFAULT_TENANT_ID, {
      ocppConnectionName: STATION,
      evseTypeId: 1,
      evseId: 'EVSE-1',
    } as never);

    const second = await repo.createOrUpdateEvse(DEFAULT_TENANT_ID, {
      ocppConnectionName: STATION,
      evseTypeId: 1,
      evseId: 'EVSE-1-RENAMED',
      physicalReference: 'bay 4',
    } as never);

    expect(second.id).toBe(first.id);
    expect(second.evseId).toBe('EVSE-1-RENAMED');
    expect(second.physicalReference).toBe('bay 4');
    await expect(Evse.count()).resolves.toBe(1);
  });
});

describe('DrizzleEvseRepository.readEvseByStationIdAndOcpp201EvseId', () => {
  it('returns the evse with its connectors attached', async () => {
    const repo = aRepository();
    const { evseId, evseTypeConnectorId } = await repo.commissionEvseForOcpp16Connector(
      DEFAULT_TENANT_ID,
      STATION,
      1,
    );
    await Connector.create({
      stationId,
      evseId,
      connectorId: 1,
      evseTypeConnectorId,
      ocppConnectionName: STATION,
      status: 'Available',
      errorCode: 'NoError',
      timestamp: new Date().toISOString(),
      tenantId: DEFAULT_TENANT_ID,
    } as never);

    const found = await repo.readEvseByStationIdAndOcpp201EvseId(DEFAULT_TENANT_ID, STATION, 1);

    expect(found).toBeDefined();
    expect(found!.id).toBe(evseId);
    expect(found!.connectors?.map((c) => c.connectorId)).toEqual([1]);
  });

  it('returns an empty connector list when the evse has none', async () => {
    const repo = aRepository();
    await repo.commissionEvseForOcpp16Connector(DEFAULT_TENANT_ID, STATION, 1);

    const found = await repo.readEvseByStationIdAndOcpp201EvseId(DEFAULT_TENANT_ID, STATION, 1);

    expect(found!.connectors).toEqual([]);
  });

  it('does not read an evse belonging to another tenant', async () => {
    await aRepository().commissionEvseForOcpp16Connector(DEFAULT_TENANT_ID, STATION, 1);

    const found = await aRepository().readEvseByStationIdAndOcpp201EvseId(
      OTHER_TENANT_ID,
      STATION,
      1,
    );

    expect(found).toBeUndefined();
  });
});

// Exposes the protected members so the new base-class behaviour can be asserted directly.
class TransactionProbe extends DrizzleEvseRepository {
  runAtomic<T>(fn: (ctx: any) => Promise<T>): Promise<T> {
    return this.withAtomicWrite(fn);
  }

  insertRow(tenantId: number, values: object, ctx: any) {
    return this.insert(tenantId, values, ctx);
  }
}

describe('DrizzleRepository.withAtomicWrite', () => {
  function aProbe(): TransactionProbe {
    return new TransactionProbe({ config, drizzleInstance });
  }

  it('commits every statement when the callback resolves', async () => {
    const probe = aProbe();
    await probe.runAtomic(async (ctx) => {
      await probe.insertRow(DEFAULT_TENANT_ID, { ocppConnectionName: STATION, evseTypeId: 1 }, ctx);
      await probe.insertRow(DEFAULT_TENANT_ID, { ocppConnectionName: STATION, evseTypeId: 2 }, ctx);
    });

    await expect(Evse.count()).resolves.toBe(2);
  });

  it('rolls back every statement when the callback throws', async () => {
    const probe = aProbe();

    await expect(
      probe.runAtomic(async (ctx) => {
        await probe.insertRow(
          DEFAULT_TENANT_ID,
          { ocppConnectionName: STATION, evseTypeId: 1 },
          ctx,
        );
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    // The first insert must not survive the failure.
    await expect(Evse.count()).resolves.toBe(0);
  });

  it('emits buffered events only after the commit', async () => {
    const probe = aProbe();
    const created = vi.fn();
    probe.on('created', created);

    await probe.runAtomic(async (ctx) => {
      await probe.insertRow(DEFAULT_TENANT_ID, { ocppConnectionName: STATION, evseTypeId: 1 }, ctx);
      // Nothing has been committed yet, so no listener should have run.
      expect(created).not.toHaveBeenCalled();
    });

    expect(created).toHaveBeenCalledTimes(1);
  });

  it('emits nothing when the transaction rolls back', async () => {
    const probe = aProbe();
    const created = vi.fn();
    probe.on('created', created);

    await expect(
      probe.runAtomic(async (ctx) => {
        await probe.insertRow(
          DEFAULT_TENANT_ID,
          { ocppConnectionName: STATION, evseTypeId: 1 },
          ctx,
        );
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(created).not.toHaveBeenCalled();
  });
});
