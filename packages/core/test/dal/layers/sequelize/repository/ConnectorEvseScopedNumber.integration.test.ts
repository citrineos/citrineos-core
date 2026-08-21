// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { type BootstrapConfig, DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP2_0_1, type OCPP2_request_types } from '@citrineos/types';
import {
  ChargingStation,
  Connector,
  DefaultSequelizeInstance,
  SequelizeLocationRepository,
  SequelizeTransactionEventRepository,
  Tenant,
} from '@dal/index.js';

/**
 * Connector.evseTypeConnectorId holds the connector number within its EVSE, which is what an OCPP
 * 2.0.1 station sends and what every 2.0.1 read compares against. Constraining it to
 * EvseTypes.databaseId makes that number mean a row in the tenant-wide device model catalogue
 * instead.
 */
const STATION = 'CS-CONNECTOR-REF-1';
const OCPP_201_CONNECTOR_NUMBER = 1;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let transactionEventRepository: SequelizeTransactionEventRepository;
let locationRepository: SequelizeLocationRepository;

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
  } as unknown as BootstrapConfig;

  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });

  const dependencies = { config, logger: undefined, sequelizeInstance } as never;
  transactionEventRepository = new SequelizeTransactionEventRepository(dependencies);
  locationRepository = new SequelizeLocationRepository(dependencies);
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

function aStartedEvent(): OCPP2_request_types.TransactionEventRequest {
  return {
    eventType: OCPP2_0_1.TransactionEventEnumType.Started,
    timestamp: new Date().toISOString(),
    triggerReason: OCPP2_0_1.TriggerReasonEnumType.CablePluggedIn,
    seqNo: 1,
    transactionInfo: { transactionId: 'TX-CONNECTOR-REF' },
    evse: { id: 1, connectorId: OCPP_201_CONNECTOR_NUMBER },
  } as unknown as OCPP2_request_types.TransactionEventRequest;
}

describe('A connector number scoped to its EVSE', () => {
  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await ChargingStation.create({
      ocppConnectionName: STATION,
      isOnline: true,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
  });

  it('records the connector a 2.0.1 transaction names on an uncommissioned station', async () => {
    await transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(
      DEFAULT_TENANT_ID,
      aStartedEvent(),
      STATION,
    );

    const connectors = await Connector.findAll();
    expect(connectors).toHaveLength(1);
    expect(connectors[0].evseTypeConnectorId).toBe(OCPP_201_CONNECTOR_NUMBER);
  });

  it('commissions an OCPP 1.6 connector with a connector number, not a catalogue key', async () => {
    // Each 1.6 connector becomes its own single-connector EVSE, so its number within that EVSE is 1
    // however many rows the tenant-wide EvseType catalogue already holds.
    await locationRepository.commissionEvseForOcpp16Connector(DEFAULT_TENANT_ID, 'CS-OTHER', 1);
    await locationRepository.commissionEvseForOcpp16Connector(DEFAULT_TENANT_ID, 'CS-OTHER', 2);

    const commissioned = await locationRepository.commissionEvseForOcpp16Connector(
      DEFAULT_TENANT_ID,
      STATION,
      3,
    );

    expect(commissioned.evseTypeConnectorId).toBe(1);
  });

  it('does not tie the connector number to a device model catalogue row', async () => {
    const foreignKeys = await sequelizeInstance.query(
      `SELECT tc.constraint_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'Connectors'
          AND kcu.column_name = 'evseTypeConnectorId'`,
    );
    expect(foreignKeys[0]).toHaveLength(0);
  });
});
