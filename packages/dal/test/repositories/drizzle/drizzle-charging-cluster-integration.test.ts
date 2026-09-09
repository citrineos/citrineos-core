// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type {
  ChargingNeedsDto,
  ChargingProfileDto,
  ChargingScheduleDto,
  CompositeScheduleDto,
  ReservationDto,
  SalesTariffDto,
  SalesTariffEntry,
} from '@citrineos/types';
import {
  ChargingNeeds,
  ChargingProfile,
  ChargingSchedule,
  DrizzleReservationRepository,
  Reservation,
} from '../../../index.js';
import { CompositeSchedule, SalesTariff } from '@dal/db/sequelize/index.js';
import {
  DrizzleChargingNeedsRepository,
  toChargingNeedsDto,
} from '@dal/repositories/drizzle/charging-needs.js';
import {
  DrizzleChargingProfileRepository,
  toChargingProfileDto,
} from '@dal/repositories/drizzle/charging-profile.js';
import {
  DrizzleChargingScheduleRepository,
  toChargingScheduleDto,
} from '@dal/repositories/drizzle/charging-schedule.js';
import {
  DrizzleCompositeScheduleRepository,
  toCompositeScheduleDto,
} from '@dal/repositories/drizzle/composite-schedule.js';
import { toReservationDto } from '@dal/repositories/drizzle/reservation.js';
import {
  DrizzleSalesTariffRepository,
  toSalesTariffDto,
} from '@dal/repositories/drizzle/sales-tariff.js';
import type { ChargingNeedsEntity } from '@dal/db/drizzle/schema/charging-needs.js';
import type { ChargingProfileEntity } from '@dal/db/drizzle/schema/charging-profile.js';
import type { ChargingScheduleEntity } from '@dal/db/drizzle/schema/charging-schedule.js';
import type { CompositeScheduleEntity } from '@dal/db/drizzle/schema/composite-schedule.js';
import type { ReservationEntity } from '@dal/db/drizzle/schema/reservation.js';
import type { SalesTariffEntity } from '@dal/db/drizzle/schema/sales-tariff.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// Profile, Schedule, Needs, CompositeSchedule and SalesTariff carry no domain
// methods, so this suite covers the shared DrizzleRepository CRUD surface per
// repository over the real schema, plus the pure row-to-DTO mappers. Reservation
// is covered on the same CRUD surface here; its domain methods
// (createOrUpdateReservation and friends) are not yet covered anywhere.
// The sequelize twins own schema creation and seed rows; their domain behavior
// is covered by their own suites.
//
// ChargingProfiles, ChargingSchedules, SalesTariffs and Reservations key their
// PK on databaseId while table.id holds the non-unique OCPP id the base CRUD
// keys on, so - as in the location cluster - the id-keyed methods stay untested
// for those four repositories.

const TENANT = 1;
const OTHER_TENANT = 2;
const STATION = 'CS-CHG-1';

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
class ProfileRepo extends DrizzleChargingProfileRepository {
  create(tenantId: number, values: object): Promise<ChargingProfileDto> {
    return this.insert(tenantId, values);
  }
}

class ScheduleRepo extends DrizzleChargingScheduleRepository {
  create(tenantId: number, values: object): Promise<ChargingScheduleDto> {
    return this.insert(tenantId, values);
  }
}

class NeedsRepo extends DrizzleChargingNeedsRepository {
  create(tenantId: number, values: object): Promise<ChargingNeedsDto> {
    return this.insert(tenantId, values);
  }
}

class CompositeRepo extends DrizzleCompositeScheduleRepository {
  create(tenantId: number, values: object): Promise<CompositeScheduleDto> {
    return this.insert(tenantId, values);
  }
}

class TariffRepo extends DrizzleSalesTariffRepository {
  create(tenantId: number, values: object): Promise<SalesTariffDto> {
    return this.insert(tenantId, values);
  }
}

class ReservationRepo extends DrizzleReservationRepository {
  create(tenantId: number, values: object): Promise<ReservationDto> {
    return this.insert(tenantId, values);
  }
}

