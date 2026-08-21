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
  SequelizeTransactionEventRepository,
  Tenant,
} from '@dal/index.js';

/**
 * In OCPP 2.0.1 a connectorId is scoped to its EVSE, so every EVSE of a station numbers its first
 * connector 1. Connector.connectorId holds the station-wide OCPP 1.6 numbering and is unique per
 * station, so writing the EVSE-scoped number straight into it collides as soon as a second EVSE
 * starts a transaction.
 */
const STATION = 'CS-MULTI-EVSE-1';

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
  } as unknown as BootstrapConfig;

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

function aStartedEvent(
  transactionId: string,
  evseId: number,
  connectorId: number,
): OCPP2_request_types.TransactionEventRequest {
  return {
    eventType: OCPP2_0_1.TransactionEventEnumType.Started,
    timestamp: new Date().toISOString(),
    triggerReason: OCPP2_0_1.TriggerReasonEnumType.CablePluggedIn,
    seqNo: 1,
    transactionInfo: { transactionId },
    evse: { id: evseId, connectorId },
  } as unknown as OCPP2_request_types.TransactionEventRequest;
}

function anUpdatedEvent(
  transactionId: string,
  evseId: number,
  connectorId: number,
): OCPP2_request_types.TransactionEventRequest {
  return {
    eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
    timestamp: new Date().toISOString(),
    triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
    seqNo: 2,
    transactionInfo: { transactionId },
    evse: { id: evseId, connectorId },
  } as unknown as OCPP2_request_types.TransactionEventRequest;
}

describe('A station whose EVSEs each number their first connector 1', () => {
  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await ChargingStation.create({
      ocppConnectionName: STATION,
      isOnline: true,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
  });

  it('starts a transaction on a second EVSE', async () => {
    await transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(
      DEFAULT_TENANT_ID,
      aStartedEvent('TX-EVSE-1', 1, 1),
      STATION,
    );

    await transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(
      DEFAULT_TENANT_ID,
      aStartedEvent('TX-EVSE-2', 2, 1),
      STATION,
    );

    const connectors = await Connector.findAll({ order: [['id', 'ASC']] });
    expect(connectors).toHaveLength(2);
    expect(connectors[0].connectorId).not.toBe(connectors[1].connectorId);
    expect(() => JSON.stringify(connectors)).not.toThrow();
  });

  it('records a connector for a transaction whose first event named no connector', async () => {
    // A station may send the connector only on a later event, which lands in the update branch.
    await transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(
      DEFAULT_TENANT_ID,
      {
        eventType: OCPP2_0_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.CablePluggedIn,
        seqNo: 1,
        transactionInfo: { transactionId: 'TX-LATE-CONNECTOR' },
      } as unknown as OCPP2_request_types.TransactionEventRequest,
      STATION,
    );

    await transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(
      DEFAULT_TENANT_ID,
      anUpdatedEvent('TX-LATE-CONNECTOR', 1, 1),
      STATION,
    );

    const connectors = await Connector.findAll();
    expect(connectors).toHaveLength(1);
    expect(connectors[0].connectorId).not.toBeNull();
  });
});
