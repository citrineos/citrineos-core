// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { ChargingStation, Evse } from '@dal/db/sequelize/index.js';
import { OCPP2_0_1 } from '@citrineos/types';
import { ChargingNeeds, ChargingProfile, ChargingSchedule, Transaction } from '../../../index.js';
import { CompositeSchedule } from '@dal/models/charging-profile/composite-schedule.js';
import { SalesTariff } from '@dal/models/charging-profile/sales-tariff.js';
import type {
  ChargingProfileInput,
  ChargingScheduleInput,
  CompositeScheduleInput,
} from '@dal/mappers/2.0.1/charging-profile-mapper.js';
import { DrizzleChargingNeedsRepository } from '@dal/repositories/drizzle/charging-needs.js';
import { DrizzleChargingProfileRepository } from '@dal/repositories/drizzle/charging-profile.js';
import { DrizzleChargingScheduleRepository } from '@dal/repositories/drizzle/charging-schedule.js';
import { DrizzleCompositeScheduleRepository } from '@dal/repositories/drizzle/composite-schedule.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// The drizzle twin of charging-profile-integration.test.ts.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'cp001';
const OTHER_STATION = 'cp002';

let h: PgHarness;
let drizzlePool: pg.Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  h = await startPgHarness();
  drizzlePool = new pg.Pool({
    host: h.config.database.host,
    port: h.config.database.port,
    database: h.config.database.database,
    user: h.config.database.username,
    password: h.config.database.password,
  });
  drizzlePool.on('error', () => {});
  db = drizzle(drizzlePool);
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await h?.stop();
}, 90_000);

beforeEach(async () => {
  await resetDb(h);
});

function deps() {
  return { config: h.config, drizzleInstance: db };
}

function profileRepo() {
  return new DrizzleChargingProfileRepository(deps());
}

function scheduleRepo() {
  return new DrizzleChargingScheduleRepository(deps());
}

function aScheduleInput(overrides: Partial<ChargingScheduleInput> = {}): ChargingScheduleInput {
  return {
    id: 1,
    chargingRateUnit: 'W',
    chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000 }],
    ...overrides,
  };
}

function aProfileInput(overrides: Partial<ChargingProfileInput> = {}): ChargingProfileInput {
  return {
    id: 1,
    stackLevel: 0,
    chargingProfilePurpose: 'TxDefaultProfile',
    chargingProfileKind: 'Absolute',
    chargingSchedule: [aScheduleInput()],
    ...overrides,
  };
}

function aCompositeInput(overrides: Partial<CompositeScheduleInput> = {}): CompositeScheduleInput {
  return {
    evseId: 0,
    duration: 3600,
    scheduleStart: '2025-06-01T10:00:00.000Z',
    chargingRateUnit: 'W',
    chargingSchedulePeriod: [{ startPeriod: 0, limit: 7400 }],
    ...overrides,
  };
}

async function aStation(ocppConnectionName = STATION, tenantId = TENANT_A) {
  return ChargingStation.create({ ocppConnectionName, isOnline: true, tenantId } as any);
}

async function stationIdOf(ocppConnectionName = STATION, tenantId = TENANT_A): Promise<number> {
  const row = (await ChargingStation.findOne({
    where: { ocppConnectionName, tenantId },
  })) as unknown as { id: number };
  return row.id;
}

async function aProfileRow(overrides: Record<string, unknown> = {}) {
  return ChargingProfile.create({
    id: 1,
    ocppConnectionName: STATION,
    stackLevel: 0,
    chargingProfilePurpose: 'TxDefaultProfile',
    chargingProfileKind: 'Absolute',
    tenantId: TENANT_A,
    ...overrides,
  } as any);
}

// Transaction.evseId is a foreign key to the Evse PK; the OCPP evse id lives on Evse.evseTypeId.
async function anActiveTxOnEvse(evseTypeId: number, overrides: Record<string, unknown> = {}) {
  const stationId = await stationIdOf();
  const evse = await Evse.create({ tenantId: TENANT_A, stationId, evseTypeId } as any);
  const tx = await Transaction.create({
    tenantId: TENANT_A,
    stationId,
    transactionId: 'tx-1',
    isActive: true,
    evseId: evse.id,
    ...overrides,
  } as any);
  return { evse, tx };
}

function aNeedsRequest(evseId: number): OCPP2_0_1.NotifyEVChargingNeedsRequest {
  return {
    evseId,
    maxScheduleTuples: 4,
    chargingNeeds: {
      requestedEnergyTransfer: OCPP2_0_1.EnergyTransferModeEnumType.DC,
      departureTime: '2025-06-01T18:00:00.000Z',
    },
  };
}

