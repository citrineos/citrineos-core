// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig, ICache, IWebsocketConnection } from '@citrineos/base';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  ChargingStation,
  Connector,
  DefaultSequelizeInstance,
  Evse,
  SequelizeLocationRepository,
  Tenant,
} from '@dal/index.js';
import { StatusNotificationService } from '../../src/module/StatusNotificationService.js';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let locationRepository: SequelizeLocationRepository;
let cache: ICache;

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

  const dbConfig = {
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

  sequelizeInstance = DefaultSequelizeInstance.getInstance(dbConfig);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });

  locationRepository = new SequelizeLocationRepository({
    config: {} as BootstrapConfig,
    sequelizeInstance,
  });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance.close();
  await pgContainer.stop();
});

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
  await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'default' } as Tenant);
});

describe('SequelizeLocationRepository.commissionEvseForOcpp16Connector (#160 integration)', () => {
  it('creates an Evse and returns ids that satisfy the Connector FK constraints', async () => {
    const ocppConnectionName = 'CS-1.6-clean-db';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    } as ChargingStation);

    const { evseId, evseTypeConnectorId } =
      await locationRepository.commissionEvseForOcpp16Connector(
        DEFAULT_TENANT_ID,
        ocppConnectionName,
        1,
      );

    expect(evseId).toBeGreaterThan(0);
    expect(evseTypeConnectorId).toBeGreaterThan(0);

    // Confirm the Evse row exists and is linked to the right station
    const evse = await Evse.findOne({ where: { id: evseId } });
    expect(evse).not.toBeNull();
    expect(evse?.ocppConnectionName).toBe(ocppConnectionName);

    // Critical: verify the returned ids satisfy whatever FK rules the live DB enforces
    // by actually inserting a Connector row.
    const dbConnector = await Connector.create({
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName,
      connectorId: 1,
      evseId,
      evseTypeConnectorId,
      status: 'Available',
      timestamp: new Date(),
      errorCode: 'NoError',
    } as unknown as Connector);
    expect(dbConnector.id).toBeGreaterThan(0);
  });

  it('is idempotent: a second call for the same station+connector returns the same evseId', async () => {
    const ocppConnectionName = 'CS-1.6-idempotent';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    } as ChargingStation);

    const first = await locationRepository.commissionEvseForOcpp16Connector(
      DEFAULT_TENANT_ID,
      ocppConnectionName,
      2,
    );
    const second = await locationRepository.commissionEvseForOcpp16Connector(
      DEFAULT_TENANT_ID,
      ocppConnectionName,
      2,
    );

    expect(second.evseId).toBe(first.evseId);
  });
});

describe('StatusNotificationService.processOcpp16StatusNotification end-to-end (#160 integration)', () => {
  it('processes a 1.6 StatusNotification against a clean DB without crashing (auto-commission path)', async () => {
    const ocppConnectionName = 'CS-1.6-e2e-clean';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    } as ChargingStation);

    const websocketConnection: IWebsocketConnection = {
      id: 'test-server',
      protocol: 'ocpp1.6',
      allowUnknownChargingStations: true,
    };
    cache = {
      get: vi.fn().mockResolvedValue(JSON.stringify(websocketConnection)),
    } as unknown as ICache;

    // The service needs ComponentRepository and DeviceModelRepository, but the
    // 1.6 path doesn't use them. Stubs are sufficient.
    const service = new StatusNotificationService({
      componentRepository: { readAllByQuery: vi.fn().mockResolvedValue([]) } as any,
      deviceModelRepository: { createOrUpdateDeviceModelByStationId: vi.fn() } as any,
      locationRepository,
      cache,
    });

    await expect(
      service.processOcpp16StatusNotification(DEFAULT_TENANT_ID, ocppConnectionName, {
        connectorId: 1,
        status: 'Available',
        errorCode: 'NoError',
        timestamp: new Date().toISOString(),
      } as any),
    ).resolves.not.toThrow();

    // Connector should now exist in the DB.
    const connector = await Connector.findOne({
      where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName, connectorId: 1 },
    });
    expect(connector).not.toBeNull();
    expect(connector?.evseId).toBeDefined();
    expect(connector?.evseTypeConnectorId).toBeDefined();

    // Reporter's "cascade" concern: StartTransaction must be able to find
    // this connector via readConnectorByStationIdAndOcpp16ConnectorId.
    const lookedUp = await locationRepository.readConnectorByStationIdAndOcpp16ConnectorId(
      DEFAULT_TENANT_ID,
      ocppConnectionName,
      1,
    );
    expect(lookedUp).toBeDefined();
    expect(lookedUp?.id).toBe(connector?.id);
  });

  it('processes a 1.6 StatusNotification for a commissioned station (matching evse path)', async () => {
    const ocppConnectionName = 'CS-1.6-e2e-commissioned';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    } as ChargingStation);
    // Use the commission helper for a clean pre-existing setup, then upsert
    // a Connector tied to it so the matching-evse branch fires in the handler.
    const { evseId, evseTypeConnectorId } =
      await locationRepository.commissionEvseForOcpp16Connector(
        DEFAULT_TENANT_ID,
        ocppConnectionName,
        1,
      );
    await Connector.create({
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName,
      connectorId: 1,
      evseId,
      evseTypeConnectorId,
      status: 'Available',
      timestamp: new Date(),
      errorCode: 'NoError',
    } as unknown as Connector);

    const websocketConnection: IWebsocketConnection = {
      id: 'test-server',
      protocol: 'ocpp1.6',
      allowUnknownChargingStations: false, // strict — relies on commissioned record
    };
    cache = {
      get: vi.fn().mockResolvedValue(JSON.stringify(websocketConnection)),
    } as unknown as ICache;

    const service = new StatusNotificationService({
      componentRepository: { readAllByQuery: vi.fn().mockResolvedValue([]) } as any,
      deviceModelRepository: { createOrUpdateDeviceModelByStationId: vi.fn() } as any,
      locationRepository,
      cache,
    });

    await expect(
      service.processOcpp16StatusNotification(DEFAULT_TENANT_ID, ocppConnectionName, {
        connectorId: 1,
        status: 'Charging',
        errorCode: 'NoError',
        timestamp: new Date().toISOString(),
      } as any),
    ).resolves.not.toThrow();

    const connector = await Connector.findOne({
      where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName, connectorId: 1 },
    });
    expect(connector?.status).toBe('Charging');
    expect(connector?.evseId).toBe(evseId);
  });
});
