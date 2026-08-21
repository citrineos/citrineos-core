// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { type BootstrapConfig, DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  type OcppRequest,
  OCPPVersion,
} from '@citrineos/types';
import {
  ChargingStation,
  Connector,
  DefaultSequelizeInstance,
  Evse,
  EvseType,
  MeterValue,
  SequelizeTransactionEventRepository,
  Tenant,
  Transaction,
} from '@citrineos/dal';
import { MeterValuesRequestOcpp16Handler } from '@handlers/index.js';
import { createTestContainer, getTestInstance, makeMockOcppSender } from '@test/test-container.js';

/**
 * MeterValue.connectorId is a foreign key to Connector.id, but an OCPP 1.6 MeterValues message
 * carries the station's own connector number - 1, 2, 3 and so on, restarting at 1 on every station.
 * Those two are different numbers that happen to share a type.
 *
 * The transaction the meter values belong to already records which connector it is on, so the
 * reference is available without guessing.
 */
const STATION = 'CS-METER-1';
const OTHER_STATION = 'CS-METER-2';
const OCPP_CONNECTOR_NUMBER = 2;
const TRANSACTION_ID = 4711;

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

let nextEvseNumber = 1;

/** Adds one connector to a station and returns its database id. */
async function aConnectorOn(ocppConnectionName: string, connectorNumber: number): Promise<number> {
  const evseNumber = nextEvseNumber++;
  const evseType = await EvseType.create({
    tenantId: DEFAULT_TENANT_ID,
    id: evseNumber,
    connectorId: null,
  } as never);
  const evse = await Evse.create({
    tenantId: DEFAULT_TENANT_ID,
    ocppConnectionName,
    evseTypeId: evseNumber,
  } as never);
  const connector = await Connector.create({
    tenantId: DEFAULT_TENANT_ID,
    ocppConnectionName,
    connectorId: connectorNumber,
    evseId: (evse as unknown as { id: number }).id,
    evseTypeConnectorId: (evseType as unknown as { databaseId: number }).databaseId,
    status: 'Available',
    errorCode: 'NoError',
    timestamp: new Date().toISOString(),
  } as never);
  return (connector as unknown as { id: number }).id;
}

async function aStation(ocppConnectionName: string) {
  await ChargingStation.create({
    ocppConnectionName,
    isOnline: true,
    tenantId: DEFAULT_TENANT_ID,
  } as never);
}

function aMeterValuesMessage(connectorId: number): IMessage<OcppRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-1',
      timestamp: new Date().toISOString(),
    },
    payload: {
      connectorId,
      transactionId: TRANSACTION_ID,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            { measurand: 'Energy.Active.Import.Register', unit: 'kWh', value: '12.5' },
          ],
        },
      ],
    },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Transactions,
    action: OCPP_CallAction.MeterValues,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<OcppRequest>;
}

describe('OCPP 1.6 MeterValues on a station whose connector number is not a database id', () => {
  const { container } = createTestContainer();
  let ownConnectorDatabaseId: number;
  let otherStationConnectorDatabaseId: number;

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);

    nextEvseNumber = 1;

    // A neighbouring station is commissioned first, so it holds the low database ids - which is
    // exactly the range an OCPP connector number falls in. Its second connector ends up with
    // database id 2, the same number this station calls its own connector.
    await aStation(OTHER_STATION);
    await aConnectorOn(OTHER_STATION, 1);
    otherStationConnectorDatabaseId = await aConnectorOn(OTHER_STATION, 2);
    await aConnectorOn(OTHER_STATION, 3);

    await aStation(STATION);
    ownConnectorDatabaseId = await aConnectorOn(STATION, OCPP_CONNECTOR_NUMBER);

    await Transaction.create({
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      transactionId: String(TRANSACTION_ID),
      isActive: true,
      connectorId: ownConnectorDatabaseId,
    } as never);
  });

  function aHandler() {
    return getTestInstance(container, MeterValuesRequestOcpp16Handler, {
      ocppSender: makeMockOcppSender(),
      transactionEventRepository: new SequelizeTransactionEventRepository({
        config,
        logger: undefined,
        sequelizeInstance,
      } as never),
    });
  }

  it('stores the meter value against the connector the transaction is on', async () => {
    await aHandler().handle(aMeterValuesMessage(OCPP_CONNECTOR_NUMBER) as never);

    const stored = await MeterValue.findAll();
    expect(stored).toHaveLength(1);
    expect(stored[0].connectorId).toBe(ownConnectorDatabaseId);
  });

  it('does not attribute the meter value to another station', async () => {
    // The OCPP connector number is 2, and database id 2 is a connector on the other station.
    expect(otherStationConnectorDatabaseId).toBe(OCPP_CONNECTOR_NUMBER);

    await aHandler().handle(aMeterValuesMessage(OCPP_CONNECTOR_NUMBER) as never);

    const stored = await MeterValue.findAll();
    expect(stored[0]?.connectorId).not.toBe(otherStationConnectorDatabaseId);
  });

  it('still stores the meter value when no connector carries that number as its id', async () => {
    // Nothing has database id 9, so writing the OCPP number straight in violates the foreign key
    // and the handler swallows it - the reading is lost with only a log line.
    await Transaction.update(
      { connectorId: ownConnectorDatabaseId },
      { where: { transactionId: String(TRANSACTION_ID) } },
    );

    await aHandler().handle(aMeterValuesMessage(9) as never);

    expect(await MeterValue.count()).toBe(1);
  });
});