describe('DrizzleChargingProfileRepository.createOrUpdateChargingProfile', () => {
  it('stores the profile with its schedule and sales tariff', async () => {
    await aStation();

    const saved = await profileRepo().createOrUpdateChargingProfile(
      TENANT_A,
      aProfileInput({
        chargingSchedule: [
          aScheduleInput({
            minChargingRate: 1.5,
            salesTariff: { id: 7, salesTariffEntry: [{ relativeTimeInterval: { start: 0 } }] },
          }),
        ],
      }),
      STATION,
    );

    expect(saved.id).toBe(1);
    expect(saved.ocppConnectionName).toBe(STATION);
    // The default when the caller supplies neither flag nor source.
    expect(saved.isActive).toBe(false);
    expect(saved.chargingLimitSource).toBe('CSO');

    const schedules = await ChargingSchedule.findAll({
      where: { chargingProfileDatabaseId: saved.databaseId },
    });
    expect(schedules).toHaveLength(1);
    // DECIMAL round-trips through a string column.
    expect(Number(schedules[0].get('minChargingRate'))).toBe(1.5);
    expect(await SalesTariff.count()).toBe(1);
  });

  it('links the profile to an active transaction named by the request', async () => {
    await aStation();
    const { tx } = await anActiveTxOnEvse(1);

    const saved = await profileRepo().createOrUpdateChargingProfile(
      TENANT_A,
      aProfileInput({ transactionId: 'tx-1' }),
      STATION,
    );

    expect(saved.transactionDatabaseId).toBe(tx.id);
  });

  it('leaves the transaction unset when the id matches nothing on the station', async () => {
    await aStation();

    const saved = await profileRepo().createOrUpdateChargingProfile(
      TENANT_A,
      aProfileInput({ transactionId: 'no-such-tx' }),
      STATION,
    );

    expect(saved.transactionDatabaseId ?? null).toBeNull();
  });

  it('replaces the schedules and their sales tariffs when the profile is re-sent', async () => {
    await aStation();
    const repo = profileRepo();
    const first = await repo.createOrUpdateChargingProfile(
      TENANT_A,
      aProfileInput({
        chargingSchedule: [
          aScheduleInput({
            salesTariff: { id: 1, salesTariffEntry: [{ relativeTimeInterval: { start: 0 } }] },
          }),
        ],
      }),
      STATION,
    );

    const second = await repo.createOrUpdateChargingProfile(
      TENANT_A,
      aProfileInput({
        stackLevel: 3,
        chargingSchedule: [
          aScheduleInput({ id: 2, chargingSchedulePeriod: [{ startPeriod: 0, limit: 22000 }] }),
        ],
      }),
      STATION,
    );

    expect(second.databaseId).toBe(first.databaseId);
    expect(second.stackLevel).toBe(3);
    expect(await ChargingProfile.count()).toBe(1);

    const schedules = await ChargingSchedule.findAll();
    expect(schedules).toHaveLength(1);
    expect(schedules[0].get('id')).toBe(2);
    // The old schedule's sales tariff goes with it.
    expect(await SalesTariff.count()).toBe(0);
  });

  it('keeps one profile per station for the same OCPP id', async () => {
    await aStation();
    await aStation(OTHER_STATION);
    const repo = profileRepo();

    await repo.createOrUpdateChargingProfile(TENANT_A, aProfileInput(), STATION);
    await repo.createOrUpdateChargingProfile(TENANT_A, aProfileInput(), OTHER_STATION);

    expect(await ChargingProfile.count()).toBe(2);
  });
});

