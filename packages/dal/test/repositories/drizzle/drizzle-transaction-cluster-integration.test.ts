// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type {
  MeterValueDto,
  StartTransactionDto,
  StopTransactionDto,
  TransactionDto,
  TransactionEventDto,
} from '@citrineos/types';
import {
  ChargingStation,
  MeterValue,
  StartTransaction,
  StopTransaction,
  Transaction,
  TransactionEvent,
} from '../../../index.js';
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
  db = drizzle(drizzlePool);
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

async function aStation(tenantId: number, ocppConnectionName = STATION): Promise<{ id: number }> {
  const station = await ChargingStation.create({
    ocppConnectionName,
    isOnline: false,
    tenantId,
  } as any);
  return station as unknown as { id: number };
}

async function aTransaction(
  tenantId: number,
  stationId: number,
  transactionId: string,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const row = await Transaction.create({
    stationId,
    ocppConnectionName: STATION,
    transactionId,
    isActive: true,
    tenantId,
    ...overrides,
  } as any);
  return row as unknown as { id: number };
}

async function anEvent(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const row = await TransactionEvent.create({
    ocppConnectionName: STATION,
    eventType: 'Started',
    timestamp: '2025-06-01T08:00:00.000Z',
    triggerReason: 'Authorized',
    seqNo: 0,
    tenantId,
    ...overrides,
  } as any);
  return row as unknown as { id: number };
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
    const id = (row as unknown as { id: number }).id;
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
    });

    expect(dto.meterStart).toBe(100);
    expect(dto.timestamp).toBe('2025-06-01T08:00:00.000Z');
    expect(dto.transactionDatabaseId).toBe(tx.id);
    expect(dto.reservationId).toBeNull();
    // No connector seeded; the DB column is nullable even though the DTO types it as required.
    expect(dto.connectorDatabaseId).toBeNull();
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
    expect(dto.customData).toBeUndefined();
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
