// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, type ICache, type IWebsocketConnection } from '@citrineos/base';
import {
  ChargingStation,
  Connector,
  DefaultSequelizeInstance,
  Evse,
  SequelizeLocationRepository,
  Tenant,
} from '@citrineos/dal';
import type { SystemConfig } from '@citrineos/types';
import { StatusNotificationService } from '@modules/transactions/status-notification-service.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
  } as unknown as SystemConfig;

  sequelizeInstance = DefaultSequelizeInstance.getInstance(dbConfig);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });

  locationRepository = new SequelizeLocationRepository({
    config: {} as SystemConfig,
    sequelizeInstance,
  });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance.close();
  await pgContainer.stop();
});

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
  await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'default' } as never);
});

describe('SequelizeLocationRepository.autoCommissionEvseForOcpp16Connector (#160 integration)', () => {
  it('creates an Evse whose id satisfies the Connector FK constraints', async () => {
    const ocppConnectionName = 'CS-1.6-clean-db';
    const station = await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    });

    const { evseId } = await locationRepository.autoCommissionEvseForOcpp16Connector(
      DEFAULT_TENANT_ID,
      ocppConnectionName,
    );

    expect(evseId).toBeGreaterThan(0);

    // Confirm the Evse row exists and is linked to the right station
    const evse = await Evse.findOne({ where: { id: evseId } });
    expect(evse).not.toBeNull();
    expect(evse?.ocppConnectionName).toBe(ocppConnectionName);
    expect(evse?.stationId).toBe(station.id);

    // Critical: verify the returned id satisfies whatever FK rules the live DB enforces
    // by actually inserting a Connector row. A 1.6 connector carries no
    // evseTypeConnectorId, so the column has to be genuinely nullable.
    const dbConnector = await Connector.create({
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName,
      connectorId: 1,
      evseId,
      status: 'Available',
      timestamp: new Date(),
      errorCode: 'NoError',
    });
    expect(dbConnector.id).toBeGreaterThan(0);
    expect(dbConnector.evseTypeConnectorId).toBeNull();
  });

  it('accepts a 2.0.1 connector that carries no OCPP 1.6 connectorId', async () => {
    // Mirror image of the above: a 2.0.1 connector is identified per-EVSE and has no
    // station-wide 1.6 number, so connectorId has to be nullable in the live schema too.
    const ocppConnectionName = 'CS-2.0.1-no-connector-id';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    });
    const evse = await Evse.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
      evseTypeId: 1,
    });

    const dbConnector = await Connector.create({
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName,
      evseId: evse.id,
      evseTypeConnectorId: 1,
      status: 'Available',
      timestamp: new Date(),
      errorCode: 'NoError',
    });

    expect(dbConnector.id).toBeGreaterThan(0);
    expect(dbConnector.connectorId).toBeNull();
  });
});

