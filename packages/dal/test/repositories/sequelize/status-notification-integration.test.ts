// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { StatusNotification } from '@dal/db/sequelize/index.js';
import type { SystemConfig } from '@citrineos/types';
import { DefaultSequelizeInstance, SequelizeLocationRepository } from '../../../index.js';
import { Tenant } from '../../../src/models/tenant.js';
import { ChargingStation } from '../../../src/models/location/charging-station.js';
import { Connector } from '../../../src/models/location/connector.js';
import { Evse } from '../../../src/models/location/evse.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const OCPP_CONNECTION_NAME = 'CS-STATUS';
const TIMESTAMP = '2026-09-15T10:00:00.000Z';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let locationRepository: SequelizeLocationRepository;
let stationId: number;
let evseId: number;

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
  const station = await ChargingStation.create({
    ocppConnectionName: OCPP_CONNECTION_NAME,
    tenantId: DEFAULT_TENANT_ID,
  });
  stationId = station.id;
  const evse = await Evse.create({
    tenantId: DEFAULT_TENANT_ID,
    stationId,
  });
  evseId = evse.id;
  for (const connectorId of [1, 2]) {
    await Connector.create({
      tenantId: DEFAULT_TENANT_ID,
      stationId,
      connectorId,
      evseId: evse.id,
      timestamp: new Date(),
    });
  }
});

