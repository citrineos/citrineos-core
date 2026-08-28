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
  SequelizeLocationRepository,
  Tenant,
} from '@dal/index.js';
import { StatusNotificationService } from '@modules/Transactions/src/module/StatusNotificationService.js';

/**
 * OCPP 1.6 commissions an EVSE and a connector the first time an unknown station reports one.
 * OCPP 2.0.1 had no equivalent, so a station's connectors only came into being through the
 * transaction path - a status notification before the first session was dropped with a warning.
 */
const STATION = 'CS-201-COMMISSION-1';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
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

  locationRepository = new SequelizeLocationRepository({
    config,
    sequelizeInstance,
  } as never);
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

function aService(allowUnknownChargingStations: boolean) {
  const cache = {
    get: vi.fn().mockResolvedValue(
      JSON.stringify({
        id: 'test-server',
        protocol: 'ocpp2.0.1',
        allowUnknownChargingStations,
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

function aStatusNotification(evseId: number, connectorId: number) {
  return {
    evseId,
    connectorId,
    connectorStatus: OCPP2_0_1.ConnectorStatusEnumType.Available,
    timestamp: new Date().toISOString(),
  } as OCPP2_0_1.StatusNotificationRequest;
}

describe('An OCPP 2.0.1 station reporting a connector for the first time', () => {
  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await ChargingStation.create({
      ocppConnectionName: STATION,
      isOnline: true,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
  });

  it('records the EVSE and connector it names', async () => {
    await aService(true).processStatusNotification(
      DEFAULT_TENANT_ID,
      STATION,
      aStatusNotification(1, 1),
    );

    const evses = await Evse.findAll();
    const connectors = await Connector.findAll();
    expect(evses.map((evse) => evse.evseTypeId)).toEqual([1]);
    expect(connectors).toHaveLength(1);
    expect(connectors[0].evseTypeConnectorId).toBe(1);
    expect(connectors[0].status).toBe(OCPP2_0_1.ConnectorStatusEnumType.Available);
  });

  it('gives each EVSE connector its own station-wide number', async () => {
    const service = aService(true);

    await service.processStatusNotification(DEFAULT_TENANT_ID, STATION, aStatusNotification(1, 1));
    await service.processStatusNotification(DEFAULT_TENANT_ID, STATION, aStatusNotification(2, 1));

    const connectors = await Connector.findAll({ order: [['id', 'ASC']] });
    expect(connectors).toHaveLength(2);
    expect(connectors[0].connectorId).not.toBe(connectors[1].connectorId);
  });

  it('reports the same connector twice without adding a second row', async () => {
    const service = aService(true);

    await service.processStatusNotification(DEFAULT_TENANT_ID, STATION, aStatusNotification(1, 1));
    await service.processStatusNotification(DEFAULT_TENANT_ID, STATION, aStatusNotification(1, 1));

    expect(await Connector.count()).toBe(1);
  });

  it('records no connector when the server does not allow unknown stations', async () => {
    await aService(false).processStatusNotification(
      DEFAULT_TENANT_ID,
      STATION,
      aStatusNotification(1, 1),
    );

    const connectors = await Connector.findAll({ where: { ocppConnectionName: STATION } });
    expect(connectors).toHaveLength(0);
  });
});
