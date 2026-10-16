// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  Authorization,
  ChargingStation,
  Evse,
  StopTransaction,
  Tariff,
  TransactionEvent,
} from '@dal/db/sequelize/index.js';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type {
  MeterValueDto,
  StartTransactionDto,
  StopTransactionDto,
  TransactionDto,
  TransactionEventDto,
} from '@citrineos/types';
import { EvseType, MeterValue, StartTransaction, Transaction } from '../../../index.js';
import { SequelizeLocationRepository } from '@dal/repositories/sequelize/location.js';
import {
  DrizzleMeterValueRepository,
  toMeterValueDto,
} from '@dal/repositories/drizzle/meter-value.js';
import {
  DrizzleStartTransactionRepository,
  toStartTransactionDto,
} from '@dal/repositories/drizzle/start-transaction.js';
import {
  DrizzleStopTransactionRepository,
  toStopTransactionDto,
} from '@dal/repositories/drizzle/stop-transaction.js';
import {
  DrizzleTransactionRepository,
  toTransactionDto,
} from '@dal/repositories/drizzle/transaction.js';
import {
  DrizzleTransactionEventRepository,
  toTransactionEventDto,
} from '@dal/repositories/drizzle/transaction-event.js';
import type { MeterValueEntity } from '@dal/db/drizzle/schema/meter-value.js';
import type { StartTransactionEntity } from '@dal/db/drizzle/schema/start-transaction.js';
import type { StopTransactionEntity } from '@dal/db/drizzle/schema/stop-transaction.js';
import type { TransactionEntity } from '@dal/db/drizzle/schema/transaction.js';
import type { TransactionEventEntity } from '@dal/db/drizzle/schema/transaction-event.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// The drizzle transaction-cluster repositories expose only the shared
// DrizzleRepository CRUD surface (domain methods are still stubs), so this suite
// covers that surface per repository over the real schema, plus the pure
// row-to-DTO mappers. The sequelize twins own schema creation and seed rows;
// their domain behavior is covered by their own suites.

const TENANT = 1;
const OTHER_TENANT = 2;
const STATION = 'CS-TX-1';

let h: PgHarness;
let drizzlePool: pg.Pool;
let db: NodePgDatabase;
let locationRepository: SequelizeLocationRepository;

beforeAll(async () => {
  h = await startPgHarness();
  // Own pool: the DefaultDrizzleInstance singleton exposes no way to close it.
  drizzlePool = new pg.Pool({
    host: h.config.database.host,
    port: h.config.database.port,
    database: h.config.database.database,
    user: h.config.database.username,
    password: h.config.database.password,
  });
  // Stopping the container terminates idle connections (Postgres 57P01). pg
  // escalates an unhandled pool 'error' to an uncaught exception, which fails
  // the run even when every test passed.
  drizzlePool.on('error', () => {});
  db = drizzle(drizzlePool);
  locationRepository = new SequelizeLocationRepository({
    config: h.config,
    sequelizeInstance: h.sequelizeInstance,
  });
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await h?.stop();
}, 90_000);

beforeEach(async () => {
  await resetDb(h);
});

// insert() is protected on DrizzleRepository; each subclass under test exposes a
// create() so the shared insert path (tenant stamp + created event) is reachable.
class TransactionRepo extends DrizzleTransactionRepository {
  create(tenantId: number, values: object): Promise<TransactionDto> {
    return this.insert(tenantId, values);
  }
}

class TransactionEventRepo extends DrizzleTransactionEventRepository {
  create(tenantId: number, values: object): Promise<TransactionEventDto> {
    return this.insert(tenantId, values);
  }
}

class MeterValueRepo extends DrizzleMeterValueRepository {
  create(tenantId: number, values: object): Promise<MeterValueDto> {
    return this.insert(tenantId, values);
  }
}

class StartTransactionRepo extends DrizzleStartTransactionRepository {
  create(tenantId: number, values: object): Promise<StartTransactionDto> {
    return this.insert(tenantId, values);
  }
}

class StopTransactionRepo extends DrizzleStopTransactionRepository {
  create(tenantId: number, values: object): Promise<StopTransactionDto> {
    return this.insert(tenantId, values);
  }
}

function transactionRepo(): TransactionRepo {
  return new TransactionRepo({ config: h.config, drizzleInstance: db });
}

function transactionEventRepo(): TransactionEventRepo {
  return new TransactionEventRepo({ config: h.config, drizzleInstance: db });
}

function meterValueRepo(): MeterValueRepo {
  return new MeterValueRepo({ config: h.config, drizzleInstance: db });
}

function startTransactionRepo(): StartTransactionRepo {
  return new StartTransactionRepo({ config: h.config, drizzleInstance: db });
}

function stopTransactionRepo(): StopTransactionRepo {
  return new StopTransactionRepo({ config: h.config, drizzleInstance: db });
}

async function aStation(
  tenantId: number,
  ocppConnectionName = STATION,
): Promise<{ id: number; connectorDatabaseId: number }> {
  const station = await ChargingStation.create({
    ocppConnectionName,
    isOnline: false,
    tenantId,
  } as any);
  const { evseId } = await locationRepository.autoCommissionEvseForOcpp16Connector(
    tenantId,
    ocppConnectionName,
  );
  const connector = await locationRepository.createOrUpdateOcpp16Connector(tenantId, {
    stationId: station.id,
    evseId,
    connectorId: 1,
    status: 'Available',
    timestamp: new Date().toISOString(),
  });
  return { id: station.id, connectorDatabaseId: connector!.id! };
}

async function aTransaction(
  tenantId: number,
  stationId: number,
  transactionId: string,
  overrides: Record<string, unknown> = {},
): Promise<Transaction> {
  const row = await Transaction.create({
    stationId,
    transactionId,
    isActive: true,
    tenantId,
    transactionCreatedAt: new Date(),
    ...overrides,
  } as any);
  return row;
}