describe('SequelizeLocationRepository', () => {
  describe('addStatusNotificationToChargingStation', () => {
    it('stores the fields of a StatusNotification built from a 2.x request', async () => {
      await locationRepository.addStatusNotificationToChargingStation(
        DEFAULT_TENANT_ID,
        OCPP_CONNECTION_NAME,
        StatusNotification.build({
          tenantId: DEFAULT_TENANT_ID,
          evseId: 1,
          connectorId: 1,
          connectorStatus: 'Occupied',
          timestamp: TIMESTAMP,
        }),
      );

      const rows = await StatusNotification.findAll();
      expect(rows).toHaveLength(1);
      expect(rows[0].get({ plain: true })).toMatchObject({
        tenantId: DEFAULT_TENANT_ID,
        stationId,
        evseId: 1,
        connectorId: 1,
        connectorStatus: 'Occupied',
        timestamp: TIMESTAMP,
      });
    });

    it('stores the fields of a StatusNotification built from a 1.6 request', async () => {
      await locationRepository.addStatusNotificationToChargingStation(
        DEFAULT_TENANT_ID,
        OCPP_CONNECTION_NAME,
        StatusNotification.build({
          tenantId: DEFAULT_TENANT_ID,
          connectorId: 2,
          evseId: 1,
          connectorStatus: 'Faulted',
          errorCode: 'GroundFailure',
          info: 'RCD tripped',
          vendorId: 'com.example',
          vendorErrorCode: 'E42',
          timestamp: TIMESTAMP,
        }),
      );

      const rows = await StatusNotification.findAll();
      expect(rows).toHaveLength(1);
      expect(rows[0].get({ plain: true })).toMatchObject({
        tenantId: DEFAULT_TENANT_ID,
        stationId,
        connectorId: 2,
        evseId: 1,
        connectorStatus: 'Faulted',
        errorCode: 'GroundFailure',
        info: 'RCD tripped',
        vendorId: 'com.example',
        vendorErrorCode: 'E42',
        timestamp: TIMESTAMP,
      });
    });

    it('links the StatusNotification to the Connector it updated', async () => {
      const connector = await Connector.findOne({ where: { stationId, connectorId: 2 } });

      await locationRepository.addStatusNotificationToChargingStation(
        DEFAULT_TENANT_ID,
        OCPP_CONNECTION_NAME,
        StatusNotification.build({
          tenantId: DEFAULT_TENANT_ID,
          evseId: 1,
          connectorId: 2,
          connectorDatabaseId: connector!.id,
          connectorStatus: 'Available',
          timestamp: TIMESTAMP,
        }),
      );

      const [row] = await StatusNotification.findAll({ include: [Connector] });
      expect(row.connectorId).toBe(2);
      expect(row.connector!.id).toBe(connector!.id);
    });
  });

  describe('addOcpp16ConnectorStatusNotification', () => {
    it('updates the connector and links it to the status both ways', async () => {
      const existing = await Connector.findOne({ where: { stationId, connectorId: 2 } });

      const { statusNotification, connector } =
        await locationRepository.addOcpp16ConnectorStatusNotification(
          DEFAULT_TENANT_ID,
          OCPP_CONNECTION_NAME,
          { tenantId: DEFAULT_TENANT_ID, stationId, evseId, connectorId: 2, status: 'Faulted' },
          {
            tenantId: DEFAULT_TENANT_ID,
            connectorId: 2,
            connectorStatus: 'Faulted',
            timestamp: TIMESTAMP,
          },
        );

      expect(connector.id).toBe(existing!.id);
      expect(connector.status).toBe('Faulted');
      expect(connector.latestStatusNotificationId).toBe(statusNotification.id);
      expect(statusNotification.connectorDatabaseId).toBe(existing!.id);
    });

    it('moves the connector pointer to a newer status notification', async () => {
      const connector = { tenantId: DEFAULT_TENANT_ID, stationId, evseId, connectorId: 1 };
      const statusNotification = {
        tenantId: DEFAULT_TENANT_ID,
        connectorId: 1,
        timestamp: TIMESTAMP,
      };

      await locationRepository.addOcpp16ConnectorStatusNotification(
        DEFAULT_TENANT_ID,
        OCPP_CONNECTION_NAME,
        connector,
        { ...statusNotification, connectorStatus: 'Occupied' },
      );
      const { statusNotification: newer } =
        await locationRepository.addOcpp16ConnectorStatusNotification(
          DEFAULT_TENANT_ID,
          OCPP_CONNECTION_NAME,
          connector,
          { ...statusNotification, connectorStatus: 'Available' },
        );

      const row = await Connector.findOne({
        where: { stationId, connectorId: 1 },
        include: [{ model: StatusNotification, as: 'latestStatusNotification' }],
      });
      expect(row!.latestStatusNotificationId).toBe(newer.id);
      expect(row!.latestStatusNotification!.connectorStatus).toBe('Available');
      expect(await StatusNotification.count()).toBe(2);
    });

    it('rolls the connector update back when the status notification cannot be saved', async () => {
      const existing = await Connector.findOne({ where: { stationId, connectorId: 2 } });

      await expect(
        locationRepository.addOcpp16ConnectorStatusNotification(
          DEFAULT_TENANT_ID,
          OCPP_CONNECTION_NAME,
          { tenantId: DEFAULT_TENANT_ID, stationId, evseId, connectorId: 2, status: 'Faulted' },
          {
            tenantId: DEFAULT_TENANT_ID,
            connectorId: 2,
            connectorStatus: 'Faulted',
            timestamp: TIMESTAMP,
            info: 'x'.repeat(300),
          },
        ),
      ).rejects.toThrow();

      const row = await Connector.findByPk(existing!.id);
      expect(row!.status).toBe(existing!.status);
      expect(row!.latestStatusNotificationId).toBeNull();
      expect(await StatusNotification.count()).toBe(0);
    });
  });

  describe('addOcpp2ConnectorStatusNotification', () => {
    it('creates an unknown connector and links it to the status both ways', async () => {
      const { statusNotification, connector } =
        await locationRepository.addOcpp2ConnectorStatusNotification(
          DEFAULT_TENANT_ID,
          OCPP_CONNECTION_NAME,
          { tenantId: DEFAULT_TENANT_ID, stationId, evseId, evseTypeConnectorId: 3 },
          {
            tenantId: DEFAULT_TENANT_ID,
            evseId: 1,
            connectorId: 3,
            connectorStatus: 'Available',
            timestamp: TIMESTAMP,
          },
        );

      expect(await Connector.count()).toBe(3);
      expect(connector.evseTypeConnectorId).toBe(3);
      expect(connector.latestStatusNotificationId).toBe(statusNotification.id);
      expect(statusNotification.connectorDatabaseId).toBe(connector.id);
    });
  });

  describe('addOcpp16StationStatusNotification', () => {
    it('points every connector at the status and keeps their own numbers', async () => {
      const { statusNotification, connectors } =
        await locationRepository.addOcpp16StationStatusNotification(
          DEFAULT_TENANT_ID,
          OCPP_CONNECTION_NAME,
          { tenantId: DEFAULT_TENANT_ID, connectorId: undefined, status: 'Unavailable' },
          {
            tenantId: DEFAULT_TENANT_ID,
            connectorId: 0,
            connectorStatus: 'Unavailable',
            timestamp: TIMESTAMP,
          },
        );

      expect(statusNotification.connectorDatabaseId ?? null).toBeNull();
      expect(connectors).toHaveLength(2);
      const rows = await Connector.findAll({ order: [['connectorId', 'ASC']] });
      expect(rows.map((r) => r.connectorId)).toEqual([1, 2]);
      expect(rows.map((r) => r.status)).toEqual(['Unavailable', 'Unavailable']);
      expect(rows.map((r) => r.latestStatusNotificationId)).toEqual([
        statusNotification.id,
        statusNotification.id,
      ]);
    });
  });
});