function profileRepo(): ProfileRepo {
  return new ProfileRepo({ config: h.config, drizzleInstance: db });
}

function scheduleRepo(): ScheduleRepo {
  return new ScheduleRepo({ config: h.config, drizzleInstance: db });
}

function needsRepo(): NeedsRepo {
  return new NeedsRepo({ config: h.config, drizzleInstance: db });
}

function compositeRepo(): CompositeRepo {
  return new CompositeRepo({ config: h.config, drizzleInstance: db });
}

function tariffRepo(): TariffRepo {
  return new TariffRepo({ config: h.config, drizzleInstance: db });
}

function reservationRepo(): ReservationRepo {
  return new ReservationRepo({ config: h.config, drizzleInstance: db });
}

async function aProfile(
  tenantId: number,
  id: number,
  overrides: Record<string, unknown> = {},
): Promise<{ databaseId: number }> {
  const row = await ChargingProfile.create({
    ocppConnectionName: STATION,
    id,
    chargingProfileKind: 'Absolute',
    chargingProfilePurpose: 'TxProfile',
    stackLevel: 0,
    tenantId,
    ...overrides,
  } as any);
  return row as unknown as { databaseId: number };
}

async function aSchedule(
  tenantId: number,
  id: number,
  overrides: Record<string, unknown> = {},
): Promise<{ databaseId: number }> {
  const row = await ChargingSchedule.create({
    id,
    ocppConnectionName: STATION,
    chargingRateUnit: 'W',
    chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000 }],
    tenantId,
    ...overrides,
  } as any);
  return row as unknown as { databaseId: number };
}

async function aNeeds(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const row = await ChargingNeeds.create({
    requestedEnergyTransfer: 'AC_three_phase',
    tenantId,
    ...overrides,
  } as any);
  return row as unknown as { id: number };
}

async function aComposite(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const row = await CompositeSchedule.create({
    ocppConnectionName: STATION,
    duration: 1800,
    scheduleStart: '2025-07-01T08:00:00.000Z',
    chargingRateUnit: 'A',
    chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
    tenantId,
    ...overrides,
  } as any);
  return row as unknown as { id: number };
}

describe('DrizzleChargingProfileRepository', () => {
  it('insert stamps the calling tenant, applies column defaults and emits created', async () => {
    const repo = profileRepo();
    const created: ChargingProfileDto[][] = [];
    repo.on('created', (dtos: ChargingProfileDto[]) => created.push(dtos));

    const dto = await repo.create(TENANT, {
      ocppConnectionName: STATION,
      id: 1,
      chargingProfileKind: 'Absolute',
      chargingProfilePurpose: 'TxDefaultProfile',
      stackLevel: 2,
      validFrom: new Date('2025-07-01T00:00:00.000Z'),
      validTo: new Date('2025-08-01T00:00:00.000Z'),
      tenantId: 42, // overwritten by the repository
    });

    expect(dto.databaseId).toBeDefined();
    expect(dto.tenantId).toBe(TENANT);
    expect(dto.id).toBe(1);
    expect(dto.chargingProfilePurpose).toBe('TxDefaultProfile');
    expect(dto.stackLevel).toBe(2);
    // Column defaults, not set by the payload.
    expect(dto.isActive).toBe(false);
    expect(dto.chargingLimitSource).toBe('CSO');
    expect(dto.validFrom).toBe('2025-07-01T00:00:00.000Z');
    expect(dto.validTo).toBe('2025-08-01T00:00:00.000Z');
    expect(dto.transactionDatabaseId).toBeNull();
    expect(created).toEqual([[dto]]);

    const row = await ChargingProfile.findByPk(dto.databaseId);
    expect(row!.chargingProfileKind).toBe('Absolute');
    expect(row!.tenantId).toBe(TENANT);
  });

  it('findAll and countAll stay inside the calling tenant', async () => {
    const repo = profileRepo();
    await aProfile(TENANT, 1);
    await aProfile(TENANT, 2);
    await aProfile(OTHER_TENANT, 1);

    const own = await repo.findAll(TENANT);
    expect(own.map((p) => p.id).sort()).toEqual([1, 2]);
    expect(own.every((p) => p.tenantId === TENANT)).toBe(true);
    expect(await repo.countAll(TENANT)).toBe(2);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });

  it('rejects a duplicate station/id tuple in the same tenant but not across tenants', async () => {
    const repo = profileRepo();
    const values = {
      ocppConnectionName: STATION,
      id: 7,
      chargingProfileKind: 'Absolute',
      chargingProfilePurpose: 'TxProfile',
      stackLevel: 0,
    };
    await repo.create(TENANT, values);

    // Unique index on (ocppConnectionName, id, tenantId); drizzle wraps the pg error.
    await expect(repo.create(TENANT, values)).rejects.toThrow(
      /Failed query: insert into "ChargingProfiles"/,
    );

    const foreign = await repo.create(OTHER_TENANT, values);
    expect(foreign.tenantId).toBe(OTHER_TENANT);
    expect(await ChargingProfile.count()).toBe(2);
  });

  it('insert pointing at a missing transaction rejects on the FK', async () => {
    const repo = profileRepo();

    await expect(
      repo.create(TENANT, {
        ocppConnectionName: STATION,
        id: 9,
        chargingProfileKind: 'Absolute',
        chargingProfilePurpose: 'TxProfile',
        stackLevel: 0,
        transactionDatabaseId: 424242,
      }),
    ).rejects.toThrow(/Failed query: insert into "ChargingProfiles"/);
    expect(await ChargingProfile.count()).toBe(0);
  });
});

