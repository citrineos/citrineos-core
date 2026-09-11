// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { SystemConfig, TariffDto } from '@citrineos/types';
import { type ILogObj, Logger } from 'tslog';
import {
  ChargingStation,
  Connector,
  DrizzleAuthorizationRepository,
  DrizzleBootRepository,
  DrizzleCertificateRepository,
  DrizzleChargingStationRepository,
  DrizzleDeleteCertificateAttemptRepository,
  DrizzleInstallCertificateAttemptRepository,
  DrizzleInstalledCertificateRepository,
  DrizzleReservationRepository,
  DrizzleSecurityEventRepository,
  DrizzleServerNetworkProfileRepository,
  DrizzleSubscriptionRepository,
  DrizzleTariffRepository,
  DrizzleTenantRepository,
  Evse,
  RepositoryStore,
  SequelizeAuthorizationRepository,
  SequelizeBootRepository,
  SequelizeCertificateRepository,
  SequelizeChangeConfigurationRepository,
  SequelizeChargingProfileRepository,
  SequelizeChargingStationSequenceRepository,
  SequelizeComponentRepository,
  SequelizeDeleteCertificateAttemptRepository,
  SequelizeDeviceModelRepository,
  SequelizeInstallCertificateAttemptRepository,
  SequelizeInstalledCertificateRepository,
  SequelizeLocalAuthListRepository,
  SequelizeLocationRepository,
  SequelizeMessageInfoRepository,
  SequelizeOCPPMessageRepository,
  SequelizeReservationRepository,
  SequelizeSecurityEventRepository,
  SequelizeServerNetworkProfileRepository,
  SequelizeSubscriptionRepository,
  SequelizeTariffRepository,
  SequelizeTenantRepository,
  SequelizeTransactionEventRepository,
  SequelizeVariableMonitoringRepository,
  Tariff,
} from '../../../index.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// RepositoryStore builds one repository per interface from a single config,
// logger and sequelize instance. CITRINEOS_USE_DRIZZLE=true swaps thirteen of
// them to Drizzle implementations; those only build a lazy pg pool from config
// at construction, so both branches are covered here.
// SequelizeTariffRepository adds connector lookup, two upsert flavors and
// querystring read/delete on top of the tenant-scoped base repository. Its
// upsert entry points take a TariffDto (a plain object), not a Tariff model.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION_NAME = 'CS-TARIFF';
const TS = '2026-01-05T10:00:00.000Z';

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

function makeStore(): RepositoryStore {
  return new RepositoryStore({
    config: h.config,
    logger: new Logger<ILogObj>({ minLevel: 6 }),
    sequelizeInstance: h.sequelizeInstance,
  });
}

