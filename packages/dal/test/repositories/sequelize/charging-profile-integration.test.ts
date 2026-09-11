// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { OCPP2_0_1, type SystemConfig } from '@citrineos/types';
import {
  ChargingNeeds,
  ChargingProfile,
  ChargingSchedule,
  ChargingStation,
  Evse,
  SequelizeChargingProfileRepository,
  Transaction,
} from '../../../index.js';
import { CompositeSchedule } from '@dal/models/charging-profile/composite-schedule.js';
import { SalesTariff } from '@dal/models/charging-profile/sales-tariff.js';
import type {
  ChargingProfileInput,
  ChargingScheduleInput,
  CompositeScheduleInput,
} from '@dal/mappers/2.0.1/charging-profile-mapper.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// SequelizeChargingProfileRepository backs the SetChargingProfile, ClearChargingProfile,
// GetCompositeSchedule and NotifyEVChargingNeeds flows. Profiles are unique per
// (ocppConnectionName, tenantId, id); schedule and sales tariff rows hang off the profile.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'cp001';
const OTHER_STATION = 'cp002';

let h: PgHarness;

beforeAll(async () => {
  h = await startPgHarness();
}, 90_000);

afterAll(async () => {
  await h.stop();
});

beforeEach(async () => {
  await resetDb(h);
});

