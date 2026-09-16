// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import {
  DefaultSequelizeInstance,
  SequelizeLocationRepository,
  StatusNotification,
} from '../../../index.js';
import { Tenant } from '../../../src/models/tenant.js';
import { ChargingStation } from '../../../src/models/location/charging-station.js';
import { Connector } from '../../../src/models/location/connector.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const OCPP_CONNECTION_NAME = 'CS-STATUS';
const TIMESTAMP = '2026-09-15T10:00:00.000Z';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let locationRepository: SequelizeLocationRepository;
let stationId: number;

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
  for (const connectorId of [1, 2]) {
    await Connector.create({
      tenantId: DEFAULT_TENANT_ID,
      stationId,
      ocppConnectionName: OCPP_CONNECTION_NAME,
      connectorId,
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
          ocppConnectionName: OCPP_CONNECTION_NAME,
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
        ocppConnectionName: OCPP_CONNECTION_NAME,
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
          ocppConnectionName: OCPP_CONNECTION_NAME,
          connectorId: 2,
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
        ocppConnectionName: OCPP_CONNECTION_NAME,
        connectorId: 2,
        connectorStatus: 'Faulted',
        errorCode: 'GroundFailure',
        info: 'RCD tripped',
        vendorId: 'com.example',
        vendorErrorCode: 'E42',
        timestamp: TIMESTAMP,
      });
    });

    it('keeps a latest status notification for each connector of the station', async () => {
      for (const connectorId of [1, 2]) {
        await locationRepository.addStatusNotificationToChargingStation(
          DEFAULT_TENANT_ID,
          OCPP_CONNECTION_NAME,
          StatusNotification.build({
            tenantId: DEFAULT_TENANT_ID,
            ocppConnectionName: OCPP_CONNECTION_NAME,
            evseId: 1,
            connectorId,
            connectorStatus: 'Available',
            timestamp: TIMESTAMP,
          }),
        );
      }

      const latest = await locationRepository.latestStatusNotification.readAllByQuery(
        DEFAULT_TENANT_ID,
        { where: { stationId }, include: [StatusNotification] },
      );
      expect(latest.map((l) => l.statusNotification.connectorId).sort()).toEqual([1, 2]);
    });
  });
});
