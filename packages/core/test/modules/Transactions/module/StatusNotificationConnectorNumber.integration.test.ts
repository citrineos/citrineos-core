// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import {
  type BootstrapConfig,
  type ICache,
  type IWebsocketConnection,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/types';
import {
  ChargingStation,
  Connector,
  DefaultSequelizeInstance,
  Evse,
  EvseType,
  SequelizeLocationRepository,
  StatusNotification,
  Tenant,
} from '@dal/index.js';
import { StatusNotificationService } from '@modules/Transactions/src/module/StatusNotificationService.js';

/**
 * StatusNotification.connectorId holds the connector number the station sent. That number restarts
 * at 1 on every station, so it is not a reference to a Connector row - and treating it as one
 * resolves a station's connector 1 to whichever connector happens to hold database id 1.
 */
const STATION = 'CS-STATUS-1';
const OTHER_STATION = 'CS-STATUS-2';
const OCPP_CONNECTOR_NUMBER = 1;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let locationRepository: SequelizeLocationRepository;
let cache: ICache;
let nextEvseNumber = 1;

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

  sequelizeInstance = DefaultSequelizeInstance.getInstance({
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
  } as unknown as BootstrapConfig);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });

  locationRepository = new SequelizeLocationRepository({
    config: {} as BootstrapConfig,
    sequelizeInstance,
  });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

async function aStation(ocppConnectionName: string) {
  await ChargingStation.create({
    ocppConnectionName,
    isOnline: true,
    tenantId: DEFAULT_TENANT_ID,
  } as never);
}

/** Adds one commissioned connector to a station and returns its database id. */
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

function aService() {
  cache = {
    get: vi.fn().mockResolvedValue(
      JSON.stringify({
        id: 'test-server',
        protocol: 'ocpp1.6',
        allowUnknownChargingStations: true,
      } as IWebsocketConnection),
    ),
  } as unknown as ICache;

  return new StatusNotificationService({
    componentRepository: { readAllByQuery: vi.fn().mockResolvedValue([]) } as never,
    deviceModelRepository: { createOrUpdateDeviceModelByStationId: vi.fn() } as never,
    locationRepository,
    cache,
  });
}

describe('A station reporting status for its own connector number', () => {
  let ownConnectorDatabaseId: number;

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    nextEvseNumber = 1;

    // A neighbouring station is commissioned first, so it holds the low database ids - the range
    // an OCPP connector number falls in.
    await aStation(OTHER_STATION);
    await aConnectorOn(OTHER_STATION, 1);
    await aConnectorOn(OTHER_STATION, 2);

    await aStation(STATION);
    ownConnectorDatabaseId = await aConnectorOn(STATION, OCPP_CONNECTOR_NUMBER);
  });

  it('records the connector number the station sent', async () => {
    await aService().processOcpp16StatusNotification(DEFAULT_TENANT_ID, STATION, {
      connectorId: OCPP_CONNECTOR_NUMBER,
      status: OCPP2_0_1.ConnectorStatusEnumType.Available,
      errorCode: 'NoError',
      timestamp: new Date().toISOString(),
    } as never);

    const stored = await StatusNotification.findOne({ where: { ocppConnectionName: STATION } });
    expect(stored).not.toBeNull();
    expect(stored!.connectorId).toBe(OCPP_CONNECTOR_NUMBER);
  });

  it('leaves the number alone rather than forcing it to name a connector row', async () => {
    // Constraining this column to Connector.id makes the station's connector 1 mean whichever
    // connector was created first across the whole database - here, one on the other station.
    expect(ownConnectorDatabaseId).not.toBe(OCPP_CONNECTOR_NUMBER);

    await aService().processOcpp16StatusNotification(DEFAULT_TENANT_ID, STATION, {
      connectorId: OCPP_CONNECTOR_NUMBER,
      status: OCPP2_0_1.ConnectorStatusEnumType.Available,
      errorCode: 'NoError',
      timestamp: new Date().toISOString(),
    } as never);

    const foreignKeys = await sequelizeInstance.query(
      `SELECT tc.constraint_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'StatusNotifications'
          AND kcu.column_name = 'connectorId'`,
    );
    expect(foreignKeys[0]).toHaveLength(0);
  });

  it('does not constrain the EvseType connector number to a connector row either', async () => {
    // EvseTypes.connectorId is the connector number within an EVSE, written straight from a
    // reported component, and is not a reference to a Connector row.
    const foreignKeys = await sequelizeInstance.query(
      `SELECT tc.constraint_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'EvseTypes'
          AND kcu.column_name = 'connectorId'`,
    );
    expect(foreignKeys[0]).toHaveLength(0);
  });
});