describe('DrizzleChargingScheduleRepository', () => {
  it('insert converts numeric and timestamp columns on the way out', async () => {
    const repo = scheduleRepo();
    const profile = await aProfile(TENANT, 1);
    const periods = [
      { startPeriod: 0, limit: 11000 },
      { startPeriod: 3600, limit: 7400 },
    ];

    const dto = await repo.create(TENANT, {
      id: 11,
      ocppConnectionName: STATION,
      chargingRateUnit: 'W',
      chargingSchedulePeriod: periods,
      duration: 7200,
      minChargingRate: '0.75',
      startSchedule: '2025-07-01T00:00:00Z',
      timeBase: new Date('2025-07-01T08:00:00.000Z'),
      chargingProfileDatabaseId: profile.databaseId,
    });

    expect(dto.databaseId).toBeDefined();
    expect(dto.id).toBe(11);
    // DECIMAL columns arrive as strings from node-postgres and are numbers on the DTO.
    expect(dto.minChargingRate).toBe(0.75);
    expect(dto.timeBase).toBe('2025-07-01T08:00:00.000Z');
    expect(dto.chargingSchedulePeriod).toEqual(periods);
    expect(dto.duration).toBe(7200);
    expect(dto.chargingProfileDatabaseId).toBe(profile.databaseId);
    expect(dto.tenantId).toBe(TENANT);

    const row = await ChargingSchedule.findByPk(dto.databaseId);
    expect(row!.chargingRateUnit).toBe('W');
    expect(Number(row!.minChargingRate)).toBe(0.75);
  });

  it('findAll substitutes defaults for null columns and stays tenant-scoped', async () => {
    const repo = scheduleRepo();
    await ChargingSchedule.create({ id: 12, tenantId: TENANT } as any);

    const own = await repo.findAll(TENANT);
    expect(own).toHaveLength(1);
    expect(own[0].id).toBe(12);
    // Mapper defaults: null ocppConnectionName becomes '', null timeBase and
    // chargingProfileDatabaseId become undefined, null minChargingRate stays null.
    expect(own[0].ocppConnectionName).toBe('');
    expect(own[0].timeBase).toBeUndefined();
    expect(own[0].chargingProfileDatabaseId).toBeUndefined();
    expect(own[0].minChargingRate).toBeNull();
    expect(own[0].salesTariff).toBeUndefined();
    expect(await repo.countAll(OTHER_TENANT)).toBe(0);
  });

  it('rejects a duplicate id/station tuple in the same tenant', async () => {
    const repo = scheduleRepo();
    const values = {
      id: 13,
      ocppConnectionName: STATION,
      chargingRateUnit: 'A',
      chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
    };
    await repo.create(TENANT, values);

    await expect(repo.create(TENANT, values)).rejects.toThrow(
      /Failed query: insert into "ChargingSchedules"/,
    );
    expect(await ChargingSchedule.count()).toBe(1);
  });
});