describe('DrizzleChargingProfileRepository reads', () => {
  it('readChargingProfiles filters on the fields it is given and scopes to the tenant', async () => {
    await aStation();
    await aProfileRow({ id: 1, stackLevel: 1, isActive: true });
    await aProfileRow({ id: 2, stackLevel: 2, isActive: false });
    await aProfileRow({ id: 3, stackLevel: 1, isActive: true, tenantId: TENANT_B });

    const active = await profileRepo().readChargingProfiles(TENANT_A, {
      ocppConnectionName: STATION,
      isActive: true,
    });

    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(1);
    expect(await profileRepo().readChargingProfiles(TENANT_A, { stackLevel: 2 })).toHaveLength(1);
  });

  it('readTxProfilesWithSchedules returns active TxProfiles carrying their schedules', async () => {
    await aStation();
    const { tx } = await anActiveTxOnEvse(1);
    const profile = await aProfileRow({
      id: 1,
      chargingProfilePurpose: 'TxProfile',
      isActive: true,
      transactionDatabaseId: tx.id,
    });
    await ChargingSchedule.create({
      tenantId: TENANT_A,
      ocppConnectionName: STATION,
      chargingProfileDatabaseId: profile.databaseId,
      id: 9,
      chargingRateUnit: 'W',
      chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000 }],
    } as any);
    // Inactive, so it must not come back.
    await aProfileRow({
      id: 2,
      chargingProfilePurpose: 'TxProfile',
      isActive: false,
      transactionDatabaseId: tx.id,
    });

    const found = await profileRepo().readTxProfilesWithSchedules(TENANT_A, STATION, tx.id);

    expect(found).toHaveLength(1);
    expect(found[0].chargingSchedule).toHaveLength(1);
    expect(found[0].chargingSchedule[0].id).toBe(9);
  });

  it('readHighestStackLevelTxProfile takes the top stack level and ignores isActive', async () => {
    await aStation();
    const { tx } = await anActiveTxOnEvse(1);
    await aProfileRow({
      id: 1,
      stackLevel: 1,
      chargingProfilePurpose: 'TxProfile',
      isActive: true,
      transactionDatabaseId: tx.id,
    });
    const top = await aProfileRow({
      id: 2,
      stackLevel: 5,
      chargingProfilePurpose: 'TxProfile',
      isActive: false,
      transactionDatabaseId: tx.id,
    });

    const found = await profileRepo().readHighestStackLevelTxProfile(TENANT_A, STATION, tx.id);

    expect(found?.databaseId).toBe(top.databaseId);
    expect(found?.stackLevel).toBe(5);
  });

  it('readHighestStackLevelTxProfile returns undefined when the station has no TxProfile', async () => {
    await aStation();
    await aProfileRow({ id: 1, chargingProfilePurpose: 'TxDefaultProfile' });

    expect(
      await profileRepo().readHighestStackLevelTxProfile(TENANT_A, STATION, null),
    ).toBeUndefined();
  });
});

describe('DrizzleChargingProfileRepository.deactivateChargingProfiles', () => {
  it('deactivates every active profile on the station when given no criteria', async () => {
    await aStation();
    await aStation(OTHER_STATION);
    await aProfileRow({ id: 1, isActive: true });
    await aProfileRow({ id: 2, isActive: true });
    await aProfileRow({ id: 3, isActive: true, ocppConnectionName: OTHER_STATION });

    const count = await profileRepo().deactivateChargingProfiles(TENANT_A, STATION, {});

    expect(count).toBe(2);
    expect(await ChargingProfile.count({ where: { isActive: true } })).toBe(1);
  });

  it('spares the profile the station just accepted', async () => {
    await aStation();
    await aProfileRow({ id: 1, isActive: true, stackLevel: 2 });
    const kept = await aProfileRow({ id: 2, isActive: true, stackLevel: 2 });

    const count = await profileRepo().deactivateChargingProfiles(TENANT_A, STATION, {
      stackLevel: 2,
      excludeChargingProfileId: 2,
    });

    expect(count).toBe(1);
    expect((await ChargingProfile.findByPk(kept.databaseId))!.get('isActive')).toBe(true);
  });

  // ChargingProfiles is keyed on databaseId while `id` holds the OCPP profile id, so
  // the two are seeded crossed over: keying on the wrong column clears the other row.
  it('matches the OCPP id, not the primary key', async () => {
    await aStation();
    const first = await aProfileRow({ id: 2, isActive: true });
    const second = await aProfileRow({ id: 1, isActive: true });
    expect(first.databaseId).toBe(1);
    expect(second.databaseId).toBe(2);

    const count = await profileRepo().deactivateChargingProfiles(TENANT_A, STATION, {
      chargingProfileId: 1,
    });

    expect(count).toBe(1);
    expect((await ChargingProfile.findByPk(second.databaseId))!.get('isActive')).toBe(false);
    expect((await ChargingProfile.findByPk(first.databaseId))!.get('isActive')).toBe(true);
  });

  it('filters on the charging limit source', async () => {
    await aStation();
    await aProfileRow({ id: 1, isActive: true, chargingLimitSource: 'CSO' });
    await aProfileRow({ id: 2, isActive: true, chargingLimitSource: 'EMS' });

    const count = await profileRepo().deactivateChargingProfiles(TENANT_A, STATION, {
      chargingLimitSource: 'CSO',
    });

    expect(count).toBe(1);
  });
});

describe('DrizzleChargingScheduleRepository next-value helpers', () => {
  it('getNextChargingScheduleId counts schedules for the station', async () => {
    await aStation();
    const repo = scheduleRepo();
    expect(await repo.getNextChargingScheduleId(TENANT_A, STATION)).toBe(1);

    const profile = await aProfileRow({ id: 1 });
    await ChargingSchedule.create({
      tenantId: TENANT_A,
      ocppConnectionName: STATION,
      chargingProfileDatabaseId: profile.databaseId,
      id: 6,
      chargingRateUnit: 'W',
      chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000 }],
    } as any);
    expect(await repo.getNextChargingScheduleId(TENANT_A, STATION)).toBe(7);
  });
});