function makeRepo(): SequelizeChargingProfileRepository {
  return new SequelizeChargingProfileRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
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
  const evse = await Evse.create({
    tenantId: TENANT_A,
    ocppConnectionName: STATION,
    evseTypeId,
  } as any);
  const tx = await Transaction.create({
    tenantId: TENANT_A,
    ocppConnectionName: STATION,
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

describe('SequelizeChargingProfileRepository', () => {
  describe('createOrUpdateChargingProfile', () => {
    it('creates the profile with its schedule rows and CSO/inactive defaults', async () => {
      const saved = await makeRepo().createOrUpdateChargingProfile(
        TENANT_A,
        aProfileInput({
          id: 3,
          stackLevel: 2,
          chargingSchedule: [
            aScheduleInput({ id: 1 }),
            aScheduleInput({ id: 2, chargingRateUnit: 'A' }),
          ],
        }),
        STATION,
      );

      expect(saved.databaseId).toBeGreaterThan(0);
      expect(saved.id).toBe(3);
      expect(saved.ocppConnectionName).toBe(STATION);
      expect(saved.tenantId).toBe(TENANT_A);
      expect(saved.stackLevel).toBe(2);
      expect(saved.chargingProfilePurpose).toBe('TxDefaultProfile');
      expect(saved.chargingProfileKind).toBe('Absolute');
      expect(saved.isActive).toBe(false);
      expect(saved.chargingLimitSource).toBe('CSO');
      expect(saved.transactionDatabaseId ?? null).toBeNull();

      const schedules = await ChargingSchedule.findAll({ order: [['id', 'ASC']] });
      expect(schedules).toHaveLength(2);
      expect(schedules[0].id).toBe(1);
      expect(schedules[0].chargingProfileDatabaseId).toBe(saved.databaseId);
      expect(schedules[0].ocppConnectionName).toBe(STATION);
      expect(schedules[0].tenantId).toBe(TENANT_A);
      expect(schedules[0].chargingRateUnit).toBe('W');
      expect(schedules[0].chargingSchedulePeriod).toEqual([{ startPeriod: 0, limit: 11000 }]);
      expect(schedules[1].id).toBe(2);
      expect(schedules[1].chargingRateUnit).toBe('A');
    });

    it('stores explicit evseId, chargingLimitSource and isActive', async () => {
      const saved = await makeRepo().createOrUpdateChargingProfile(
        TENANT_A,
        aProfileInput(),
        STATION,
        1,
        'EMS',
        true,
      );

      expect(saved.evseId).toBe(1);
      expect(saved.chargingLimitSource).toBe('EMS');
      expect(saved.isActive).toBe(true);
    });

    it('persists the sales tariff attached to a schedule', async () => {
      await makeRepo().createOrUpdateChargingProfile(
        TENANT_A,
        aProfileInput({
          chargingSchedule: [
            aScheduleInput({
              salesTariff: {
                id: 9,
                salesTariffDescription: 'peak',
                salesTariffEntry: [{ relativeTimeInterval: { start: 0 } }],
              },
            }),
          ],
        }),
        STATION,
      );

      const schedule = await ChargingSchedule.findOne();
      const tariffs = await SalesTariff.findAll();
      expect(tariffs).toHaveLength(1);
      expect(tariffs[0].id).toBe(9);
      expect(tariffs[0].salesTariffDescription).toBe('peak');
      expect(tariffs[0].chargingScheduleDatabaseId).toBe(schedule!.databaseId);
      expect(tariffs[0].tenantId).toBe(TENANT_A);
    });

    it('links the profile to the station transaction named by transactionId', async () => {
      await aStation();
      const tx = await Transaction.create({
        tenantId: TENANT_A,
        ocppConnectionName: STATION,
        transactionId: 'tx-100',
        isActive: true,
      } as any);

      const saved = await makeRepo().createOrUpdateChargingProfile(
        TENANT_A,
        aProfileInput({ transactionId: 'tx-100' }),
        STATION,
      );

      expect(saved.transactionDatabaseId).toBe(tx.id);
    });

    it('leaves transactionDatabaseId empty when the transactionId matches nothing', async () => {
      const saved = await makeRepo().createOrUpdateChargingProfile(
        TENANT_A,
        aProfileInput({ transactionId: 'tx-missing' }),
        STATION,
      );

      expect(saved.transactionDatabaseId ?? null).toBeNull();
    });

    it('resubmitting the same station profile id updates the row and replaces its schedules', async () => {
      const repo = makeRepo();
      await repo.createOrUpdateChargingProfile(
        TENANT_A,
        aProfileInput({
          id: 5,
          stackLevel: 1,
          chargingSchedule: [
            aScheduleInput({
              id: 1,
              salesTariff: { id: 4, salesTariffEntry: [{ relativeTimeInterval: { start: 0 } }] },
            }),
            aScheduleInput({ id: 2 }),
          ],
        }),
        STATION,
      );

      await repo.createOrUpdateChargingProfile(
        TENANT_A,
        aProfileInput({
          id: 5,
          stackLevel: 7,
          chargingProfileKind: 'Relative',
          chargingSchedule: [aScheduleInput({ id: 8, chargingRateUnit: 'A' })],
        }),
        STATION,
        null,
        'EMS',
        true,
      );

      expect(await ChargingProfile.count()).toBe(1);
      const row = await ChargingProfile.findOne({ where: { ocppConnectionName: STATION, id: 5 } });
      expect(row!.stackLevel).toBe(7);
      expect(row!.chargingProfileKind).toBe('Relative');
      expect(row!.chargingLimitSource).toBe('EMS');
      expect(row!.isActive).toBe(true);

      const schedules = await ChargingSchedule.findAll();
      expect(schedules).toHaveLength(1);
      expect(schedules[0].id).toBe(8);
      expect(schedules[0].chargingRateUnit).toBe('A');
      expect(await SalesTariff.count()).toBe(0);
    });
  });

  // Mirrors the ClearChargingProfileResponse handlers, which deactivate via updateAllByQuery.
  describe('deactivate by query', () => {
    it('flips isActive only for the named station within the tenant', async () => {
      await aProfileRow({ id: 1, isActive: true });
      await aProfileRow({ id: 2, ocppConnectionName: OTHER_STATION, isActive: true });
      await aProfileRow({ id: 1, tenantId: TENANT_B, isActive: true });

      const updated = await makeRepo().updateAllByQuery(
        TENANT_A,
        { isActive: false } as Partial<ChargingProfile>,
        {
          where: { tenantId: TENANT_A, ocppConnectionName: STATION, isActive: true },
          returning: false,
        },
      );

      expect(updated).toHaveLength(1);
      expect(updated[0].isActive).toBe(false);

      const rows = await ChargingProfile.findAll({ order: [['databaseId', 'ASC']] });
      expect(rows.map((r) => [r.tenantId, r.ocppConnectionName, r.isActive])).toEqual([
        [TENANT_A, STATION, false],
        [TENANT_A, OTHER_STATION, true],
        [TENANT_B, STATION, true],
      ]);
    });

    it("updates nothing under a tenant that does not own the station's profiles", async () => {
      const profile = await aProfileRow({ isActive: true });

      const updated = await makeRepo().updateAllByQuery(
        TENANT_B,
        { isActive: false } as Partial<ChargingProfile>,
        { where: { ocppConnectionName: STATION, isActive: true } },
      );

      expect(updated).toHaveLength(0);
      expect((await ChargingProfile.findByPk(profile.databaseId))!.isActive).toBe(true);
    });
  });

  describe('id generation', () => {
    it('getNextChargingProfileId starts at 1 and advances past the station max', async () => {
      const repo = makeRepo();
      expect(await repo.getNextChargingProfileId(TENANT_A, STATION)).toBe(1);

      await aProfileRow({ id: 5 });
      await aProfileRow({ id: 9 });

      expect(await repo.getNextChargingProfileId(TENANT_A, STATION)).toBe(10);
      expect(await repo.getNextChargingProfileId(TENANT_A, OTHER_STATION)).toBe(1);
    });

    it('getNextChargingScheduleId advances past the station schedule max', async () => {
      const repo = makeRepo();
      expect(await repo.getNextChargingScheduleId(TENANT_A, STATION)).toBe(1);

      await ChargingSchedule.create({
        tenantId: TENANT_A,
        ocppConnectionName: STATION,
        id: 7,
        chargingRateUnit: 'W',
        chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
      } as any);

      expect(await repo.getNextChargingScheduleId(TENANT_A, STATION)).toBe(8);
      expect(await repo.getNextChargingScheduleId(TENANT_A, OTHER_STATION)).toBe(1);
    });

    it('getNextStackLevel starts at 0 and is scoped to the profile purpose', async () => {
      const repo = makeRepo();
      expect(await repo.getNextStackLevel(TENANT_A, STATION, null, 'TxDefaultProfile')).toBe(0);

      await aProfileRow({ id: 1, stackLevel: 3 });

      expect(await repo.getNextStackLevel(TENANT_A, STATION, null, 'TxDefaultProfile')).toBe(4);
      expect(await repo.getNextStackLevel(TENANT_A, STATION, null, 'TxProfile')).toBe(0);
    });
  });

  describe('createCompositeSchedule', () => {
    it('stores a whole-station schedule (evseId 0) without an EVSE association', async () => {
      const saved = await makeRepo().createCompositeSchedule(TENANT_A, aCompositeInput(), STATION);

      expect(saved.ocppConnectionName).toBe(STATION);
      expect(saved.tenantId).toBe(TENANT_A);
      expect(saved.evseId ?? null).toBeNull();
      expect(saved.duration).toBe(3600);
      expect(saved.chargingRateUnit).toBe('W');
      expect(saved.scheduleStart).toBe('2025-06-01T10:00:00.000Z');
      expect(saved.chargingSchedulePeriod).toEqual([{ startPeriod: 0, limit: 7400 }]);
      expect(await CompositeSchedule.count()).toBe(1);
    });

    it('resolves a reported evseId to the station EVSE row primary key', async () => {
      await aStation();
      const evse = await Evse.create({
        tenantId: TENANT_A,
        ocppConnectionName: STATION,
        evseTypeId: 2,
      } as any);

      const saved = await makeRepo().createCompositeSchedule(
        TENANT_A,
        aCompositeInput({ evseId: 2 }),
        STATION,
      );

      // Stored id is the Evse PK, not the OCPP evse id from the request.
      expect(evse.id).not.toBe(2);
      expect(saved.evseId).toBe(evse.id);
    });

    it('stores null when the reported EVSE only exists for another tenant', async () => {
      await Evse.create({
        tenantId: TENANT_B,
        ocppConnectionName: STATION,
        evseTypeId: 2,
      } as any);

      const saved = await makeRepo().createCompositeSchedule(
        TENANT_A,
        aCompositeInput({ evseId: 2 }),
        STATION,
      );

      expect(saved.evseId ?? null).toBeNull();
      expect((await CompositeSchedule.findAll())[0].evseId).toBeNull();
    });
  });

  describe('createChargingNeeds', () => {
    it('persists needs against the active transaction on the EVSE', async () => {
      await aStation();
      const { evse, tx } = await anActiveTxOnEvse(1);

      const saved = await makeRepo().createChargingNeeds(TENANT_A, aNeedsRequest(1), STATION);

      expect(saved.evseId).toBe(evse.id);
      expect(saved.transactionDatabaseId).toBe(tx.id);
      expect(saved.requestedEnergyTransfer).toBe('DC');
      expect(saved.maxScheduleTuples).toBe(4);
      expect(saved.tenantId).toBe(TENANT_A);

      const row = await ChargingNeeds.findByPk(saved.id);
      expect(row!.departureTime).toBe('2025-06-01T18:00:00.000Z');
      // Denormalised from the transaction so needs rows can be read without a join.
      expect(row!.transactionCreatedAt?.getTime()).toBe((tx.createdAt as Date).getTime());
    });

    it('throws when the station has no active transaction on the EVSE', async () => {
      await expect(
        makeRepo().createChargingNeeds(TENANT_A, aNeedsRequest(1), STATION),
      ).rejects.toThrow('No active transaction found on station cp001 evse 1');
    });

    it('ignores an inactive transaction on the EVSE', async () => {
      await aStation();
      await anActiveTxOnEvse(1, { isActive: false });

      await expect(
        makeRepo().createChargingNeeds(TENANT_A, aNeedsRequest(1), STATION),
      ).rejects.toThrow(/No active transaction found/);
    });
  });

  describe('findChargingNeedsByEvseDBIdAndTransactionDBId', () => {
    it('returns the newest needs row for the evse and transaction', async () => {
      await aStation();
      const { evse, tx } = await anActiveTxOnEvse(1);
      await ChargingNeeds.create({
        tenantId: TENANT_A,
        evseId: evse.id,
        transactionDatabaseId: tx.id,
        requestedEnergyTransfer: 'AC_single_phase',
        createdAt: new Date('2025-01-01T00:00:00Z'),
      } as any);
      const newer = await ChargingNeeds.create({
        tenantId: TENANT_A,
        evseId: evse.id,
        transactionDatabaseId: tx.id,
        requestedEnergyTransfer: 'DC',
        createdAt: new Date('2025-02-01T00:00:00Z'),
      } as any);

      const found = await makeRepo().findChargingNeedsByEvseDBIdAndTransactionDBId(
        TENANT_A,
        evse.id,
        tx.id,
      );

      expect(found).toBeDefined();
      expect(found!.id).toBe(newer.id);
      expect(found!.requestedEnergyTransfer).toBe('DC');
    });

    it('returns undefined for a miss or a foreign tenant', async () => {
      await aStation();
      const { evse, tx } = await anActiveTxOnEvse(1);
      await ChargingNeeds.create({
        tenantId: TENANT_A,
        evseId: evse.id,
        transactionDatabaseId: tx.id,
        requestedEnergyTransfer: 'DC',
      } as any);
      const repo = makeRepo();

      expect(
        await repo.findChargingNeedsByEvseDBIdAndTransactionDBId(TENANT_B, evse.id, tx.id),
      ).toBeUndefined();
      expect(
        await repo.findChargingNeedsByEvseDBIdAndTransactionDBId(TENANT_A, evse.id + 1, tx.id),
      ).toBeUndefined();
    });
  });

  describe('tenant scoping', () => {
    it('readAllByQuery and readByKey do not cross tenants', async () => {
      const profile = await aProfileRow();
      const repo = makeRepo();

      expect(
        await repo.readAllByQuery(TENANT_B, { where: { ocppConnectionName: STATION } }),
      ).toHaveLength(0);
      expect(await repo.readByKey(TENANT_B, profile.databaseId)).toBeUndefined();
      expect(
        await repo.readAllByQuery(TENANT_A, { where: { ocppConnectionName: STATION } }),
      ).toHaveLength(1);
    });

    it('two tenants hold the same station profile id independently', async () => {
      const repo = makeRepo();
      const forA = await repo.createOrUpdateChargingProfile(
        TENANT_A,
        aProfileInput({ id: 7 }),
        STATION,
      );
      const forB = await repo.createOrUpdateChargingProfile(
        TENANT_B,
        aProfileInput({ id: 7, stackLevel: 5 }),
        STATION,
      );

      expect(forA.tenantId).toBe(TENANT_A);
      expect(forB.tenantId).toBe(TENANT_B);
      expect(forB.stackLevel).toBe(5);
      expect(forA.databaseId).not.toBe(forB.databaseId);
      expect(await ChargingProfile.count()).toBe(2);
    });
  });

  describe('uniqueness', () => {
    it('rejects a duplicate (station, id) pair within a tenant', async () => {
      await aProfileRow({ id: 4 });

      await expect(aProfileRow({ id: 4 })).rejects.toMatchObject({
        name: 'SequelizeUniqueConstraintError',
      });
      expect(await ChargingProfile.count()).toBe(1);
    });
  });
});