describe('DrizzleChargingNeedsRepository', () => {
  it('insert and findById round-trip jsonb parameters and the departure time', async () => {
    const repo = needsRepo();
    const acParams = { energyAmount: 30000, evMinCurrent: 6, evMaxCurrent: 32, evMaxVoltage: 400 };

    const dto = await repo.create(TENANT, {
      acChargingParameters: acParams,
      departureTime: new Date('2025-07-01T18:00:00.000Z'),
      requestedEnergyTransfer: 'AC_three_phase',
      maxScheduleTuples: 3,
    });

    expect(dto.id).toBeDefined();
    expect(dto.acChargingParameters).toEqual(acParams);
    expect(dto.dcChargingParameters).toBeNull();
    expect(dto.departureTime).toBe('2025-07-01T18:00:00.000Z');
    expect(dto.requestedEnergyTransfer).toBe('AC_three_phase');
    expect(dto.maxScheduleTuples).toBe(3);
    expect(dto.tenantId).toBe(TENANT);

    const read = await repo.findById(TENANT, dto.id!);
    expect(read!.acChargingParameters).toEqual(acParams);
    expect(await repo.findById(OTHER_TENANT, dto.id!)).toBeUndefined();
    expect(await repo.exists(TENANT, dto.id!)).toBe(true);
    expect(await repo.exists(OTHER_TENANT, dto.id!)).toBe(false);
  });

  it('updateById writes fields for the owning tenant only and emits updated', async () => {
    const repo = needsRepo();
    const seeded = await aNeeds(TENANT);
    const updatedEvents: ChargingNeedsDto[][] = [];
    repo.on('updated', (dtos: ChargingNeedsDto[]) => updatedEvents.push(dtos));

    expect(
      await repo.updateById(OTHER_TENANT, seeded.id, { maxScheduleTuples: 5 }),
    ).toBeUndefined();
    expect(updatedEvents).toHaveLength(0);

    const dto = await repo.updateById(TENANT, seeded.id, {
      maxScheduleTuples: 5,
      requestedEnergyTransfer: 'DC',
    });
    expect(dto!.maxScheduleTuples).toBe(5);
    expect(dto!.requestedEnergyTransfer).toBe('DC');
    expect(updatedEvents).toEqual([[dto]]);

    const row = await ChargingNeeds.findByPk(seeded.id);
    expect(row!.maxScheduleTuples).toBe(5);
  });

  it('deleteById removes only the calling tenant row and emits deleted', async () => {
    const repo = needsRepo();
    const own = await aNeeds(TENANT);
    await aNeeds(OTHER_TENANT);
    const deletedEvents: ChargingNeedsDto[][] = [];
    repo.on('deleted', (dtos: ChargingNeedsDto[]) => deletedEvents.push(dtos));

    expect(await repo.deleteById(OTHER_TENANT, own.id)).toBeUndefined();
    expect(await ChargingNeeds.count()).toBe(2);
    expect(deletedEvents).toHaveLength(0);

    const dto = await repo.deleteById(TENANT, own.id);
    expect(dto!.requestedEnergyTransfer).toBe('AC_three_phase');
    expect(await ChargingNeeds.count()).toBe(1);
    expect(deletedEvents).toEqual([[dto]]);
    expect(await repo.deleteById(TENANT, own.id)).toBeUndefined();
  });

  it('insert pointing at a missing transaction rejects on the FK', async () => {
    const repo = needsRepo();

    await expect(
      repo.create(TENANT, {
        requestedEnergyTransfer: 'DC',
        transactionDatabaseId: 424242,
      }),
    ).rejects.toThrow(/Failed query: insert into "ChargingNeeds"/);
    expect(await ChargingNeeds.count()).toBe(0);
  });
});

