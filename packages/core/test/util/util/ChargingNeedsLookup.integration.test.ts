// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP2_common_types, type SystemConfig } from '@citrineos/types';
import {
  ChargingStation,
  DefaultSequelizeInstance,
  Evse,
  EvseType,
  SequelizeChargingProfileRepository,
  SequelizeDeviceModelRepository,
  SequelizeTransactionEventRepository,
  Tenant,
  Transaction,
} from '@dal/index.js';
import { validateChargingProfileType } from '@util/index.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { Logger } from 'tslog';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * ChargingNeeds rows are written against the EVSE the transaction is on - Evse.id, taken from
 * Transaction.evseId. Looking them up by EvseType.databaseId reads a different table's key: EvseType
 * is the tenant-wide device model catalogue, and its rows are numbered independently of Evses.
 */
const STATION = 'CS-NEEDS-1';
const OTHER_STATION = 'CS-NEEDS-2';
const OCPP_EVSE_NUMBER = 1;
const TRANSACTION_ID = 'T-NEEDS-1';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let config: SystemConfig;

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
  } as unknown as SystemConfig;

  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

let nextEvseTypeNumber = 1;

async function aStation(ocppConnectionName: string) {
  await ChargingStation.create({
    ocppConnectionName,
    isOnline: true,
    tenantId: DEFAULT_TENANT_ID,
  } as never);
}

/** Adds one commissioned EVSE to a station and returns its database id. */
async function anEvseOn(ocppConnectionName: string, ocppEvseNumber: number): Promise<number> {
  await EvseType.create({
    tenantId: DEFAULT_TENANT_ID,
    id: nextEvseTypeNumber++,
    connectorId: null,
  } as never);
  const evse = await Evse.create({
    tenantId: DEFAULT_TENANT_ID,
    ocppConnectionName,
    evseTypeId: ocppEvseNumber,
  } as never);
  return (evse as unknown as { id: number }).id;
}

function aTxProfile() {
  return {
    id: 1,
    stackLevel: 1,
    chargingProfilePurpose: 'TxProfile',
    chargingProfileKind: 'Relative',
    transactionId: TRANSACTION_ID,
    chargingSchedule: [
      {
        id: 1,
        chargingRateUnit: 'A',
        chargingSchedulePeriod: [{ startPeriod: 0, limit: 32 }],
      },
    ],
  } as unknown as OCPP2_common_types.ChargingProfileType;
}

describe('Charging needs for a transaction on a station EVSE', () => {
  let chargingProfileRepository: SequelizeChargingProfileRepository;
  let deviceModelRepository: SequelizeDeviceModelRepository;
  let transactionEventRepository: SequelizeTransactionEventRepository;
  let ownEvseDatabaseId: number;

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    nextEvseTypeNumber = 1;

    // A neighbouring station is commissioned first, so the EvseType catalogue and the Evses table
    // stop numbering in step.
    await aStation(OTHER_STATION);
    await anEvseOn(OTHER_STATION, 1);
    await anEvseOn(OTHER_STATION, 2);

    await aStation(STATION);
    ownEvseDatabaseId = await anEvseOn(STATION, OCPP_EVSE_NUMBER);

    await Transaction.create({
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      transactionId: TRANSACTION_ID,
      isActive: true,
      evseId: ownEvseDatabaseId,
    } as never);

    const dependencies = { config, logger: undefined, sequelizeInstance } as never;
    chargingProfileRepository = new SequelizeChargingProfileRepository(dependencies);
    deviceModelRepository = new SequelizeDeviceModelRepository(dependencies);
    transactionEventRepository = new SequelizeTransactionEventRepository(dependencies);

    await chargingProfileRepository.createChargingNeeds(
      DEFAULT_TENANT_ID,
      {
        evseId: OCPP_EVSE_NUMBER,
        maxScheduleTuples: 5,
        chargingNeeds: {
          requestedEnergyTransfer: 'AC_three_phase',
          acChargingParameters: {
            energyAmount: 40000,
            evMinCurrent: 6,
            evMaxCurrent: 32,
            evMaxVoltage: 400,
          },
        },
      } as never,
      STATION,
    );
  });

  function validate() {
    return validateChargingProfileType(
      aTxProfile(),
      DEFAULT_TENANT_ID,
      STATION,
      deviceModelRepository,
      chargingProfileRepository,
      transactionEventRepository,
      new Logger({ type: 'hidden' }),
      OCPP_EVSE_NUMBER,
    );
  }

  it('finds the charging needs the EV reported for this transaction', async () => {
    // The EVSE is the third row in Evses but the first in the EvseType catalogue, so the two keys
    // no longer coincide.
    expect(ownEvseDatabaseId).not.toBe(OCPP_EVSE_NUMBER);

    const { transactionContext } = await validate();

    expect(transactionContext?.chargingNeeds).toBeDefined();
  });

  it('defaults numberPhases from the AC charging parameters the EV reported', async () => {
    const profile = aTxProfile();

    await validateChargingProfileType(
      profile,
      DEFAULT_TENANT_ID,
      STATION,
      deviceModelRepository,
      chargingProfileRepository,
      transactionEventRepository,
      new Logger({ type: 'hidden' }),
      OCPP_EVSE_NUMBER,
    );

    expect(profile.chargingSchedule[0].chargingSchedulePeriod[0].numberPhases).toBe(3);
  });
});