function makeRepo(): SequelizeTariffRepository {
  return new SequelizeTariffRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

function aTariffDto(overrides: Partial<TariffDto> = {}): TariffDto {
  return { currency: 'EUR', pricePerKwh: 0.3, tenantId: TENANT_A, ...overrides };
}

async function aTariff(overrides: Record<string, unknown> = {}): Promise<Tariff> {
  return Tariff.create({
    currency: 'EUR',
    pricePerKwh: 0.3,
    tenantId: TENANT_A,
    ...overrides,
  } as any);
}

// Evse/Connector resolve their stationId FK from ocppConnectionName in a
// BeforeCreate hook, so the station is commissioned first.
async function aConnector(tariffId: number | null): Promise<Connector> {
  await ChargingStation.create({
    ocppConnectionName: STATION_NAME,
    isOnline: false,
    tenantId: TENANT_A,
  } as any);
  const evse = await Evse.create({
    tenantId: TENANT_A,
    ocppConnectionName: STATION_NAME,
    evseTypeId: 1,
  } as any);
  return Connector.create({
    tenantId: TENANT_A,
    ocppConnectionName: STATION_NAME,
    evseId: evse.id,
    connectorId: 1,
    evseTypeConnectorId: 1,
    status: 'Available',
    timestamp: TS,
    tariffId,
  } as any);
}

function withDrizzleEnv(value: string | undefined, fn: () => void): void {
  const prev = process.env.CITRINEOS_USE_DRIZZLE;
  if (value === undefined) {
    delete process.env.CITRINEOS_USE_DRIZZLE;
  } else {
    process.env.CITRINEOS_USE_DRIZZLE = value;
  }
  try {
    fn();
  } finally {
    if (prev === undefined) {
      delete process.env.CITRINEOS_USE_DRIZZLE;
    } else {
      process.env.CITRINEOS_USE_DRIZZLE = prev;
    }
  }
}

describe('RepositoryStore', () => {
  it('keeps the provided sequelize instance and wires the always-sequelize repositories', () => {
    const store = makeStore();

    expect(store.sequelizeInstance).toBe(h.sequelizeInstance);
    expect(store.changeConfigurationRepository).toBeInstanceOf(
      SequelizeChangeConfigurationRepository,
    );
    expect(store.chargingProfileRepository).toBeInstanceOf(SequelizeChargingProfileRepository);
    expect(store.chargingStationSequenceRepository).toBeInstanceOf(
      SequelizeChargingStationSequenceRepository,
    );
    expect(store.componentRepository).toBeInstanceOf(SequelizeComponentRepository);
    expect(store.deviceModelRepository).toBeInstanceOf(SequelizeDeviceModelRepository);
    expect(store.localAuthListRepository).toBeInstanceOf(SequelizeLocalAuthListRepository);
    expect(store.locationRepository).toBeInstanceOf(SequelizeLocationRepository);
    expect(store.messageInfoRepository).toBeInstanceOf(SequelizeMessageInfoRepository);
    expect(store.ocppMessageRepository).toBeInstanceOf(SequelizeOCPPMessageRepository);
    expect(store.transactionEventRepository).toBeInstanceOf(SequelizeTransactionEventRepository);
    expect(store.variableMonitoringRepository).toBeInstanceOf(
      SequelizeVariableMonitoringRepository,
    );
  });

  it('wires the switchable repositories to sequelize implementations by default', () => {
    withDrizzleEnv(undefined, () => {
      const store = makeStore();

      expect(store.authorizationRepository).toBeInstanceOf(SequelizeAuthorizationRepository);
      expect(store.bootRepository).toBeInstanceOf(SequelizeBootRepository);
      expect(store.certificateRepository).toBeInstanceOf(SequelizeCertificateRepository);
      expect(store.deleteCertificateAttemptRepository).toBeInstanceOf(
        SequelizeDeleteCertificateAttemptRepository,
      );
      expect(store.installCertificateAttemptRepository).toBeInstanceOf(
        SequelizeInstallCertificateAttemptRepository,
      );
      expect(store.installedCertificateRepository).toBeInstanceOf(
        SequelizeInstalledCertificateRepository,
      );
      expect(store.reservationRepository).toBeInstanceOf(SequelizeReservationRepository);
      expect(store.securityEventRepository).toBeInstanceOf(SequelizeSecurityEventRepository);
      expect(store.subscriptionRepository).toBeInstanceOf(SequelizeSubscriptionRepository);
      expect(store.tariffRepository).toBeInstanceOf(SequelizeTariffRepository);
      expect(store.tenantRepository).toBeInstanceOf(SequelizeTenantRepository);
      expect(store.serverNetworkProfileRepository).toBeInstanceOf(
        SequelizeServerNetworkProfileRepository,
      );
    });
  });

  // Outside the drizzle branch the station reads are served by the Location
  // aggregate itself rather than a separate instance.
  it('aliases chargingStationRepository onto the location repository by default', () => {
    withDrizzleEnv(undefined, () => {
      const store = makeStore();

      expect(store.chargingStationRepository).toBe(store.locationRepository);
    });
  });

  it('wires the switchable repositories to drizzle implementations when CITRINEOS_USE_DRIZZLE=true', () => {
    withDrizzleEnv('true', () => {
      const store = makeStore();

      expect(store.authorizationRepository).toBeInstanceOf(DrizzleAuthorizationRepository);
      expect(store.bootRepository).toBeInstanceOf(DrizzleBootRepository);
      expect(store.certificateRepository).toBeInstanceOf(DrizzleCertificateRepository);
      expect(store.chargingStationRepository).toBeInstanceOf(DrizzleChargingStationRepository);
      expect(store.deleteCertificateAttemptRepository).toBeInstanceOf(
        DrizzleDeleteCertificateAttemptRepository,
      );
      expect(store.installCertificateAttemptRepository).toBeInstanceOf(
        DrizzleInstallCertificateAttemptRepository,
      );
      expect(store.installedCertificateRepository).toBeInstanceOf(
        DrizzleInstalledCertificateRepository,
      );
      expect(store.reservationRepository).toBeInstanceOf(DrizzleReservationRepository);
      expect(store.securityEventRepository).toBeInstanceOf(DrizzleSecurityEventRepository);
      expect(store.subscriptionRepository).toBeInstanceOf(DrizzleSubscriptionRepository);
      expect(store.tariffRepository).toBeInstanceOf(DrizzleTariffRepository);
      expect(store.tenantRepository).toBeInstanceOf(DrizzleTenantRepository);
      expect(store.serverNetworkProfileRepository).toBeInstanceOf(
        DrizzleServerNetworkProfileRepository,
      );
      // Non-switchable repositories stay on sequelize even in drizzle mode.
      expect(store.locationRepository).toBeInstanceOf(SequelizeLocationRepository);
      expect(store.transactionEventRepository).toBeInstanceOf(SequelizeTransactionEventRepository);
      expect(store.deviceModelRepository).toBeInstanceOf(SequelizeDeviceModelRepository);
    });
  });

  it('any value other than "true" keeps the sequelize branch', () => {
    withDrizzleEnv('TRUE', () => {
      const store = makeStore();

      expect(store.authorizationRepository).toBeInstanceOf(SequelizeAuthorizationRepository);
      expect(store.tenantRepository).toBeInstanceOf(SequelizeTenantRepository);
    });
  });

  it('store repositories read and write through the shared database', async () => {
    const store = makeStore();

    const created = await store.tariffRepository.upsertTariffByTariffId(
      TENANT_A,
      aTariffDto({ tariffId: 'STORE-SMOKE', pricePerKwh: 0.42 }),
    );

    const rows = await store.tariffRepository.readAllByQuerystring(TENANT_A, {
      tenantId: TENANT_A,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(created.id);
    expect(rows[0].tariffId).toBe('STORE-SMOKE');
    expect(rows[0].currency).toBe('EUR');
    expect(rows[0].pricePerKwh).toBe(0.42);
    expect(rows[0].tenantId).toBe(TENANT_A);
  });
});

describe('SequelizeTariffRepository', () => {
  describe('findByConnectorId', () => {
    it('returns the tariff linked to the connector', async () => {
      const tariff = await aTariff({ currency: 'GBP', pricePerKwh: 0.45, tariffId: 'conn-tariff' });
      const connector = await aConnector(tariff.id);

      const found = await makeRepo().findByConnectorId(TENANT_A, connector.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(tariff.id);
      expect(found!.currency).toBe('GBP');
      expect(found!.pricePerKwh).toBe(0.45);
      expect(found!.tariffId).toBe('conn-tariff');
    });

    it('returns undefined for a connector without a tariff', async () => {
      await aTariff();
      const connector = await aConnector(null);

      const found = await makeRepo().findByConnectorId(TENANT_A, connector.id);

      expect(found).toBeUndefined();
    });

    it("does not surface another tenant's tariff", async () => {
      const tariff = await aTariff({ tenantId: TENANT_A });
      const connector = await aConnector(tariff.id);

      const found = await makeRepo().findByConnectorId(TENANT_B, connector.id);

      expect(found).toBeUndefined();
    });
  });

  describe('upsertTariff', () => {
    it('inserts a new row for a dto without id', async () => {
      const created = await makeRepo().upsertTariff(TENANT_A, aTariffDto({ pricePerKwh: 0.2 }));

      expect(created.id).toBeGreaterThan(0);
      expect(created.currency).toBe('EUR');
      expect(created.tenantId).toBe(TENANT_A);
      expect(await Tariff.count()).toBe(1);
    });

    it('inserts a new row when the id is not present for the tenant', async () => {
      const created = await makeRepo().upsertTariff(
        TENANT_A,
        aTariffDto({ id: 4242, pricePerKwh: 0.2 }),
      );

      expect(created.id).toBe(4242);
      expect(created.currency).toBe('EUR');
      expect(created.tenantId).toBe(TENANT_A);
      expect(await Tariff.count()).toBe(1);
    });

    it('updates the existing row in place when the id matches', async () => {
      const existing = await aTariff({ currency: 'EUR', pricePerKwh: 0.3 });

      const updated = await makeRepo().upsertTariff(
        TENANT_A,
        aTariffDto({
          id: existing.id,
          currency: 'USD',
          pricePerKwh: 0.99,
          pricePerMin: 1.5,
          pricePerSession: 2.5,
          authorizationAmount: 3,
          paymentFee: 0.1,
          taxRate: 19,
        }),
      );

      expect(updated.id).toBe(existing.id);
      expect(updated.currency).toBe('USD');
      expect(updated.pricePerKwh).toBe(0.99);
      expect(updated.pricePerMin).toBe(1.5);
      expect(updated.taxRate).toBe(19);
      expect(await Tariff.count()).toBe(1);

      const row = await Tariff.findByPk(existing.id);
      expect(row!.currency).toBe('USD');
      expect(row!.pricePerSession).toBe(2.5);
    });

    it('stores the tenant id passed to the call, not the one on the dto', async () => {
      const created = await makeRepo().upsertTariff(
        TENANT_A,
        aTariffDto({ id: 77, currency: 'SEK', pricePerKwh: 1, tenantId: TENANT_B }),
      );

      expect(created.tenantId).toBe(TENANT_A);
      expect((await Tariff.findByPk(77))!.tenantId).toBe(TENANT_A);
    });

    it("cannot take over another tenant's row: the insert collides on the primary key", async () => {
      const foreign = await aTariff({ tenantId: TENANT_B, currency: 'USD' });

      await expect(
        makeRepo().upsertTariff(TENANT_A, aTariffDto({ id: foreign.id, pricePerKwh: 0.5 })),
      ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });

      const row = await Tariff.findByPk(foreign.id);
      expect(row!.currency).toBe('USD');
      expect(row!.tenantId).toBe(TENANT_B);
      expect(await Tariff.count()).toBe(1);
    });
  });

  describe('upsertTariffByTariffId', () => {
    it('creates a row for a new tariffId', async () => {
      const created = await makeRepo().upsertTariffByTariffId(
        TENANT_A,
        aTariffDto({ tariffId: 'OCPI-T-1', pricePerKwh: 0.31 }),
      );

      expect(created.id).toBeGreaterThan(0);
      expect(created.tariffId).toBe('OCPI-T-1');
      expect(created.tenantId).toBe(TENANT_A);
      expect(await Tariff.count()).toBe(1);
    });

    it('finds the row by tariffId even when the incoming dto carries no id', async () => {
      const existing = await aTariff({ tariffId: 'OCPI-T-1', currency: 'EUR' });

      const updated = await makeRepo().upsertTariffByTariffId(
        TENANT_A,
        aTariffDto({ tariffId: 'OCPI-T-1', currency: 'USD', pricePerKwh: 0.5 }),
      );

      expect(updated.id).toBe(existing.id);
      expect(updated.currency).toBe('USD');
      expect(await Tariff.count()).toBe(1);
    });

    it('updates the row that shares the tariffId', async () => {
      const existing = await aTariff({ tariffId: 'OCPI-T-1', currency: 'EUR', pricePerKwh: 0.3 });

      const updated = await makeRepo().upsertTariffByTariffId(
        TENANT_A,
        aTariffDto({
          id: existing.id,
          tariffId: 'OCPI-T-1',
          currency: 'USD',
          pricePerKwh: 0.5,
          pricePerMin: 1,
          pricePerSession: 2,
          authorizationAmount: 3,
          paymentFee: 0.2,
          taxRate: 21,
        }),
      );

      expect(updated.id).toBe(existing.id);
      expect(updated.currency).toBe('USD');
      expect(updated.pricePerKwh).toBe(0.5);
      expect(await Tariff.count()).toBe(1);
      expect((await Tariff.findByPk(existing.id))!.currency).toBe('USD');
    });

    it('a tariff without tariffId always inserts', async () => {
      await aTariff({ tariffId: null });

      const created = await makeRepo().upsertTariffByTariffId(
        TENANT_A,
        aTariffDto({ currency: 'NOK', pricePerKwh: 0.7 }),
      );

      expect(created.tariffId ?? null).toBeNull();
      expect(created.currency).toBe('NOK');
      expect(await Tariff.count()).toBe(2);
    });

    it("creates a separate row instead of updating another tenant's tariffId", async () => {
      const tenantARow = await aTariff({ tariffId: 'SHARED', currency: 'EUR' });

      const created = await makeRepo().upsertTariffByTariffId(
        TENANT_B,
        aTariffDto({
          tariffId: 'SHARED',
          currency: 'USD',
          pricePerKwh: 0.8,
          tenantId: TENANT_B,
        }),
      );

      expect(created.id).not.toBe(tenantARow.id);
      expect(created.tenantId).toBe(TENANT_B);
      expect(await Tariff.count()).toBe(2);
      expect((await Tariff.findByPk(tenantARow.id))!.currency).toBe('EUR');
    });
  });

  describe('readAllByQuerystring', () => {
    it('filters by id and scopes to the tenant', async () => {
      const first = await aTariff({ currency: 'EUR' });
      await aTariff({ currency: 'GBP' });
      await aTariff({ currency: 'USD', tenantId: TENANT_B });

      const repo = makeRepo();
      const byId = await repo.readAllByQuerystring(TENANT_A, {
        tenantId: TENANT_A,
        id: String(first.id),
      });
      const allForA = await repo.readAllByQuerystring(TENANT_A, { tenantId: TENANT_A });
      const allForB = await repo.readAllByQuerystring(TENANT_B, { tenantId: TENANT_B });

      expect(byId).toHaveLength(1);
      expect(byId[0].currency).toBe('EUR');
      expect(allForA).toHaveLength(2);
      expect(allForB).toHaveLength(1);
      expect(allForB[0].currency).toBe('USD');
    });

    it('an id owned by another tenant yields no rows', async () => {
      const foreign = await aTariff({ tenantId: TENANT_B });

      const rows = await makeRepo().readAllByQuerystring(TENANT_A, {
        tenantId: TENANT_A,
        id: String(foreign.id),
      });

      expect(rows).toHaveLength(0);
    });
  });

  describe('deleteAllByQuerystring', () => {
    it('rejects a query without id and leaves the rows alone', async () => {
      await aTariff();

      await expect(
        makeRepo().deleteAllByQuerystring(TENANT_A, { tenantId: TENANT_A }),
      ).rejects.toThrow('Must specify at least one query parameter');
      expect(await Tariff.count()).toBe(1);
    });
  });

  describe('tariffId uniqueness', () => {
    it('rejects a duplicate tariffId within a tenant', async () => {
      await aTariff({ tariffId: 'DUP' });

      await expect(aTariff({ tariffId: 'DUP' })).rejects.toMatchObject({
        name: 'SequelizeUniqueConstraintError',
      });
      expect(await Tariff.count()).toBe(1);
    });

    it('allows the same tariffId for different tenants', async () => {
      await aTariff({ tariffId: 'DUP', tenantId: TENANT_A });
      const second = await aTariff({ tariffId: 'DUP', tenantId: TENANT_B });

      expect(second.tariffId).toBe('DUP');
      expect(await Tariff.count()).toBe(2);
    });
  });
});