describe('DrizzleCompositeScheduleRepository', () => {
  it('insert maps scheduleStart to ISO and round-trips the period jsonb', async () => {
    const repo = compositeRepo();
    const periods = [{ startPeriod: 0, limit: 16 }];

    const dto = await repo.create(TENANT, {
      ocppConnectionName: STATION,
      duration: 1800,
      scheduleStart: new Date('2025-07-01T08:00:00.000Z'),
      chargingRateUnit: 'A',
      chargingSchedulePeriod: periods,
    });

    expect(dto.id).toBeDefined();
    expect(dto.ocppConnectionName).toBe(STATION);
    expect(dto.duration).toBe(1800);
    expect(dto.scheduleStart).toBe('2025-07-01T08:00:00.000Z');
    expect(dto.chargingRateUnit).toBe('A');
    expect(dto.chargingSchedulePeriod).toEqual(periods);
    expect(dto.evseId).toBeNull();
    expect(dto.tenantId).toBe(TENANT);

    const read = await repo.findById(TENANT, dto.id!);
    expect(read!.scheduleStart).toBe('2025-07-01T08:00:00.000Z');
    expect(await repo.findById(OTHER_TENANT, dto.id!)).toBeUndefined();
  });

  it('findAll and countAll stay inside the calling tenant', async () => {
    const repo = compositeRepo();
    await aComposite(TENANT);
    await aComposite(TENANT, { duration: 3600 });
    await aComposite(OTHER_TENANT);

    const own = await repo.findAll(TENANT);
    expect(own.map((s) => s.duration).sort()).toEqual([1800, 3600]);
    expect(own.every((s) => s.tenantId === TENANT)).toBe(true);
    expect(await repo.countAll(TENANT)).toBe(2);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });

  it('updateById and deleteById skip other tenants and emit events', async () => {
    const repo = compositeRepo();
    const seeded = await aComposite(TENANT);
    const updatedEvents: CompositeScheduleDto[][] = [];
    const deletedEvents: CompositeScheduleDto[][] = [];
    repo.on('updated', (dtos: CompositeScheduleDto[]) => updatedEvents.push(dtos));
    repo.on('deleted', (dtos: CompositeScheduleDto[]) => deletedEvents.push(dtos));

    expect(await repo.updateById(OTHER_TENANT, seeded.id, { duration: 900 })).toBeUndefined();
    const updated = await repo.updateById(TENANT, seeded.id, { duration: 900 });
    expect(updated!.duration).toBe(900);
    expect(updatedEvents).toEqual([[updated]]);

    expect(await repo.deleteById(OTHER_TENANT, seeded.id)).toBeUndefined();
    const deleted = await repo.deleteById(TENANT, seeded.id);
    expect(deleted!.duration).toBe(900);
    expect(deletedEvents).toEqual([[deleted]]);
    expect(await CompositeSchedule.count()).toBe(0);
  });

  it('insert under a nonexistent tenant rejects on the tenant FK', async () => {
    const repo = compositeRepo();

    await expect(
      repo.create(999, {
        ocppConnectionName: STATION,
        duration: 60,
        scheduleStart: new Date('2025-07-01T08:00:00.000Z'),
        chargingRateUnit: 'W',
        chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000 }],
      }),
    ).rejects.toThrow(/Failed query: insert into "CompositeSchedules"/);
    expect(await CompositeSchedule.count()).toBe(0);
  });
});

