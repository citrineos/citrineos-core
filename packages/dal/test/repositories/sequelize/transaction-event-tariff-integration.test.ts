// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { IdTokenEnum, type OCPP2_request_types, type SystemConfig } from '@citrineos/types';
import {
  DefaultSequelizeInstance,
  SequelizeTransactionEventRepository,
  Transaction,
} from '../../../index.js';
import {
  Authorization,
  ChargingStation,
  Evse,
  Location,
  Tariff,
  Tenant,
} from '@dal/db/sequelize/index.js';

const STATION_NAME = 'CS-2.1';
const TRANSACTION_ID = 'TX-2.1';
const STATION_TARIFF_ID = 'TARIFF-1';

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

function aStartedEventWithoutEvse(): OCPP2_request_types.TransactionEventRequest {
  return {
    eventType: 'Started',
    timestamp: '2026-09-14T10:00:00.000Z',
    triggerReason: 'Authorized',
    seqNo: 0,
    transactionInfo: { transactionId: TRANSACTION_ID, tariffId: STATION_TARIFF_ID },
  } as OCPP2_request_types.TransactionEventRequest;
}

describe('A 2.1 Started TransactionEvent that names the tariff in transactionInfo', () => {
  let repository: SequelizeTransactionEventRepository;

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await ChargingStation.create({
      ocppConnectionName: STATION_NAME,
      isOnline: true,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
    repository = new SequelizeTransactionEventRepository({
      config,
      logger: undefined,
      sequelizeInstance,
    } as never);
  });

  it('links the transaction to the Tariff row with that tariffId', async () => {
    const tariff = await Tariff.create({
      tenantId: DEFAULT_TENANT_ID,
      currency: 'EUR',
      pricePerKwh: 0.3,
      tariffId: STATION_TARIFF_ID,
    } as never);

    await repository.createOrUpdateTransactionByTransactionEventAndStationId(
      DEFAULT_TENANT_ID,
      aStartedEventWithoutEvse(),
      STATION_NAME,
    );

    const transaction = await Transaction.findOne({ where: { transactionId: TRANSACTION_ID } });
    expect(transaction?.tariffId).toBe((tariff as unknown as { id: number }).id);
  });

  it('stores the transaction without a tariff when no Tariff row has that tariffId', async () => {
    await repository.createOrUpdateTransactionByTransactionEventAndStationId(
      DEFAULT_TENANT_ID,
      aStartedEventWithoutEvse(),
      STATION_NAME,
    );

    const transaction = await Transaction.findOne({ where: { transactionId: TRANSACTION_ID } });
    expect(transaction).not.toBeNull();
    expect(transaction?.tariffId).toBeNull();
  });
});

describe('An active transaction read with its associations eager loaded', () => {
  const DRIVER_TARIFF_ID = 'DRIVER-TARIFF';
  let repository: SequelizeTransactionEventRepository;
  let stationId: number;
  let tariffId: number;

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    const location = await Location.create({ name: 'L', tenantId: DEFAULT_TENANT_ID } as never);
    const station = await ChargingStation.create({
      ocppConnectionName: STATION_NAME,
      isOnline: true,
      locationId: location.id,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
    stationId = station.id;
    const evse = await Evse.create({
      stationId,
      evseTypeId: 1,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
    const tariff = await Tariff.create({
      tenantId: DEFAULT_TENANT_ID,
      currency: 'EUR',
      pricePerKwh: 0.3,
      tariffId: DRIVER_TARIFF_ID,
    } as never);
    tariffId = tariff.id;
    const authorization = await Authorization.create({
      idToken: 'DRIVER-1',
      idTokenType: IdTokenEnum.ISO14443,
      status: 'Accepted',
      tariffId,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
    await Transaction.create({
      transactionId: TRANSACTION_ID,
      isActive: true,
      locationId: location.id,
      stationId,
      evseId: evse.id,
      authorizationId: authorization.id,
      tariffId,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
    repository = new SequelizeTransactionEventRepository({
      config,
      logger: undefined,
      sequelizeInstance,
    } as never);
  });

  it('exposes the authorization and its tariff as properties', async () => {
    const rows = await repository.readActiveTransactionsWithTariffAndEvseByStationId(
      DEFAULT_TENANT_ID,
      STATION_NAME,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].authorization?.tariff?.tariffId).toBe(DRIVER_TARIFF_ID);
    expect(rows[0].evse?.evseTypeId).toBe(1);
  });

  it('exposes the location, station and tariff as properties', async () => {
    const transaction = await Transaction.findOne({
      where: { transactionId: TRANSACTION_ID },
      include: [Location, ChargingStation, Tariff],
    });

    expect(transaction?.location?.name).toBe('L');
    expect(transaction?.station?.ocppConnectionName).toBe(STATION_NAME);
    expect(transaction?.tariff?.tariffId).toBe(DRIVER_TARIFF_ID);
  });
});
