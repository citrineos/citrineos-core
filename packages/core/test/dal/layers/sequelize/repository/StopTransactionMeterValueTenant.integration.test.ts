// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { MeterValueDto, SystemConfig } from '@citrineos/types';
import {
  ChargingStation,
  DefaultSequelizeInstance,
  SequelizeTransactionEventRepository,
  Tenant,
  Transaction,
} from '@dal/index.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * An OCPP 1.6 StopTransaction carries the session's readings in transactionData. The periodic
 * MeterValues path stamps them with the tenant of the connection they arrived on; the stop path did
 * not, so the model's default-tenant hook filed them under tenant 1.
 */
const STATION = 'CS-STOP-TENANT-1';
const OTHER_TENANT_ID = DEFAULT_TENANT_ID + 1;
const TRANSACTION_ID = 'TX-STOP-TENANT';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let transactionEventRepository: SequelizeTransactionEventRepository;

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

  const config = {
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

  transactionEventRepository = new SequelizeTransactionEventRepository({
    config,
    logger: undefined,
    sequelizeInstance,
  } as never);
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

/** What the 1.6 mapper produces from StopTransaction.transactionData - no tenant of its own. */
function aStopReading(): MeterValueDto {
  return {
    timestamp: new Date().toISOString(),
    sampledValue: [
      {
        measurand: 'Energy.Active.Import.Register',
        value: 42.5,
        unitOfMeasure: { unit: 'kWh' },
      },
    ],
  } as unknown as MeterValueDto;
}

describe('An OCPP 1.6 StopTransaction on a tenant other than the default', () => {
  let transactionDatabaseId: number;

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await Tenant.create({ id: OTHER_TENANT_ID, name: 'B' } as never);
    await ChargingStation.create({
      ocppConnectionName: STATION,
      isOnline: true,
      tenantId: OTHER_TENANT_ID,
    } as never);

    const transaction = await Transaction.create({
      tenantId: OTHER_TENANT_ID,
      ocppConnectionName: STATION,
      transactionId: TRANSACTION_ID,
      isActive: true,
    } as never);
    transactionDatabaseId = (transaction as unknown as { id: number }).id;
  });

  it('records the session readings against the tenant the session belongs to', async () => {
    await transactionEventRepository.createStopTransaction(
      OTHER_TENANT_ID,
      transactionDatabaseId,
      STATION,
      42500,
      new Date(),
      [aStopReading()],
      'Local',
    );

    const stored = await transactionEventRepository.readAllMeterValuesByTransactionDataBaseId(
      OTHER_TENANT_ID,
      transactionDatabaseId,
    );
    expect(stored).toHaveLength(1);
  });

  it('does not leave them readable from another tenant', async () => {
    await transactionEventRepository.createStopTransaction(
      OTHER_TENANT_ID,
      transactionDatabaseId,
      STATION,
      42500,
      new Date(),
      [aStopReading()],
      'Local',
    );

    const leaked = await transactionEventRepository.readAllMeterValuesByTransactionDataBaseId(
      DEFAULT_TENANT_ID,
      transactionDatabaseId,
    );
    expect(leaked).toHaveLength(0);
  });
});