describe('DrizzleSalesTariffRepository', () => {
  const entries: SalesTariffEntry[] = [
    { relativeTimeInterval: { start: 0, duration: 3600 }, ePriceLevel: 1 },
    { relativeTimeInterval: { start: 3600 }, ePriceLevel: 2 },
  ];

  it('insert links a charging schedule and round-trips the tariff entries', async () => {
    const repo = tariffRepo();
    const schedule = await aSchedule(TENANT, 21);
    const created: SalesTariffDto[][] = [];
    repo.on('created', (dtos: SalesTariffDto[]) => created.push(dtos));

    const dto = await repo.create(TENANT, {
      id: 5,
      numEPriceLevels: 2,
      salesTariffDescription: 'Day tariff',
      salesTariffEntry: entries,
      chargingScheduleDatabaseId: schedule.databaseId,
    });

    expect(dto.databaseId).toBeDefined();
    expect(dto.id).toBe(5);
    expect(dto.numEPriceLevels).toBe(2);
    expect(dto.salesTariffDescription).toBe('Day tariff');
    expect(dto.salesTariffEntry).toEqual(entries);
    expect(dto.chargingScheduleDatabaseId).toBe(schedule.databaseId);
    expect(dto.tenantId).toBe(TENANT);
    expect(created).toEqual([[dto]]);

    const row = await SalesTariff.findByPk(dto.databaseId);
    expect(row!.chargingScheduleDatabaseId).toBe(schedule.databaseId);
  });

  it('findAll and countAll stay inside the calling tenant', async () => {
    const repo = tariffRepo();
    const scheduleA = await aSchedule(TENANT, 21);
    const scheduleB = await aSchedule(OTHER_TENANT, 21);
    await SalesTariff.create({
      id: 5,
      salesTariffEntry: entries,
      chargingScheduleDatabaseId: scheduleA.databaseId,
      tenantId: TENANT,
    } as any);
    await SalesTariff.create({
      id: 6,
      salesTariffEntry: entries,
      chargingScheduleDatabaseId: scheduleB.databaseId,
      tenantId: OTHER_TENANT,
    } as any);

    const own = await repo.findAll(TENANT);
    expect(own).toHaveLength(1);
    expect(own[0].id).toBe(5);
    expect(own[0].chargingScheduleDatabaseId).toBe(scheduleA.databaseId);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });

  it('rejects a duplicate id for the same charging schedule', async () => {
    const repo = tariffRepo();
    const schedule = await aSchedule(TENANT, 21);
    const values = {
      id: 5,
      salesTariffEntry: entries,
      chargingScheduleDatabaseId: schedule.databaseId,
    };
    await repo.create(TENANT, values);

    // Unique index on (id, chargingScheduleDatabaseId).
    await expect(repo.create(TENANT, values)).rejects.toThrow(
      /Failed query: insert into "SalesTariffs"/,
    );
    expect(await SalesTariff.count()).toBe(1);
  });

  it('insert pointing at a missing charging schedule rejects on the FK', async () => {
    const repo = tariffRepo();

    await expect(
      repo.create(TENANT, {
        id: 5,
        salesTariffEntry: entries,
        chargingScheduleDatabaseId: 424242,
      }),
    ).rejects.toThrow(/Failed query: insert into "SalesTariffs"/);
    expect(await SalesTariff.count()).toBe(0);
  });
});