describe('StatusNotificationService.processOcpp16StatusNotification end-to-end (#160 integration)', () => {
  it('processes a 1.6 StatusNotification against a clean DB without crashing (auto-commission path)', async () => {
    const ocppConnectionName = 'CS-1.6-e2e-clean';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    });

    const websocketConnection: IWebsocketConnection = {
      id: 'test-server',
      timeConnected: new Date().toISOString(),
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
      chargingStationRepository: locationRepository,
      evseRepository: locationRepository,
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
    // The 1.6 request never reports a 2.0.1 per-EVSE connector number.
    expect(connector?.evseTypeConnectorId).toBeNull();

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

  it('does not auto-commission a second Evse when the same connector reports again', async () => {
    // auto-commissionEvseForOcpp16Connector creates unconditionally, so the guard against
    // an Evse per StatusNotification is the matching-evse lookup ahead of it.
    const ocppConnectionName = 'CS-1.6-e2e-repeat';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    });

    const websocketConnection: IWebsocketConnection = {
      id: 'test-server',
      timeConnected: new Date().toISOString(),
      protocol: 'ocpp1.6',
      allowUnknownChargingStations: true,
    };
    cache = {
      get: vi.fn().mockResolvedValue(JSON.stringify(websocketConnection)),
    } as unknown as ICache;

    const service = new StatusNotificationService({
      componentRepository: { readAllByQuery: vi.fn().mockResolvedValue([]) } as any,
      deviceModelRepository: { createOrUpdateDeviceModelByStationId: vi.fn() } as any,
      chargingStationRepository: locationRepository,
      evseRepository: locationRepository,
      locationRepository,
      cache,
    });

    for (const status of ['Available', 'Charging']) {
      await service.processOcpp16StatusNotification(DEFAULT_TENANT_ID, ocppConnectionName, {
        connectorId: 1,
        status,
        errorCode: 'NoError',
        timestamp: new Date().toISOString(),
      } as any);
    }

    expect(await Evse.count({ where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName } })).toBe(
      1,
    );
    expect(
      await Connector.count({ where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName } }),
    ).toBe(1);
    const connector = await Connector.findOne({
      where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName, connectorId: 1 },
    });
    expect(connector?.status).toBe('Charging');
  });

  it('processes a 1.6 StatusNotification for a commissioned station (matching evse path)', async () => {
    const ocppConnectionName = 'CS-1.6-e2e-commissioned';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    });
    // Use the commission helper for a clean pre-existing setup, then upsert
    // a Connector tied to it so the matching-evse branch fires in the handler.
    const { evseId } = await locationRepository.autoCommissionEvseForOcpp16Connector(
      DEFAULT_TENANT_ID,
      ocppConnectionName,
    );
    await Connector.create({
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName,
      connectorId: 1,
      evseId,
      status: 'Available',
      timestamp: new Date(),
      errorCode: 'NoError',
    });

    const websocketConnection: IWebsocketConnection = {
      id: 'test-server',
      timeConnected: new Date().toISOString(),
      protocol: 'ocpp1.6',
      allowUnknownChargingStations: false, // strict — relies on commissioned record
    };
    cache = {
      get: vi.fn().mockResolvedValue(JSON.stringify(websocketConnection)),
    } as unknown as ICache;

    const service = new StatusNotificationService({
      componentRepository: { readAllByQuery: vi.fn().mockResolvedValue([]) } as any,
      deviceModelRepository: { createOrUpdateDeviceModelByStationId: vi.fn() } as any,
      chargingStationRepository: locationRepository,
      evseRepository: locationRepository,
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

describe('StatusNotificationService.processStatusNotification end-to-end (2.0.1 integration)', () => {
  const aService = (allowUnknownChargingStations: boolean) => {
    const websocketConnection: IWebsocketConnection = {
      id: 'test-server',
      timeConnected: new Date().toISOString(),
      protocol: 'ocpp2.0.1',
      allowUnknownChargingStations,
    };
    cache = {
      get: vi.fn().mockResolvedValue(JSON.stringify(websocketConnection)),
    } as unknown as ICache;

    return new StatusNotificationService({
      componentRepository: { readAllByQuery: vi.fn().mockResolvedValue([]) } as any,
      deviceModelRepository: { createOrUpdateDeviceModelByStationId: vi.fn() } as any,
      chargingStationRepository: locationRepository,
      evseRepository: locationRepository,
      locationRepository,
      cache,
    });
  };

  it('upserts a synthesized 2.0.1 connector that carries no OCPP 1.6 connectorId', async () => {
    // The synthesized connector has connectorId unset, so the 2.x path has to key the
    // upsert on (evseId, evseTypeConnectorId) — Sequelize rejects an undefined where
    // value outright, so keying on connectorId would throw here.
    const ocppConnectionName = 'CS-2.0.1-e2e-clean';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    });

    await expect(
      aService(true).processStatusNotification(DEFAULT_TENANT_ID, ocppConnectionName, {
        evseId: 1,
        connectorId: 1,
        connectorStatus: 'Available',
        timestamp: new Date().toISOString(),
      } as any),
    ).resolves.not.toThrow();

    const connector = await Connector.findOne({
      where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName, evseTypeConnectorId: 1 },
    });
    expect(connector).not.toBeNull();
    expect(connector?.connectorId).toBeNull();
  });

  it('updates the same row rather than inserting a duplicate when the connector reports again', async () => {
    // (stationId, connectorId) is the only unique constraint on Connectors and NULLs are
    // distinct in Postgres, so a lookup keyed on a null connectorId would insert a fresh
    // row on every StatusNotification instead of updating the existing one.
    const ocppConnectionName = 'CS-2.0.1-e2e-repeat';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    });
    const service = aService(true);

    for (const connectorStatus of ['Available', 'Occupied']) {
      await service.processStatusNotification(DEFAULT_TENANT_ID, ocppConnectionName, {
        evseId: 1,
        connectorId: 1,
        connectorStatus,
        timestamp: new Date().toISOString(),
      } as any);
    }

    expect(
      await Connector.count({ where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName } }),
    ).toBe(1);
    const connector = await Connector.findOne({
      where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName },
    });
    expect(connector?.status).toBe('Occupied');
  });

  it('keeps each EVSEs connector distinct when both report their connector 1', async () => {
    // Per-EVSE numbering: EVSE 1 connector 1 and EVSE 2 connector 1 are two connectors.
    // Both are synthesized with connectorId unset, so only (evseId, evseTypeConnectorId)
    // tells them apart.
    const ocppConnectionName = 'CS-2.0.1-e2e-multi-evse';
    await ChargingStation.create({
      ocppConnectionName,
      tenantId: DEFAULT_TENANT_ID,
    });
    const service = aService(true);

    for (const evseId of [1, 2]) {
      await service.processStatusNotification(DEFAULT_TENANT_ID, ocppConnectionName, {
        evseId,
        connectorId: 1,
        connectorStatus: 'Available',
        timestamp: new Date().toISOString(),
      } as any);
    }

    const connectors = await Connector.findAll({
      where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName },
      include: [Evse],
    });
    expect(connectors).toHaveLength(2);
    expect(connectors.map((c) => c.evse?.evseTypeId).sort()).toEqual([1, 2]);
  });
});
