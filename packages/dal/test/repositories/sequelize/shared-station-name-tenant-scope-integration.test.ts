// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { type BootstrapConfig, DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/types';
import {
  ChargingStation,
  DefaultSequelizeInstance,
  Evse,
  EvseType,
  SequelizeChargingProfileRepository,
  SequelizeTransactionEventRepository,
  Tenant,
  Transaction,
} from '../../../index.js';

/**
 * A station name is unique per tenant (ChargingStations_stationName_tenantId), so two tenants can
 * each have a station called CS-1. A lookup by station name alone reads across that boundary.
 */
const OTHER_TENANT_ID = DEFAULT_TENANT_ID + 1;
const SHARED_STATION_NAME = 'CS-SHARED';
const OCPP_EVSE_NUMBER = 1;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
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

  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

let nextEvseTypeNumber = 1;

/** Commissions a station of the shared name in the given tenant with one EVSE, returning the EVSE row id. */
async function aStationWithOneEvse(tenantId: number): Promise<number> {
  await ChargingStation.create({
    ocppConnectionName: SHARED_STATION_NAME,
    isOnline: true,
    tenantId,
  } as never);
  await EvseType.create({ tenantId, id: nextEvseTypeNumber++, connectorId: null } as never);
  const evse = await Evse.create({
    tenantId,
    ocppConnectionName: SHARED_STATION_NAME,
    evseTypeId: OCPP_EVSE_NUMBER,
  } as never);
  return (evse as unknown as { id: number }).id;
}

async function anActiveTransaction(
  tenantId: number,
  evseDatabaseId: number,
  transactionId: string,
) {
  const transaction = await Transaction.create({
    tenantId,
    ocppConnectionName: SHARED_STATION_NAME,
    transactionId,
    isActive: true,
    evseId: evseDatabaseId,
  } as never);
  return (transaction as unknown as { id: number }).id;
}

function chargingNeedsOn(evseId: number): OCPP2_0_1.NotifyEVChargingNeedsRequest {
  return {
    evseId,
    chargingNeeds: {
      requestedEnergyTransfer: OCPP2_0_1.EnergyTransferModeEnumType.AC_three_phase,
      acChargingParameters: {
        energyAmount: 20000,
        evMinCurrent: 6,
        evMaxCurrent: 32,
        evMaxVoltage: 400,
      },
    },
  };
}

describe('Repository reads on a station name shared by two tenants', () => {
  let chargingProfileRepository: SequelizeChargingProfileRepository;
  let transactionEventRepository: SequelizeTransactionEventRepository;
  let ownEvseDatabaseId: number;
  let otherEvseDatabaseId: number;

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await Tenant.create({ id: OTHER_TENANT_ID, name: 'B' } as never);
    nextEvseTypeNumber = 1;

    otherEvseDatabaseId = await aStationWithOneEvse(OTHER_TENANT_ID);
    ownEvseDatabaseId = await aStationWithOneEvse(DEFAULT_TENANT_ID);

    const dependencies = { config, logger: undefined, sequelizeInstance } as never;
    chargingProfileRepository = new SequelizeChargingProfileRepository(dependencies);
    transactionEventRepository = new SequelizeTransactionEventRepository(dependencies);
  });

  describe('createChargingNeeds', () => {
    it("does not attach the needs to the other tenant's transaction", async () => {
      await anActiveTransaction(OTHER_TENANT_ID, otherEvseDatabaseId, 'T-OTHER');

      await expect(
        chargingProfileRepository.createChargingNeeds(
          DEFAULT_TENANT_ID,
          chargingNeedsOn(OCPP_EVSE_NUMBER),
          SHARED_STATION_NAME,
        ),
      ).rejects.toThrow(/No active transaction found/);
    });

    it("attaches the needs to the caller's own transaction when both tenants have one", async () => {
      await anActiveTransaction(OTHER_TENANT_ID, otherEvseDatabaseId, 'T-OTHER');
      const ownTransactionId = await anActiveTransaction(
        DEFAULT_TENANT_ID,
        ownEvseDatabaseId,
        'T-OWN',
      );

      const chargingNeeds = await chargingProfileRepository.createChargingNeeds(
        DEFAULT_TENANT_ID,
        chargingNeedsOn(OCPP_EVSE_NUMBER),
        SHARED_STATION_NAME,
      );

      expect(chargingNeeds.transactionDatabaseId).toBe(ownTransactionId);
      expect(chargingNeeds.evseId).toBe(ownEvseDatabaseId);
    });
  });

  describe('getTransactionsCount', () => {
    it("counts only the caller's tenant", async () => {
      await anActiveTransaction(OTHER_TENANT_ID, otherEvseDatabaseId, 'T-OTHER-1');
      await anActiveTransaction(OTHER_TENANT_ID, otherEvseDatabaseId, 'T-OTHER-2');
      await anActiveTransaction(DEFAULT_TENANT_ID, ownEvseDatabaseId, 'T-OWN');

      const count = await transactionEventRepository.getTransactionsCount(DEFAULT_TENANT_ID);

      expect(count).toBe(1);
    });

    it('agrees with the page getTransactions returns for the same tenant', async () => {
      await anActiveTransaction(OTHER_TENANT_ID, otherEvseDatabaseId, 'T-OTHER-1');
      await anActiveTransaction(DEFAULT_TENANT_ID, ownEvseDatabaseId, 'T-OWN-1');
      await anActiveTransaction(DEFAULT_TENANT_ID, ownEvseDatabaseId, 'T-OWN-2');

      const [count, page] = await Promise.all([
        transactionEventRepository.getTransactionsCount(DEFAULT_TENANT_ID),
        transactionEventRepository.getTransactions(DEFAULT_TENANT_ID),
      ]);

      expect(count).toBe(page.length);
      expect(count).toBe(2);
    });
  });
});