describe('DrizzleReservationRepository', () => {
  const token = { idToken: 'TOKEN-1', type: 'ISO14443' };

  it('insert maps expiryDateTime to ISO and applies the isActive default', async () => {
    const repo = reservationRepo();
    const created: ReservationDto[][] = [];
    repo.on('created', (dtos: ReservationDto[]) => created.push(dtos));

    const dto = await repo.create(TENANT, {
      id: 42,
      ocppConnectionName: STATION,
      expiryDateTime: new Date('2025-07-01T12:00:00.000Z'),
      connectorType: 'cType2',
      idToken: token,
    });

    expect(dto.databaseId).toBeDefined();
    expect(dto.id).toBe(42);
    expect(dto.ocppConnectionName).toBe(STATION);
    expect(dto.expiryDateTime).toBe('2025-07-01T12:00:00.000Z');
    expect(dto.connectorType).toBe('cType2');
    expect(dto.idToken).toEqual(token);
    // Column default and unset nullable columns.
    expect(dto.isActive).toBe(false);
    expect(dto.reserveStatus).toBeNull();
    expect(dto.terminatedByTransaction).toBeNull();
    expect(dto.groupIdToken).toBeNull();
    expect(dto.evseId).toBeNull();
    expect(dto.tenantId).toBe(TENANT);
    expect(created).toEqual([[dto]]);

    const row = await Reservation.findByPk(dto.databaseId);
    expect(row!.id).toBe(42);
    expect(row!.tenantId).toBe(TENANT);
  });

  it('findAll and countAll allow the same reservation id across tenants', async () => {
    const repo = reservationRepo();
    await Reservation.create({
      id: 42,
      ocppConnectionName: STATION,
      expiryDateTime: '2025-07-01T12:00:00.000Z',
      idToken: token,
      tenantId: TENANT,
    } as any);
    await Reservation.create({
      id: 42,
      ocppConnectionName: STATION,
      expiryDateTime: '2025-07-02T12:00:00.000Z',
      idToken: token,
      tenantId: OTHER_TENANT,
    } as any);

    const own = await repo.findAll(TENANT);
    expect(own).toHaveLength(1);
    expect(own[0].expiryDateTime).toBe('2025-07-01T12:00:00.000Z');
    const foreign = await repo.findAll(OTHER_TENANT);
    expect(foreign[0].expiryDateTime).toBe('2025-07-02T12:00:00.000Z');
    expect(await repo.countAll(TENANT)).toBe(1);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });

  it('rejects a duplicate reservation id for the same station and tenant', async () => {
    const repo = reservationRepo();
    const values = {
      id: 42,
      ocppConnectionName: STATION,
      expiryDateTime: new Date('2025-07-01T12:00:00.000Z'),
      idToken: token,
    };
    await repo.create(TENANT, values);

    // Unique index on (id, ocppConnectionName, tenantId).
    await expect(repo.create(TENANT, values)).rejects.toThrow(
      /Failed query: insert into "Reservations"/,
    );
    expect(await Reservation.count()).toBe(1);
  });
});