describe('DrizzleChargingProfileRepository next-value helpers', () => {
  it('getNextChargingProfileId starts at 1 and then follows the highest stored id', async () => {
    await aStation();
    const repo = profileRepo();
    expect(await repo.getNextChargingProfileId(TENANT_A, STATION)).toBe(1);

    await aProfileRow({ id: 4 });
    expect(await repo.getNextChargingProfileId(TENANT_A, STATION)).toBe(5);
  });

  it('getNextStackLevel starts at 0 and then follows the highest stored level', async () => {
    await aStation();
    const repo = profileRepo();
    expect(await repo.getNextStackLevel(TENANT_A, STATION, null, 'TxProfile')).toBe(0);

    await aProfileRow({ id: 1, stackLevel: 2, chargingProfilePurpose: 'TxProfile' });
    expect(await repo.getNextStackLevel(TENANT_A, STATION, null, 'TxProfile')).toBe(3);
    // A different purpose has its own ladder.
    expect(await repo.getNextStackLevel(TENANT_A, STATION, null, 'TxDefaultProfile')).toBe(0);
  });
});

describe('DrizzleChargingNeedsRepository', () => {
  function needsRepo() {
    return new DrizzleChargingNeedsRepository(deps());
  }

  it('stores the needs against the active transaction on the reported evse', async () => {
    await aStation();
    const { evse, tx } = await anActiveTxOnEvse(1);

    const saved = await needsRepo().createChargingNeeds(TENANT_A, aNeedsRequest(1), STATION);

    expect(saved.evseId).toBe(evse.id);
    expect(saved.transactionDatabaseId).toBe(tx.id);
    expect(saved.maxScheduleTuples).toBe(4);
    expect(saved.requestedEnergyTransfer).toBe('DC');
    expect(await ChargingNeeds.count()).toBe(1);
  });

  it('throws when the station has no active transaction on that evse', async () => {
    await aStation();
    await anActiveTxOnEvse(1);

    await expect(
      needsRepo().createChargingNeeds(TENANT_A, aNeedsRequest(2), STATION),
    ).rejects.toThrow(/No active transaction found/);
  });

  it('throws for an unknown connection name', async () => {
    await expect(
      needsRepo().createChargingNeeds(TENANT_A, aNeedsRequest(1), 'NOT-A-STATION'),
    ).rejects.toThrow(/no charging station named/);
  });

  it('findChargingNeedsByEvseDBIdAndTransactionDBId returns the most recent row', async () => {
    await aStation();
    const { evse, tx } = await anActiveTxOnEvse(1);
    await ChargingNeeds.create({
      tenantId: TENANT_A,
      evseId: evse.id,
      transactionDatabaseId: tx.id,
      requestedEnergyTransfer: 'AC_single_phase',
      transactionCreatedAt: tx.createdAt,
      createdAt: new Date('2025-06-01T10:00:00.000Z'),
    } as any);
    await ChargingNeeds.create({
      tenantId: TENANT_A,
      evseId: evse.id,
      transactionDatabaseId: tx.id,
      requestedEnergyTransfer: 'DC',
      transactionCreatedAt: tx.createdAt,
      createdAt: new Date('2025-06-01T11:00:00.000Z'),
    } as any);

    const found = await needsRepo().findChargingNeedsByEvseDBIdAndTransactionDBId(
      TENANT_A,
      evse.id,
      tx.id,
    );

    expect(found?.requestedEnergyTransfer).toBe('DC');
  });
});

describe('DrizzleCompositeScheduleRepository', () => {
  function compositeRepo() {
    return new DrizzleCompositeScheduleRepository(deps());
  }

  it('stores a whole-station schedule without an evse association', async () => {
    await aStation();

    const saved = await compositeRepo().createCompositeSchedule(
      TENANT_A,
      aCompositeInput({ evseId: 0 }),
      STATION,
    );

    expect(saved.evseId ?? null).toBeNull();
    expect(saved.duration).toBe(3600);
    expect(await CompositeSchedule.count()).toBe(1);
  });

  it('resolves the reported evse number to the stored evse row', async () => {
    await aStation();
    const { evse } = await anActiveTxOnEvse(2);

    const saved = await compositeRepo().createCompositeSchedule(
      TENANT_A,
      aCompositeInput({ evseId: 2 }),
      STATION,
    );

    expect(saved.evseId).toBe(evse.id);
  });

  it('stores the schedule without an evse when the station has no such evse', async () => {
    await aStation();

    const saved = await compositeRepo().createCompositeSchedule(
      TENANT_A,
      aCompositeInput({ evseId: 9 }),
      STATION,
    );

    expect(saved.evseId ?? null).toBeNull();
    expect(await CompositeSchedule.count()).toBe(1);
  });
});