async function anEvent(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<TransactionEvent> {
  const row = await TransactionEvent.create({
    ocppConnectionName: STATION,
    eventType: 'Started',
    timestamp: '2025-06-01T08:00:00.000Z',
    triggerReason: 'Authorized',
    seqNo: 0,
    tenantId,
    transactionCreatedAt: new Date(),
    ...overrides,
  } as any);
  return row;
}

describe('DrizzleTransactionRepository', () => {
  it('findById maps numeric, bigint and timestamp columns from a seeded row', async () => {
    const repo = transactionRepo();
    const station = await aStation(TENANT);
    const tx = await aTransaction(TENANT, station.id, 'tx-read-1', {
      chargingState: 'Charging',
      timeSpentCharging: 3600,
      transactionLimit: { maxEnergy: 50 },
      meterStart: 12.5,
      totalKwh: 3.75,
      totalCost: 1.25,
      remoteStartId: 77,
      startTime: '2025-06-01T08:00:00.000Z',
      endTime: '2025-06-01T09:00:00.000Z',
    });

    const dto = await repo.findById(TENANT, tx.id);

    expect(dto!.transactionId).toBe('tx-read-1');
    expect(dto!.stationId).toBe(station.id);
    expect(dto!.isActive).toBe(true);
    // DECIMAL columns arrive as strings from node-postgres and are numbers on the DTO.
    expect(dto!.meterStart).toBe(12.5);
    expect(dto!.totalKwh).toBe(3.75);
    expect(dto!.totalCost).toBe(1.25);
    expect(dto!.timeSpentCharging).toBe(3600);
    expect(dto!.transactionLimit).toEqual({ maxEnergy: 50 });
    expect(dto!.startTime).toBe('2025-06-01T08:00:00.000Z');
    expect(dto!.endTime).toBe('2025-06-01T09:00:00.000Z');
    expect(dto!.remoteStartId).toBe(77);
    expect(dto!.tenantId).toBe(TENANT);
    expect(await repo.findById(OTHER_TENANT, tx.id)).toBeUndefined();
  });

  it('findAll, countAll and exists stay inside the calling tenant', async () => {
    const repo = transactionRepo();
    const stationA = await aStation(TENANT);
    const stationB = await aStation(OTHER_TENANT);
    await aTransaction(TENANT, stationA.id, 'tx-a1');
    await aTransaction(TENANT, stationA.id, 'tx-a2');
    const foreign = await aTransaction(OTHER_TENANT, stationB.id, 'tx-b1');

    const own = await repo.findAll(TENANT);
    expect(own.map((t) => t.transactionId).sort()).toEqual(['tx-a1', 'tx-a2']);
    expect(await repo.countAll(TENANT)).toBe(2);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
    expect(await repo.exists(TENANT, foreign.id)).toBe(false);
    expect(await repo.exists(OTHER_TENANT, foreign.id)).toBe(true);
  });

  it('insert stamps the calling tenant over the payload value and emits created', async () => {
    const repo = transactionRepo();
    const station = await aStation(TENANT);
    const created: TransactionDto[][] = [];
    repo.on('created', (dtos: TransactionDto[]) => created.push(dtos));

    const dto = await repo.create(TENANT, {
      stationId: station.id,
      ocppConnectionName: STATION,
      transactionId: 'tx-ins-1',
      isActive: true,
      meterStart: '5.5',
      startTime: new Date('2025-06-02T10:00:00.000Z'),
      tenantId: 42, // overwritten by the repository
    });

    expect(dto.id).toBeDefined();
    expect(dto.tenantId).toBe(TENANT);
    expect(dto.meterStart).toBe(5.5);
    expect(dto.startTime).toBe('2025-06-02T10:00:00.000Z');
    expect(created).toEqual([[dto]]);

    const row = await Transaction.findByPk(dto.id!);
    expect(row!.transactionId).toBe('tx-ins-1');
    expect(row!.tenantId).toBe(TENANT);
  });

  it('updateById writes fields, emits updated and skips other tenants', async () => {
    const repo = transactionRepo();
    const station = await aStation(TENANT);
    const tx = await aTransaction(TENANT, station.id, 'tx-upd-1');
    const updatedEvents: TransactionDto[][] = [];
    repo.on('updated', (dtos: TransactionDto[]) => updatedEvents.push(dtos));

    expect(await repo.updateById(OTHER_TENANT, tx.id, { isActive: false })).toBeUndefined();
    expect(updatedEvents).toHaveLength(0);

    const dto = await repo.updateById(TENANT, tx.id, {
      isActive: false,
      stoppedReason: 'Remote',
      totalKwh: '9.75',
      endTime: new Date('2025-06-01T09:30:00.000Z'),
    });

    expect(dto!.isActive).toBe(false);
    expect(dto!.stoppedReason).toBe('Remote');
    expect(dto!.totalKwh).toBe(9.75);
    expect(dto!.endTime).toBe('2025-06-01T09:30:00.000Z');
    expect(updatedEvents).toEqual([[dto]]);

    const row = await Transaction.findByPk(tx.id);
    expect(row!.isActive).toBe(false);
  });

  it('deleteById removes only the calling tenant row and emits deleted', async () => {
    const repo = transactionRepo();
    const stationA = await aStation(TENANT);
    const stationB = await aStation(OTHER_TENANT);
    const own = await aTransaction(TENANT, stationA.id, 'tx-del-1');
    await aTransaction(OTHER_TENANT, stationB.id, 'tx-del-2');
    const deletedEvents: TransactionDto[][] = [];
    repo.on('deleted', (dtos: TransactionDto[]) => deletedEvents.push(dtos));

    expect(await repo.deleteById(OTHER_TENANT, own.id)).toBeUndefined();
    expect(await Transaction.count()).toBe(2);
    expect(deletedEvents).toHaveLength(0);

    const dto = await repo.deleteById(TENANT, own.id);
    expect(dto!.transactionId).toBe('tx-del-1');
    expect(await Transaction.count()).toBe(1);
    expect(deletedEvents).toEqual([[dto]]);
    expect(await repo.deleteById(TENANT, own.id)).toBeUndefined();
  });

  it('accepts a second insert with the same stationId and transactionId', async () => {
    const repo = transactionRepo();
    const station = await aStation(TENANT);
    const values = {
      stationId: station.id,
      ocppConnectionName: STATION,
      transactionId: 'tx-dup',
      isActive: true,
    };
    const first = await repo.create(TENANT, values);

    // The (stationId, transactionId) unique index was dropped when Transactions
    // moved to a (id, createdAt) key for partitioning: a partitioned table's
    // unique index has to carry the partition key.
    const second = await repo.create(TENANT, values);

    expect(second.id).not.toBe(first.id);
    expect(second.transactionId).toBe('tx-dup');
    expect(await Transaction.count()).toBe(2);
  });
});

describe('DrizzleTransactionEventRepository', () => {
  it('findById converts cableMaxCurrent to number and timestamp to ISO', async () => {
    const repo = transactionEventRepo();
    const station = await aStation(TENANT);
    const tx = await aTransaction(TENANT, station.id, 'tx-ev-1');
    const event = await anEvent(TENANT, {
      cableMaxCurrent: 32.5,
      numberOfPhasesUsed: 3,
      transactionDatabaseId: tx.id,
      transactionInfo: { transactionId: 'tx-ev-1', chargingState: 'Charging' },
      idTokenValue: 'TOKEN-1',
      idTokenType: 'ISO14443',
    });

    const dto = await repo.findById(TENANT, event.id);

    expect(dto!.eventType).toBe('Started');
    expect(dto!.triggerReason).toBe('Authorized');
    expect(dto!.seqNo).toBe(0);
    // Column default, not set by the seed.
    expect(dto!.offline).toBe(false);
    expect(dto!.cableMaxCurrent).toBe(32.5);
    expect(dto!.numberOfPhasesUsed).toBe(3);
    expect(dto!.timestamp).toBe('2025-06-01T08:00:00.000Z');
    expect(dto!.transactionDatabaseId).toBe(tx.id);
    expect(dto!.transactionInfo).toEqual({ transactionId: 'tx-ev-1', chargingState: 'Charging' });
    expect(dto!.idTokenValue).toBe('TOKEN-1');
    expect(dto!.idTokenType).toBe('ISO14443');
    expect(await repo.findById(OTHER_TENANT, event.id)).toBeUndefined();
  });

  it('updateById bumps seqNo for the owning tenant only', async () => {
    const repo = transactionEventRepo();
    const event = await anEvent(TENANT);

    expect(await repo.updateById(OTHER_TENANT, event.id, { seqNo: 5 })).toBeUndefined();

    const dto = await repo.updateById(TENANT, event.id, { seqNo: 5, offline: true });
    expect(dto!.seqNo).toBe(5);
    expect(dto!.offline).toBe(true);

    const row = await TransactionEvent.findByPk(event.id);
    expect(row!.seqNo).toBe(5);
  });

  it('insert under a nonexistent tenant violates the tenant FK', async () => {
    const repo = transactionEventRepo();

    await expect(
      repo.create(999, {
        ocppConnectionName: STATION,
        eventType: 'Started',
        timestamp: new Date('2025-06-01T08:00:00.000Z'),
        triggerReason: 'Authorized',
        seqNo: 0,
      }),
    ).rejects.toThrow(/Failed query: insert into "TransactionEvents"/);
    expect(await TransactionEvent.count()).toBe(0);
  });
});

describe('DrizzleMeterValueRepository', () => {
  it('insert and findById round-trip the sampledValue jsonb', async () => {
    const repo = meterValueRepo();
    const createdEvents: MeterValueDto[][] = [];
    repo.on('created', (dtos: MeterValueDto[]) => createdEvents.push(dtos));

    const sample = [
      { value: 42.7, measurand: 'Energy.Active.Import.Register', context: 'Sample.Periodic' },
    ];
    const dto = await repo.create(TENANT, {
      sampledValue: sample,
      timestamp: new Date('2025-06-01T08:05:00.000Z'),
      transactionId: 'tx-mv-1',
    });

    expect(dto.id).toBeDefined();
    expect(dto.sampledValue).toEqual(sample);
    expect(dto.timestamp).toBe('2025-06-01T08:05:00.000Z');
    expect(dto.transactionId).toBe('tx-mv-1');
    expect(dto.transactionEventId).toBeNull();
    expect(dto.transactionDatabaseId).toBeNull();
    expect(dto.connectorId).toBeUndefined();
    expect(dto.tenantId).toBe(TENANT);
    expect(createdEvents).toEqual([[dto]]);

    const read = await repo.findById(TENANT, dto.id!);
    expect(read!.sampledValue).toEqual(sample);
  });

  it('deleteById is tenant-scoped and emits deleted', async () => {
    const repo = meterValueRepo();
    const row = await MeterValue.create({
      sampledValue: [{ value: 1 }],
      timestamp: '2025-06-01T08:00:00.000Z',
      tenantId: TENANT,
    } as any);
    const id = row.id;
    const deletedEvents: MeterValueDto[][] = [];
    repo.on('deleted', (dtos: MeterValueDto[]) => deletedEvents.push(dtos));

    expect(await repo.deleteById(OTHER_TENANT, id)).toBeUndefined();
    expect(await MeterValue.count()).toBe(1);

    const dto = await repo.deleteById(TENANT, id);
    expect(dto!.sampledValue).toEqual([{ value: 1 }]);
    expect(await MeterValue.count()).toBe(0);
    expect(deletedEvents).toEqual([[dto]]);
  });

  it('insert pointing at a missing transaction rejects on the FK', async () => {
    const repo = meterValueRepo();

    await expect(
      repo.create(TENANT, {
        sampledValue: [{ value: 1 }],
        timestamp: new Date('2025-06-01T08:00:00.000Z'),
        transactionDatabaseId: 424242,
      }),
    ).rejects.toThrow(/Failed query: insert into "MeterValues"/);
    expect(await MeterValue.count()).toBe(0);
  });
});

describe('DrizzleStartTransactionRepository', () => {
  it('insert against a real transaction reads back mapped', async () => {
    const repo = startTransactionRepo();
    const station = await aStation(TENANT);
    const tx = await aTransaction(TENANT, station.id, 'tx-st-1');

    const dto = await repo.create(TENANT, {
      ocppConnectionName: STATION,
      meterStart: 100,
      timestamp: new Date('2025-06-01T08:00:00.000Z'),
      transactionDatabaseId: tx.id,
      connectorDatabaseId: station.connectorDatabaseId,
    });

    expect(dto.meterStart).toBe(100);
    expect(dto.timestamp).toBe('2025-06-01T08:00:00.000Z');
    expect(dto.transactionDatabaseId).toBe(tx.id);
    expect(dto.reservationId).toBeNull();
    expect(dto.connectorDatabaseId).toBe(station.connectorDatabaseId);
    // Partition key column, filled by the schema default when the payload omits it.
    expect(dto.transactionCreatedAt).toBeInstanceOf(Date);
    expect(dto.tenantId).toBe(TENANT);

    const read = await repo.findById(TENANT, dto.id!);
    expect(read!.meterStart).toBe(100);
    expect(await repo.findById(OTHER_TENANT, dto.id!)).toBeUndefined();
    expect(await StartTransaction.count()).toBe(1);
  });

  it('rejects a second start row for the same transaction and partition key', async () => {
    const repo = startTransactionRepo();
    const station = await aStation(TENANT);
    const tx = await aTransaction(TENANT, station.id, 'tx-st-dup');
    // Unique is (transactionDatabaseId, transactionCreatedAt); the column defaults
    // to now() per insert, so the key is pinned to make the second row repeat it.
    const values = {
      ocppConnectionName: STATION,
      meterStart: 100,
      connectorDatabaseId: station.connectorDatabaseId,
      timestamp: new Date('2025-06-01T08:00:00.000Z'),
      transactionDatabaseId: tx.id,
      transactionCreatedAt: new Date('2025-06-01T07:59:00.000Z'),
    };
    await repo.create(TENANT, values);

    await expect(repo.create(TENANT, values)).rejects.toThrow(
      /Failed query: insert into "StartTransactions"/,
    );
    expect(await StartTransaction.count()).toBe(1);
  });
});

describe('DrizzleStopTransactionRepository', () => {
  it('insert and updateById keep idToken and reason fields', async () => {
    const repo = stopTransactionRepo();
    const station = await aStation(TENANT);
    const tx = await aTransaction(TENANT, station.id, 'tx-sp-1');

    const dto = await repo.create(TENANT, {
      ocppConnectionName: STATION,
      transactionDatabaseId: tx.id,
      meterStop: 4500,
      timestamp: new Date('2025-06-01T09:00:00.000Z'),
      reason: 'Local',
      idTokenValue: 'TOKEN-9',
      idTokenType: 'ISO14443',
      connectorDatabaseId: station.connectorDatabaseId,
    });

    expect(dto.meterStop).toBe(4500);
    expect(dto.reason).toBe('Local');
    expect(dto.idTokenValue).toBe('TOKEN-9');
    expect(dto.idTokenType).toBe('ISO14443');
    expect(dto.timestamp).toBe('2025-06-01T09:00:00.000Z');
    expect(dto.tenantId).toBe(TENANT);

    expect(await repo.updateById(OTHER_TENANT, dto.id!, { reason: 'Remote' })).toBeUndefined();

    const updated = await repo.updateById(TENANT, dto.id!, { reason: 'Remote', meterStop: 4600 });
    expect(updated!.reason).toBe('Remote');
    expect(updated!.meterStop).toBe(4600);

    const row = await StopTransaction.findByPk(dto.id!);
    expect(row!.reason).toBe('Remote');
  });

  it('rejects a duplicate stop row for the same transaction and partition key', async () => {
    const repo = stopTransactionRepo();
    const station = await aStation(TENANT);
    const tx = await aTransaction(TENANT, station.id, 'tx-sp-dup');
    // Unique is (transactionDatabaseId, transactionCreatedAt); the column defaults
    // to now() per insert, so the key is pinned to make the second row repeat it.
    const values = {
      ocppConnectionName: STATION,
      transactionDatabaseId: tx.id,
      meterStop: 4500,
      timestamp: new Date('2025-06-01T09:00:00.000Z'),
      transactionCreatedAt: new Date('2025-06-01T08:59:00.000Z'),
      connectorDatabaseId: station.connectorDatabaseId,
    };
    await repo.create(TENANT, values);

    await expect(repo.create(TENANT, values)).rejects.toThrow(
      /Failed query: insert into "StopTransactions"/,
    );
    expect(await StopTransaction.count()).toBe(1);
  });
});

describe('drizzle row-to-DTO mappers', () => {
  const timestamps = {
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  };
  // Partition key shared by the four child tables of Transactions.
  const partitionKey = new Date('2025-06-01T08:00:00.000Z');

  it('toTransactionDto converts numeric strings and dates, keeps jsonb', () => {
    const dto = toTransactionDto({
      id: 1,
      locationId: 7,
      stationId: 3,
      ocppConnectionName: STATION,
      evseId: 2,
      connectorId: 4,
      authorizationId: 5,
      tariffId: 6,
      transactionId: 'tx-map-1',
      isActive: true,
      chargingState: 'Charging',
      timeSpentCharging: 3600,
      transactionLimit: { maxEnergy: 50 },
      meterStart: '10.5',
      totalKwh: '7.25',
      stoppedReason: 'Local',
      remoteStartId: 99,
      totalCost: '3.10',
      startTime: new Date('2025-06-01T08:00:00.000Z'),
      endTime: new Date('2025-06-01T09:00:00.000Z'),
      customData: { vendorId: 'v1' },
      tenantId: TENANT,
      ...timestamps,
    } as TransactionEntity);

    expect(dto.meterStart).toBe(10.5);
    expect(dto.totalKwh).toBe(7.25);
    expect(dto.totalCost).toBe(3.1);
    expect(dto.timeSpentCharging).toBe(3600);
    expect(dto.startTime).toBe('2025-06-01T08:00:00.000Z');
    expect(dto.endTime).toBe('2025-06-01T09:00:00.000Z');
    expect(dto.transactionLimit).toEqual({ maxEnergy: 50 });
    expect(dto.customData).toEqual({ vendorId: 'v1' });
    expect(dto.locationId).toBe(7);
    expect(dto.chargingState).toBe('Charging');
    expect(dto.createdAt).toEqual(timestamps.createdAt);
  });

  it('toTransactionDto maps null FKs to undefined and null value columns to null', () => {
    const dto = toTransactionDto({
      id: 2,
      locationId: null,
      stationId: 3,
      ocppConnectionName: STATION,
      evseId: null,
      connectorId: null,
      authorizationId: null,
      tariffId: null,
      transactionId: 'tx-map-2',
      isActive: false,
      chargingState: null,
      timeSpentCharging: null,
      transactionLimit: null,
      meterStart: null,
      totalKwh: null,
      stoppedReason: null,
      remoteStartId: null,
      totalCost: null,
      startTime: null,
      endTime: null,
      customData: null,
      tenantId: TENANT,
      ...timestamps,
    } as TransactionEntity);

    expect(dto.locationId).toBeUndefined();
    expect(dto.evseId).toBeUndefined();
    expect(dto.connectorId).toBeUndefined();
    expect(dto.authorizationId).toBeUndefined();
    expect(dto.tariffId).toBeUndefined();
    expect(dto.chargingState).toBeNull();
    expect(dto.timeSpentCharging).toBeNull();
    expect(dto.meterStart).toBeNull();
    expect(dto.totalKwh).toBeNull();
    // totalCost is optional (not nullable) on the DTO, so null becomes undefined.
    expect(dto.totalCost).toBeUndefined();
    expect(dto.startTime).toBeUndefined();
    expect(dto.endTime).toBeUndefined();
    expect(dto.stoppedReason).toBeNull();
    expect(dto.remoteStartId).toBeNull();
  });

  it('toTransactionEventDto converts the decimal column and leaves relations unset', () => {
    const dto = toTransactionEventDto({
      id: 3,
      ocppConnectionName: STATION,
      eventType: 'Updated',
      timestamp: new Date('2025-06-01T08:10:00.000Z'),
      triggerReason: 'MeterValuePeriodic',
      seqNo: 4,
      offline: null,
      numberOfPhasesUsed: null,
      cableMaxCurrent: '16.25',
      reservationId: 12,
      transactionCreatedAt: partitionKey,
      transactionDatabaseId: null,
      transactionInfo: null,
      evseId: null,
      idTokenValue: null,
      idTokenType: null,
      tenantId: TENANT,
      ...timestamps,
    } as TransactionEventEntity);

    expect(dto.eventType).toBe('Updated');
    expect(dto.timestamp).toBe('2025-06-01T08:10:00.000Z');
    expect(dto.cableMaxCurrent).toBe(16.25);
    expect(dto.offline).toBeNull();
    expect(dto.reservationId).toBe(12);
    expect(dto.transactionDatabaseId).toBeUndefined();
    expect(dto.transactionCreatedAt).toEqual(partitionKey);
    expect(dto.transactionInfo).toBeUndefined();
    expect(dto.evseId).toBeNull();
    expect(dto.idTokenValue).toBeNull();
    expect(dto.meterValue).toBeUndefined();
    expect(dto.evse).toBeUndefined();
    expect(dto.tenantId).toBe(TENANT);
  });

  it('toMeterValueDto keeps sampledValue and drops stopTransactionDatabaseId', () => {
    const sample = [{ value: 42 }];
    const dto = toMeterValueDto({
      id: 4,
      transactionEventId: null,
      transactionDatabaseId: 9,
      transactionCreatedAt: partitionKey,
      stopTransactionDatabaseId: 5,
      sampledValue: sample,
      timestamp: new Date('2025-06-01T08:05:00.000Z'),
      connectorId: null,
      tariffId: 3,
      transactionId: 'tx-map-mv',
      tenantId: TENANT,
      ...timestamps,
    } as MeterValueEntity);

    expect(dto.sampledValue).toEqual(sample);
    expect(dto.timestamp).toBe('2025-06-01T08:05:00.000Z');
    expect(dto.transactionEventId).toBeNull();
    expect(dto.transactionDatabaseId).toBe(9);
    expect(dto.transactionCreatedAt).toEqual(partitionKey);
    // connectorId is optional (not nullable) on the DTO, so null becomes undefined.
    expect(dto.connectorId).toBeUndefined();
    expect(dto.tariffId).toBe(3);
    expect('stopTransactionDatabaseId' in dto).toBe(false);
  });

  it('toStartTransactionDto maps scalars and keeps a null reservationId', () => {
    const dto = toStartTransactionDto({
      id: 5,
      ocppConnectionName: STATION,
      meterStart: 250,
      timestamp: new Date('2025-06-01T08:00:00.000Z'),
      reservationId: null,
      transactionDatabaseId: 9,
      transactionCreatedAt: partitionKey,
      connectorDatabaseId: 11,
      tenantId: TENANT,
      ...timestamps,
    } as StartTransactionEntity);

    expect(dto.meterStart).toBe(250);
    expect(dto.timestamp).toBe('2025-06-01T08:00:00.000Z');
    expect(dto.reservationId).toBeNull();
    expect(dto.transactionDatabaseId).toBe(9);
    expect(dto.transactionCreatedAt).toEqual(partitionKey);
    expect(dto.connectorDatabaseId).toBe(11);
    expect(dto.connector).toBeUndefined();
    expect(dto.tenantId).toBe(TENANT);
  });

  it('toStopTransactionDto maps null reason and idToken columns to undefined', () => {
    const dto = toStopTransactionDto({
      id: 6,
      ocppConnectionName: STATION,
      transactionDatabaseId: 9,
      transactionCreatedAt: partitionKey,
      meterStop: 4800,
      timestamp: new Date('2025-06-01T09:00:00.000Z'),
      reason: null,
      idTokenValue: null,
      idTokenType: null,
      tenantId: TENANT,
      ...timestamps,
    } as StopTransactionEntity);

    expect(dto.meterStop).toBe(4800);
    expect(dto.timestamp).toBe('2025-06-01T09:00:00.000Z');
    expect(dto.reason).toBeUndefined();
    expect(dto.idTokenValue).toBeUndefined();
    expect(dto.idTokenType).toBeUndefined();
    expect(dto.meterValues).toBeUndefined();
    expect(dto.transactionDatabaseId).toBe(9);
    expect(dto.transactionCreatedAt).toEqual(partitionKey);
  });
});

describe('DrizzleTransactionRepository cluster reads', () => {
  // Evses.evseTypeId is the EVSE as OCPP numbers it; Evses.id is the primary key the
  // transaction stores. Seeding them apart is what makes a lookup on the wrong one fail.
  async function anEvse(tenantId: number, stationId: number, evseTypeId: number): Promise<number> {
    const row: any = await Evse.create({ stationId, evseTypeId, tenantId } as any);
    return row.id as number;
  }

  async function anEvseType(tenantId: number, ocppEvseId: number): Promise<number> {
    const row: any = await EvseType.create({ id: ocppEvseId, tenantId } as any);
    return row.databaseId as number;
  }

  async function aTariff(tenantId: number): Promise<number> {
    const row: any = await Tariff.create({
      currency: 'EUR',
      pricePerKwh: 0.35,
      tenantId,
    } as any);
    return row.id as number;
  }

  let idTokenSeq = 0;
  async function anAuthorization(tenantId: number, tariffId: number | null): Promise<number> {
    idTokenSeq += 1;
    const row: any = await Authorization.create({
      idToken: `TOKEN-${idTokenSeq}`,
      idTokenType: 'Central',
      status: 'Accepted',
      tariffId,
      tenantId,
    } as any);
    return row.id as number;
  }

  it('readTransactionByStationIdAndTransactionId scopes to the station and the tenant', async () => {
    const own = await aStation(TENANT);
    const other = await aStation(OTHER_TENANT, 'CS-TX-OTHER');
    await aTransaction(TENANT, own.id, 'T-1');
    await aTransaction(OTHER_TENANT, other.id, 'T-1');

    const found = await transactionRepo().readTransactionByStationIdAndTransactionId(
      TENANT,
      STATION,
      'T-1',
    );

    expect(found?.transactionId).toBe('T-1');
    expect(found?.tenantId).toBe(TENANT);
  });

  it('readTransactionByStationIdAndTransactionId returns undefined for an unknown station', async () => {
    await expect(
      transactionRepo().readTransactionByStationIdAndTransactionId(
        TENANT,
        'CS-DOES-NOT-EXIST',
        'T-1',
      ),
    ).resolves.toBeUndefined();
  });

  // Mirrors CrudRepository.readOnlyOneByQuery: the sequelize twin throws here rather
  // than silently returning the first of several.
  it('readTransactionByStationIdAndTransactionId throws when the station has duplicates', async () => {
    const station = await aStation(TENANT);
    await aTransaction(TENANT, station.id, 'T-DUP');
    await aTransaction(TENANT, station.id, 'T-DUP');

    await expect(
      transactionRepo().readTransactionByStationIdAndTransactionId(TENANT, STATION, 'T-DUP'),
    ).rejects.toThrow(/More than one value found/);
  });

  it('readAllActiveTransactionsByAuthorizationId returns only active rows for that authorization', async () => {
    const station = await aStation(TENANT);
    const authorizationId = await anAuthorization(TENANT, null);
    const otherAuthorizationId = await anAuthorization(TENANT, null);
    await aTransaction(TENANT, station.id, 'T-ACTIVE', { authorizationId });
    await aTransaction(TENANT, station.id, 'T-ENDED', { authorizationId, isActive: false });
    await aTransaction(TENANT, station.id, 'T-OTHER-AUTH', {
      authorizationId: otherAuthorizationId,
    });

    const rows = await transactionRepo().readAllActiveTransactionsByAuthorizationId(
      TENANT,
      authorizationId,
    );

    expect(rows.map((row) => row.transactionId)).toEqual(['T-ACTIVE']);
  });

  it('getActiveTransactionByStationIdAndEvseId matches the OCPP evse id, not the Evses primary key', async () => {
    const station = await aStation(TENANT);
    // Two EVSEs whose primary keys and OCPP numbers deliberately disagree.
    const evseA = await anEvse(TENANT, station.id, 11);
    const evseB = await anEvse(TENANT, station.id, 22);
    await aTransaction(TENANT, station.id, 'T-ON-A', { evseId: evseA });
    await aTransaction(TENANT, station.id, 'T-ON-B', { evseId: evseB });

    const onB = await transactionRepo().getActiveTransactionByStationIdAndEvseId(
      TENANT,
      STATION,
      22,
    );
    const onA = await transactionRepo().getActiveTransactionByStationIdAndEvseId(
      TENANT,
      STATION,
      11,
    );

    // Asserted both ways round: matching on the primary key would still satisfy one of them.
    expect(onB?.transactionId).toBe('T-ON-B');
    expect(onA?.transactionId).toBe('T-ON-A');
  });

  it('getActiveTransactionByStationIdAndEvseId ignores ended transactions', async () => {
    const station = await aStation(TENANT);
    const evse = await anEvse(TENANT, station.id, 11);
    await aTransaction(TENANT, station.id, 'T-ENDED', { evseId: evse, isActive: false });

    await expect(
      transactionRepo().getActiveTransactionByStationIdAndEvseId(TENANT, STATION, 11),
    ).resolves.toBeUndefined();
  });

  it('getActiveTransactionByStationIdAndEvseId takes the most recently updated of several', async () => {
    const station = await aStation(TENANT);
    const evse = await anEvse(TENANT, station.id, 11);
    const older = await aTransaction(TENANT, station.id, 'T-OLD', { evseId: evse });
    const newer = await aTransaction(TENANT, station.id, 'T-NEW', { evseId: evse });
    await older.update({ updatedAt: new Date('2025-01-01T00:00:00.000Z') }, { silent: true });
    await newer.update({ updatedAt: new Date('2026-01-01T00:00:00.000Z') }, { silent: true });

    const found = await transactionRepo().getActiveTransactionByStationIdAndEvseId(
      TENANT,
      STATION,
      11,
    );

    expect(found?.transactionId).toBe('T-NEW');
  });

  it('readActiveTransactionsWithTariffAndEvseByStationId takes the tariff from the authorization', async () => {
    const station = await aStation(TENANT);
    const evse = await anEvse(TENANT, station.id, 11);
    const tariffId = await aTariff(TENANT);
    const withTariff = await anAuthorization(TENANT, tariffId);
    const withoutTariff = await anAuthorization(TENANT, null);
    await aTransaction(TENANT, station.id, 'T-PRICED', {
      evseId: evse,
      authorizationId: withTariff,
    });
    await aTransaction(TENANT, station.id, 'T-UNPRICED', {
      evseId: evse,
      authorizationId: withoutTariff,
    });
    await aTransaction(TENANT, station.id, 'T-NO-AUTH', { evseId: evse });

    const rows = await transactionRepo().readActiveTransactionsWithTariffAndEvseByStationId(
      TENANT,
      STATION,
    );

    expect(rows.map((row) => row.transactionId)).toEqual(['T-PRICED']);
    expect(rows[0].authorization?.tariff?.id).toBe(tariffId);
    expect(rows[0].evse?.evseTypeId).toBe(11);
  });

  it('readActiveTransactionsWithTariffAndEvseByStationId narrows to one evse when asked', async () => {
    const station = await aStation(TENANT);
    const evseA = await anEvse(TENANT, station.id, 11);
    const evseB = await anEvse(TENANT, station.id, 22);
    const tariffId = await aTariff(TENANT);
    const authorizationId = await anAuthorization(TENANT, tariffId);
    await aTransaction(TENANT, station.id, 'T-ON-A', { evseId: evseA, authorizationId });
    await aTransaction(TENANT, station.id, 'T-ON-B', { evseId: evseB, authorizationId });

    const rows = await transactionRepo().readActiveTransactionsWithTariffAndEvseByStationId(
      TENANT,
      STATION,
      22,
    );

    expect(rows.map((row) => row.transactionId)).toEqual(['T-ON-B']);
  });

  it('findByTransactionId finds the row without a station and hydrates its children', async () => {
    const station = await aStation(TENANT);
    const transaction = await aTransaction(TENANT, station.id, 'T-GRAPH');
    const event = await anEvent(TENANT, { transactionDatabaseId: transaction.id });
    await MeterValue.create({
      transactionEventId: event.id,
      transactionDatabaseId: transaction.id,
      sampledValue: [{ value: 7 }],
      timestamp: new Date('2025-06-01T08:05:00.000Z'),
      tenantId: TENANT,
    } as any);

    const found = await transactionRepo().findByTransactionId(TENANT, 'T-GRAPH');

    expect(found?.transactionId).toBe('T-GRAPH');
    expect(found?.transactionEvents).toHaveLength(1);
    expect(found?.meterValues).toHaveLength(1);
  });

  it('readAllByStationIdAndTransactionId returns that transaction events only', async () => {
    const station = await aStation(TENANT);
    const wanted = await aTransaction(TENANT, station.id, 'T-WANTED');
    const other = await aTransaction(TENANT, station.id, 'T-OTHER');
    await anEvent(TENANT, { transactionDatabaseId: wanted.id, seqNo: 1 });
    await anEvent(TENANT, { transactionDatabaseId: other.id, seqNo: 2 });

    const events = await transactionRepo().readAllByStationIdAndTransactionId(
      TENANT,
      STATION,
      'T-WANTED',
    );

    expect(events.map((event) => event.seqNo)).toEqual([1]);
  });

  // TransactionEvents.evseId is a foreign key to EvseTypes.databaseId, while
  // EvseTypes.id holds the OCPP evse number. Seeding them apart catches a lookup
  // that reads the row back by the wrong column.
  it('readAllByStationIdAndTransactionId hydrates the evse type by its surrogate key', async () => {
    const station = await aStation(TENANT);
    const transaction = await aTransaction(TENANT, station.id, 'T-EVSE');
    await anEvseType(TENANT, 91);
    const wantedDatabaseId = await anEvseType(TENANT, 92);
    const event = await anEvent(TENANT, {
      transactionDatabaseId: transaction.id,
      evseId: wantedDatabaseId,
    });
    await MeterValue.create({
      transactionEventId: event.id,
      transactionDatabaseId: transaction.id,
      sampledValue: [{ value: 3 }],
      timestamp: new Date('2025-06-01T08:05:00.000Z'),
      tenantId: TENANT,
    } as any);

    const events = await transactionRepo().readAllByStationIdAndTransactionId(
      TENANT,
      STATION,
      'T-EVSE',
    );

    expect(events).toHaveLength(1);
    expect(events[0].evse?.id).toBe(92);
    expect(events[0].meterValue).toHaveLength(1);
  });
});

describe('DrizzleTransactionRepository cluster writes', () => {
  async function anEvse(tenantId: number, stationId: number, evseTypeId: number): Promise<number> {
    const row: any = await Evse.create({ stationId, evseTypeId, tenantId } as any);
    return row.id as number;
  }

  const aReading = (value: number): MeterValueDto =>
    ({
      timestamp: '2025-06-01T08:05:00.000Z',
      sampledValue: [{ value }],
    }) as unknown as MeterValueDto;

  it('updateTransactionTotalCostById writes the cost for that tenant only', async () => {
    const own = await aStation(TENANT);
    const other = await aStation(OTHER_TENANT, 'CS-TX-OTHER');
    const mine = await aTransaction(TENANT, own.id, 'T-COST');
    const theirs = await aTransaction(OTHER_TENANT, other.id, 'T-COST');

    await transactionRepo().updateTransactionTotalCostById(TENANT, 12.5, mine.id);

    await mine.reload();
    await theirs.reload();
    expect(Number(mine.totalCost)).toBe(12.5);
    expect(theirs.totalCost).toBeNull();
  });

  it('updateTransactionTotalCostById does not reach another tenant row by id', async () => {
    const other = await aStation(OTHER_TENANT, 'CS-TX-OTHER');
    const theirs = await aTransaction(OTHER_TENANT, other.id, 'T-COST');

    await transactionRepo().updateTransactionTotalCostById(TENANT, 9, theirs.id);

    await theirs.reload();
    expect(theirs.totalCost).toBeNull();
  });

  it('updateTransactionByStationIdAndTransactionId updates and returns the matching row', async () => {
    const station = await aStation(TENANT);
    const transaction = await aTransaction(TENANT, station.id, 'T-UPD');

    const updated = await transactionRepo().updateTransactionByStationIdAndTransactionId(
      TENANT,
      { isActive: false, stoppedReason: 'Local', totalKwh: 4.25 },
      'T-UPD',
      STATION,
    );

    await transaction.reload();
    expect(updated?.transactionId).toBe('T-UPD');
    expect(transaction.isActive).toBe(false);
    expect(transaction.stoppedReason).toBe('Local');
    expect(Number(transaction.totalKwh)).toBe(4.25);
  });

  it('updateTransactionByStationIdAndTransactionId returns undefined for an unknown station', async () => {
    await expect(
      transactionRepo().updateTransactionByStationIdAndTransactionId(
        TENANT,
        { isActive: false },
        'T-UPD',
        'CS-DOES-NOT-EXIST',
      ),
    ).resolves.toBeUndefined();
  });

  it('deactivateActiveTransactionsByStationIdAndEvseId leaves the excluded transaction active', async () => {
    const station = await aStation(TENANT);
    const evse = await anEvse(TENANT, station.id, 11);
    const keep = await aTransaction(TENANT, station.id, 'T-KEEP', { evseId: evse });
    const drop = await aTransaction(TENANT, station.id, 'T-DROP', { evseId: evse });

    const deactivated = await transactionRepo().deactivateActiveTransactionsByStationIdAndEvseId(
      TENANT,
      STATION,
      evse,
      'T-KEEP',
    );

    await keep.reload();
    await drop.reload();
    expect(deactivated.map((row) => row.transactionId)).toEqual(['T-DROP']);
    expect(keep.isActive).toBe(true);
    expect(drop.isActive).toBe(false);
  });

  it('deactivateActiveTransactionsByStationIdAndEvseId leaves other evses alone', async () => {
    const station = await aStation(TENANT);
    const evseA = await anEvse(TENANT, station.id, 11);
    const evseB = await anEvse(TENANT, station.id, 22);
    const onB = await aTransaction(TENANT, station.id, 'T-ON-B', { evseId: evseB });

    await transactionRepo().deactivateActiveTransactionsByStationIdAndEvseId(
      TENANT,
      STATION,
      evseA,
      'T-KEEP',
    );

    await onB.reload();
    expect(onB.isActive).toBe(true);
  });

  // The sequelize twin short-circuits on these rather than deactivating everything.
  it('deactivateActiveTransactionsByStationIdAndEvseId does nothing without a real exclusion', async () => {
    const station = await aStation(TENANT);
    const evse = await anEvse(TENANT, station.id, 11);
    const active = await aTransaction(TENANT, station.id, 'T-ACTIVE', { evseId: evse });

    await expect(
      transactionRepo().deactivateActiveTransactionsByStationIdAndEvseId(
        TENANT,
        STATION,
        evse,
        '0',
      ),
    ).resolves.toEqual([]);

    await active.reload();
    expect(active.isActive).toBe(true);
  });

  // MeterValues is partitioned on (id, transactionCreatedAt); the sequelize model fills
  // that key from the transaction in a hook the drizzle path has to reproduce.
  it('createMeterValue takes the partition key from the transaction it points at', async () => {
    const station = await aStation(TENANT);
    const transaction = await aTransaction(TENANT, station.id, 'T-MV');

    const created = await transactionRepo().createMeterValue(
      TENANT,
      { timestamp: '2025-06-01T08:05:00.000Z', sampledValue: [{ value: 5 }] } as any,
      transaction.id,
    );

    const stored = await MeterValue.findOne({ where: { id: created.id } });
    expect(stored!.transactionCreatedAt.getTime()).toBe(transaction.createdAt.getTime());
  });

  it('createMeterValue keeps an explicitly supplied partition key', async () => {
    const station = await aStation(TENANT);
    const transaction = await aTransaction(TENANT, station.id, 'T-MV2');
    const explicitKey = new Date('2024-02-03T04:05:06.000Z');

    const created = await transactionRepo().createMeterValue(
      TENANT,
      { timestamp: '2025-06-01T08:05:00.000Z', sampledValue: [{ value: 5 }] } as any,
      transaction.id,
      'T-MV2',
      null,
      explicitKey,
    );

    const stored = await MeterValue.findOne({ where: { id: created.id } });
    expect(stored!.transactionCreatedAt.getTime()).toBe(explicitKey.getTime());
  });

  it('createStopTransaction closes the transaction and attaches the readings', async () => {
    const station = await aStation(TENANT);
    const transaction = await aTransaction(TENANT, station.id, 'T-STOP');
    const stoppedAt = new Date('2025-06-01T09:00:00.000Z');

    const stop = await transactionRepo().createStopTransaction(
      TENANT,
      transaction.id,
      STATION,
      42500,
      stoppedAt,
      [aReading(1), aReading(2)],
      'Local',
    );

    await transaction.reload();
    const readings = await MeterValue.findAll({
      where: { stopTransactionDatabaseId: stop.id },
    });
    expect(stop.meterStop).toBe(42500);
    expect(stop.reason).toBe('Local');
    expect(transaction.isActive).toBe(false);
    expect(new Date(transaction.endTime!).getTime()).toBe(stoppedAt.getTime());
    expect(readings).toHaveLength(2);
    expect(readings[0].transactionCreatedAt.getTime()).toBe(transaction.createdAt.getTime());
  });

  it('createStopTransaction throws for a missing transaction and writes nothing', async () => {
    await expect(
      transactionRepo().createStopTransaction(TENANT, 999_999, STATION, 1, new Date(), [
        aReading(1),
      ]),
    ).rejects.toThrow(/not found/);

    expect(await StopTransaction.count()).toBe(0);
    expect(await MeterValue.count()).toBe(0);
  });

  // The stop row, the transaction update and the readings share one transaction, so a
  // failure part-way through must leave none of them behind.
  it('createStopTransaction rolls the whole stop back when a reading is rejected', async () => {
    const station = await aStation(TENANT);
    const transaction = await aTransaction(TENANT, station.id, 'T-ROLLBACK');

    await expect(
      transactionRepo().createStopTransaction(
        TENANT,
        transaction.id,
        STATION,
        42500,
        new Date('2025-06-01T09:00:00.000Z'),
        [aReading(1), { timestamp: 'not-a-date', sampledValue: [{ value: 2 }] } as any],
        'Local',
      ),
    ).rejects.toThrow();

    await transaction.reload();
    expect(await StopTransaction.count()).toBe(0);
    expect(await MeterValue.count()).toBe(0);
    expect(transaction.isActive).toBe(true);
  });
});

describe('DrizzleTransactionRepository write', () => {
  async function anEvseType(tenantId: number, ocppEvseId: number): Promise<number> {
    const row: any = await EvseType.create({ id: ocppEvseId, tenantId } as any);
    return row.databaseId as number;
  }

  async function aTariff(tenantId: number, tariffId: string): Promise<number> {
    const row: any = await Tariff.create({
      tariffId,
      currency: 'USD',
      pricePerKwh: 0.35,
      tenantId,
    } as any);
    return row.id as number;
  }

  const anEventRequest = (overrides: Record<string, unknown> = {}): any => ({
    eventType: 'Started',
    timestamp: '2025-06-01T08:00:00.000Z',
    triggerReason: 'Authorized',
    seqNo: 0,
    transactionInfo: { transactionId: 'T-WRITE' },
    ...overrides,
  });

  const aSample = (value: number, timestamp = '2025-06-01T08:05:00.000Z'): any => ({
    timestamp,
    sampledValue: [
      {
        value,
        measurand: 'Energy.Active.Import.Register',
        unitOfMeasure: { unit: 'kWh' },
      },
    ],
  });

  it('createOrUpdateTransactionByTransactionEventAndStationId creates the transaction, its event and its readings', async () => {
    const station = await aStation(TENANT);

    const result = await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest({ meterValue: [aSample(5)] }),
      STATION,
    );

    expect(result.transactionId).toBe('T-WRITE');
    expect(result.isActive).toBe(true);
    expect(result.startTime).toBe('2025-06-01T08:00:00.000Z');

    const stored = await Transaction.findOne({
      where: { tenantId: TENANT, stationId: station.id, transactionId: 'T-WRITE' },
    });
    expect(stored).not.toBeNull();

    const events = await TransactionEvent.findAll({
      where: { tenantId: TENANT, transactionDatabaseId: stored!.id },
    });
    expect(events).toHaveLength(1);
    expect(events[0].seqNo).toBe(0);

    const readings = await MeterValue.findAll({
      where: { tenantId: TENANT, transactionDatabaseId: stored!.id },
    });
    expect(readings).toHaveLength(1);
    expect(readings[0].transactionEventId).toBe(events[0].id);
  });

  it('createOrUpdateTransactionByTransactionEventAndStationId updates the existing transaction rather than inserting a second', async () => {
    const station = await aStation(TENANT);
    await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest(),
      STATION,
    );

    await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest({ eventType: 'Updated', seqNo: 1, triggerReason: 'MeterValuePeriodic' }),
      STATION,
    );

    const rows = await Transaction.findAll({
      where: { tenantId: TENANT, stationId: station.id, transactionId: 'T-WRITE' },
    });
    expect(rows).toHaveLength(1);

    const events = await TransactionEvent.findAll({
      where: { tenantId: TENANT, transactionDatabaseId: rows[0].id },
      order: [['seqNo', 'ASC']],
    });
    expect(events.map((e) => e.seqNo)).toEqual([0, 1]);
  });

  it('createOrUpdateTransactionByTransactionEventAndStationId closes the transaction on an Ended event', async () => {
    await aStation(TENANT);
    await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest(),
      STATION,
    );

    const ended = await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest({
        eventType: 'Ended',
        seqNo: 1,
        timestamp: '2025-06-01T09:00:00.000Z',
        triggerReason: 'StopAuthorized',
        transactionInfo: { transactionId: 'T-WRITE', stoppedReason: 'Local' },
      }),
      STATION,
    );

    expect(ended.isActive).toBe(false);
    expect(ended.endTime).toBe('2025-06-01T09:00:00.000Z');
    expect(ended.stoppedReason).toBe('Local');
    // The Started event's startTime survives the Ended update.
    expect(ended.startTime).toBe('2025-06-01T08:00:00.000Z');
  });

  it('createOrUpdateTransactionByTransactionEventAndStationId resolves the evse by its OCPP number, creating the row when absent', async () => {
    const station = await aStation(TENANT);

    const result = await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest({ evse: { id: 7 } }),
      STATION,
    );

    const evse = await Evse.findOne({
      where: { tenantId: TENANT, stationId: station.id, evseTypeId: 7 },
    });
    expect(evse).not.toBeNull();
    // Transactions.evseId is the Evses primary key, not the OCPP number.
    expect(result.evseId).toBe(evse!.id);
    expect(result.evseId).not.toBe(7);
  });

  it('createOrUpdateTransactionByTransactionEventAndStationId takes the tariff from the 2.1 transactionInfo', async () => {
    await aStation(TENANT);
    const tariffDatabaseId = await aTariff(TENANT, 'TARIFF-21');

    const result = await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest({ transactionInfo: { transactionId: 'T-WRITE', tariffId: 'TARIFF-21' } }),
      STATION,
    );

    expect(result.tariffId).toBe(tariffDatabaseId);
  });

  it('createOrUpdateTransactionByTransactionEventAndStationId links the authorization by idToken and type', async () => {
    await aStation(TENANT);
    const auth: any = await Authorization.create({
      idToken: 'TAG-1',
      idTokenType: 'ISO14443',
      status: 'Accepted',
      tenantId: TENANT,
    } as any);

    const result = await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest({ idToken: { idToken: 'TAG-1', type: 'ISO14443' } }),
      STATION,
    );

    expect(result.authorizationId).toBe(auth.id);

    const events = await TransactionEvent.findAll({ where: { tenantId: TENANT } });
    expect(events[0].idTokenValue).toBe('TAG-1');
  });

  it('createOrUpdateTransactionByTransactionEventAndStationId leaves TransactionEvents.evseId unset, as the sequelize path does', async () => {
    await aStation(TENANT);
    await anEvseType(TENANT, 3);

    await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest({ evse: { id: 3 } }),
      STATION,
    );

    const events = await TransactionEvent.findAll({ where: { tenantId: TENANT } });
    expect(events).toHaveLength(1);
    expect(events[0].evseId ?? null).toBeNull();
  });

  it('createOrUpdateTransactionByTransactionEventAndStationId derives meterStart and totalKwh from the readings', async () => {
    await aStation(TENANT);

    await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest({ meterValue: [aSample(10, '2025-06-01T08:00:00.000Z')] }),
      STATION,
    );
    const afterFirst = await Transaction.findOne({ where: { tenantId: TENANT } });
    expect(Number(afterFirst!.meterStart)).toBe(10);

    await transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
      TENANT,
      anEventRequest({ seqNo: 1, meterValue: [aSample(14, '2025-06-01T08:30:00.000Z')] }),
      STATION,
    );
    const afterSecond = await Transaction.findOne({ where: { tenantId: TENANT } });
    // meterStart is only taken once; totalKwh is the span from it.
    expect(Number(afterSecond!.meterStart)).toBe(10);
    expect(Number(afterSecond!.totalKwh)).toBe(4);
  });

  it('createOrUpdateTransactionByTransactionEventAndStationId throws for an unknown station and writes nothing', async () => {
    await expect(
      transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT,
        anEventRequest(),
        'CS-DOES-NOT-EXIST',
      ),
    ).rejects.toThrow(/no charging station named/);

    expect(await Transaction.count({ where: { tenantId: TENANT } })).toBe(0);
    expect(await TransactionEvent.count({ where: { tenantId: TENANT } })).toBe(0);
  });

  it('createOrUpdateTransactionByTransactionEventAndStationId rolls the transaction back when a reading is rejected', async () => {
    await aStation(TENANT);

    await expect(
      transactionRepo().createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT,
        anEventRequest({
          meterValue: [{ timestamp: 'not-a-timestamp', sampledValue: [{ value: 1 }] }],
        }),
        STATION,
      ),
    ).rejects.toThrow();

    expect(await Transaction.count({ where: { tenantId: TENANT } })).toBe(0);
    expect(await TransactionEvent.count({ where: { tenantId: TENANT } })).toBe(0);
    expect(await MeterValue.count({ where: { tenantId: TENANT } })).toBe(0);
  });

  it('createTransactionByStartTransaction allocates a transaction id and converts meterStart to kWh', async () => {
    const station = await aStation(TENANT);
    const auth: any = await Authorization.create({
      idToken: 'TAG-16',
      status: 'Accepted',
      tenantId: TENANT,
    } as any);

    const result = await transactionRepo().createTransactionByStartTransaction(
      TENANT,
      {
        connectorId: 1,
        idTag: 'TAG-16',
        meterStart: 5000,
        timestamp: '2025-06-01T08:00:00.000Z',
      } as any,
      STATION,
    );

    expect(result.transactionId).toBe('1');
    expect(result.isActive).toBe(true);
    expect(result.meterStart).toBe(5);
    expect(result.authorizationId).toBe(auth.id);
    expect(result.connectorId).toBe(station.connectorDatabaseId);

    const starts = await StartTransaction.findAll({ where: { tenantId: TENANT } });
    expect(starts).toHaveLength(1);
    // StartTransactions keeps the reported Wh; only the transaction row is converted.
    expect(starts[0].meterStart).toBe(5000);
    expect(starts[0].transactionDatabaseId).toBe(result.id);
  });

  it('createTransactionByStartTransaction hands out a fresh id per call', async () => {
    await aStation(TENANT);
    const request = {
      connectorId: 1,
      idTag: 'TAG-16',
      meterStart: 0,
      timestamp: '2025-06-01T08:00:00.000Z',
    } as any;

    const first = await transactionRepo().createTransactionByStartTransaction(
      TENANT,
      request,
      STATION,
    );
    const second = await transactionRepo().createTransactionByStartTransaction(
      TENANT,
      request,
      STATION,
    );

    expect(second.transactionId).not.toBe(first.transactionId);
  });

  it('createTransactionByStartTransaction throws for a missing connector and writes nothing', async () => {
    await aStation(TENANT);

    await expect(
      transactionRepo().createTransactionByStartTransaction(
        TENANT,
        {
          connectorId: 99,
          idTag: 'TAG-16',
          meterStart: 0,
          timestamp: '2025-06-01T08:00:00.000Z',
        } as any,
        STATION,
      ),
    ).rejects.toThrow(/Unable to find connector 99/);

    expect(await Transaction.count({ where: { tenantId: TENANT } })).toBe(0);
    expect(await StartTransaction.count({ where: { tenantId: TENANT } })).toBe(0);
  });

  it('updateTransactionByMeterValues appends the readings and recomputes the totals', async () => {
    const station = await aStation(TENANT);
    const transaction = await aTransaction(TENANT, station.id, '42', {
      startTime: '2025-06-01T08:00:00.000Z',
    });

    await transactionRepo().updateTransactionByMeterValues(
      TENANT,
      [aSample(3, '2025-06-01T08:00:00.000Z'), aSample(9, '2025-06-01T08:20:00.000Z')],
      STATION,
      42,
    );

    const readings = await MeterValue.findAll({
      where: { tenantId: TENANT, transactionDatabaseId: transaction.id },
    });
    expect(readings).toHaveLength(2);

    await transaction.reload();
    expect(Number(transaction.meterStart)).toBe(3);
    expect(Number(transaction.totalKwh)).toBe(6);
    // Sequelize reads BIGINT as a string even though the model declares number.
    expect(Number(transaction.timeSpentCharging)).toBe(20 * 60);
  });

  it('updateTransactionByMeterValues writes nothing for an unknown transaction', async () => {
    await aStation(TENANT);

    await transactionRepo().updateTransactionByMeterValues(TENANT, [aSample(3)], STATION, 404);

    expect(await MeterValue.count({ where: { tenantId: TENANT } })).toBe(0);
  });
});