describe('drizzle row-to-DTO mappers', () => {
  const timestamps = {
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  };

  it('toChargingProfileDto converts validity dates to ISO and defaults null isActive', () => {
    const dto = toChargingProfileDto({
      databaseId: 3,
      ocppConnectionName: STATION,
      id: 1,
      chargingProfileKind: 'Recurring',
      chargingProfilePurpose: 'TxDefaultProfile',
      recurrencyKind: 'Daily',
      stackLevel: 4,
      validFrom: new Date('2025-05-01T10:00:00.000Z'),
      validTo: null,
      evseId: 2,
      isActive: null,
      chargingLimitSource: 'EMS',
      transactionDatabaseId: 17,
      tenantId: TENANT,
      ...timestamps,
    } as ChargingProfileEntity);

    expect(dto.validFrom).toBe('2025-05-01T10:00:00.000Z');
    expect(dto.validTo).toBeNull();
    expect(dto.isActive).toBe(false);
    expect(dto.chargingLimitSource).toBe('EMS');
    expect(dto.recurrencyKind).toBe('Daily');
    expect(dto.transactionDatabaseId).toBe(17);
    expect(dto.tenant).toBeUndefined();
  });

  it('toChargingScheduleDto converts the decimal string and substitutes defaults', () => {
    const dto = toChargingScheduleDto({
      databaseId: 6,
      id: 11,
      ocppConnectionName: null,
      chargingRateUnit: 'W',
      chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000 }],
      duration: 3600,
      minChargingRate: '2.50',
      startSchedule: '2025-07-01T00:00:00Z',
      timeBase: null,
      chargingProfileDatabaseId: null,
      salesTariffId: null,
      tenantId: TENANT,
      ...timestamps,
    } as ChargingScheduleEntity);

    expect(dto.minChargingRate).toBe(2.5);
    expect(dto.ocppConnectionName).toBe('');
    expect(dto.timeBase).toBeUndefined();
    expect(dto.chargingProfileDatabaseId).toBeUndefined();
    expect(dto.salesTariff).toBeUndefined();
    expect(dto.chargingSchedulePeriod).toEqual([{ startPeriod: 0, limit: 11000 }]);
  });

  it('toChargingNeedsDto converts departureTime to ISO and keeps null parameters', () => {
    const dto = toChargingNeedsDto({
      id: 2,
      acChargingParameters: null,
      dcChargingParameters: { evMaxCurrent: 200, evMaxVoltage: 800 },
      departureTime: new Date('2025-07-01T18:00:00.000Z'),
      requestedEnergyTransfer: 'DC',
      maxScheduleTuples: null,
      evseId: 3,
      transactionDatabaseId: 12,
      tenantId: TENANT,
      ...timestamps,
    } as ChargingNeedsEntity);

    expect(dto.departureTime).toBe('2025-07-01T18:00:00.000Z');
    expect(dto.acChargingParameters).toBeNull();
    expect(dto.dcChargingParameters).toEqual({ evMaxCurrent: 200, evMaxVoltage: 800 });
    expect(dto.requestedEnergyTransfer).toBe('DC');
    expect(dto.maxScheduleTuples).toBeNull();
    expect(dto.evseId).toBe(3);
    expect(dto.transactionDatabaseId).toBe(12);
  });

  it('toCompositeScheduleDto converts scheduleStart and defaults null strings', () => {
    const dto = toCompositeScheduleDto({
      id: 4,
      ocppConnectionName: null,
      evseId: null,
      duration: 1800,
      scheduleStart: new Date('2025-07-01T08:00:00.000Z'),
      chargingRateUnit: null,
      chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
      tenantId: TENANT,
      ...timestamps,
    } as CompositeScheduleEntity);

    expect(dto.scheduleStart).toBe('2025-07-01T08:00:00.000Z');
    expect(dto.ocppConnectionName).toBe('');
    expect(dto.chargingRateUnit).toBe('');
    expect(dto.evseId).toBeNull();
    expect(dto.chargingSchedulePeriod).toEqual([{ startPeriod: 0, limit: 16 }]);
  });

  it('toSalesTariffDto carries the entry tuple and nullable descriptors', () => {
    const entry: SalesTariffEntry = { relativeTimeInterval: { start: 0 }, ePriceLevel: 1 };
    const dto = toSalesTariffDto({
      databaseId: 8,
      id: 5,
      numEPriceLevels: null,
      salesTariffDescription: null,
      salesTariffEntry: [entry],
      chargingScheduleDatabaseId: 21,
      tenantId: TENANT,
      ...timestamps,
    } as SalesTariffEntity);

    expect(dto.databaseId).toBe(8);
    expect(dto.id).toBe(5);
    expect(dto.numEPriceLevels).toBeNull();
    expect(dto.salesTariffDescription).toBeNull();
    expect(dto.salesTariffEntry).toEqual([entry]);
    expect(dto.chargingScheduleDatabaseId).toBe(21);
    expect(dto.createdAt).toEqual(timestamps.createdAt);
  });

  it('toReservationDto substitutes defaults for null token and date columns', () => {
    const dto = toReservationDto({
      databaseId: 9,
      id: 42,
      ocppConnectionName: null,
      expiryDateTime: null,
      connectorType: null,
      reserveStatus: null,
      isActive: null,
      terminatedByTransaction: null,
      idToken: null,
      groupIdToken: null,
      evseId: null,
      tenantId: TENANT,
      ...timestamps,
    } as ReservationEntity);

    expect(dto.ocppConnectionName).toBe('');
    expect(dto.expiryDateTime).toBe('');
    expect(dto.idToken).toEqual({});
    expect(dto.groupIdToken).toBeNull();
    expect(dto.isActive).toBe(false);
    expect(dto.connectorType).toBeNull();
    expect(dto.evseId).toBeNull();
    expect(dto.evse).toBeUndefined();
  });
});
