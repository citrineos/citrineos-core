// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPPVersion } from '@citrineos/types';
import {
  ChargingStation,
  Connector,
  DefaultSequelizeInstance,
  Evse,
  DrizzleChargingStationRepository,
  SequelizeLocationRepository,
  ServerNetworkProfile,
  Tenant,
} from '@dal/index.js';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

/**
 * readChargingStationByTenantAndOcppConnectionName is the contract-critical method here: the Sequelize
 * layer eager-loads two levels (`include: [{ model: Evse, include: [Connector] }]`) and
 * StatusNotificationService walks station.evses[].connectors[] to match an incoming
 * status to a connector. A flat Drizzle row carries no relations, so the nesting is
 * stitched in the repository — and asserted below.
 */
const STATION = 'cs-drizzle-1';
const OTHER_TENANT_ID = DEFAULT_TENANT_ID + 1;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let drizzleInstance: NodePgDatabase;
let drizzlePool: pg.Pool;
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

  // Both layers describe the same schema; Sequelize is used to create it.
  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });

  // Own the pool here rather than the shared singleton, which exposes no way to close it.
  drizzlePool = new pg.Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.username,
    password: config.database.password,
  });
  drizzleInstance = drizzle(drizzlePool);

  locationRepository = new SequelizeLocationRepository({
    config,
    sequelizeInstance,
  });
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

function aRepository(): DrizzleChargingStationRepository {
  return new DrizzleChargingStationRepository({ config, drizzleInstance });
}

// The Evse/EvseType/Connector FK graph is fiddly to build by hand; the Sequelize
// repository already has a helper that returns FK-valid ids, so seeding goes through it.
let locationRepository: SequelizeLocationRepository;

async function aConnector(
  stationId: number,
  evseId: number,
  connectorId: number,
  evseTypeConnectorId: number,
): Promise<void> {
  await Connector.create({
    stationId,
    evseId,
    connectorId,
    evseTypeConnectorId,
    ocppConnectionName: STATION,
    status: 'Available',
    errorCode: 'NoError',
    timestamp: new Date().toISOString(),
    tenantId: DEFAULT_TENANT_ID,
  } as never);
}

describe('DrizzleChargingStationRepository', () => {
  let stationId: number;
  let primaryEvseId: number;

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await Tenant.create({ id: OTHER_TENANT_ID, name: 'B' } as never);

    const station = await ChargingStation.create({
      ocppConnectionName: STATION,
      isOnline: true,
      protocol: OCPPVersion.OCPP2_0_1,
      chargePointVendor: 'ACME',
      tenantId: DEFAULT_TENANT_ID,
    } as never);
    stationId = (station as unknown as { id: number }).id;

    // Two commissioned connectors give two FK-valid evseTypeConnectorIds. Both Connector
    // rows are hung off the FIRST evse so the test covers grouping (an evse with two
    // connectors) and the empty case (an evse with none) in the same fixture.
    const first = await locationRepository.commissionEvseForOcpp16Connector(
      DEFAULT_TENANT_ID,
      STATION,
      1,
    );
    const second = await locationRepository.commissionEvseForOcpp16Connector(
      DEFAULT_TENANT_ID,
      STATION,
      2,
    );
    primaryEvseId = first.evseId;
    await aConnector(stationId, first.evseId, 1, first.evseTypeConnectorId);
    await aConnector(stationId, first.evseId, 2, second.evseTypeConnectorId);
  });

  describe('readChargingStationByTenantAndOcppConnectionName', () => {
    it('maps the scalar columns', async () => {
      const found = await aRepository().readChargingStationByTenantAndOcppConnectionName(
        DEFAULT_TENANT_ID,
        STATION,
      );

      expect(found).toBeDefined();
      expect(found!.ocppConnectionName).toBe(STATION);
      expect(found!.isOnline).toBe(true);
      expect(found!.protocol).toBe(OCPPVersion.OCPP2_0_1);
      expect(found!.chargePointVendor).toBe('ACME');
    });

    it('nests connectors under their own evse, the shape callers walk', async () => {
      const found = await aRepository().readChargingStationByTenantAndOcppConnectionName(
        DEFAULT_TENANT_ID,
        STATION,
      );

      expect(found!.evses).toHaveLength(2);

      const withConnectors = found!.evses!.find((evse) => evse.id === primaryEvseId);
      expect(withConnectors!.connectors?.map((c) => c.connectorId).sort()).toEqual([1, 2]);

      // Grouping must not smear every connector across every evse.
      const withoutConnectors = found!.evses!.find((evse) => evse.id !== primaryEvseId);
      expect(withoutConnectors!.connectors).toEqual([]);
    });

    it('returns an empty evse list for a station with none', async () => {
      await Connector.destroy({ where: {}, truncate: true, cascade: true });
      await Evse.destroy({ where: {}, truncate: true, cascade: true });

      const found = await aRepository().readChargingStationByTenantAndOcppConnectionName(
        DEFAULT_TENANT_ID,
        STATION,
      );

      expect(found).toBeDefined();
      expect(found!.evses).toEqual([]);
    });

    it('does not read a station belonging to another tenant', async () => {
      const found = await aRepository().readChargingStationByTenantAndOcppConnectionName(
        OTHER_TENANT_ID,
        STATION,
      );

      expect(found).toBeUndefined();
    });
  });

  describe('doesChargingStationExistByStationId', () => {
    it('is true for a known station and false for an unknown one', async () => {
      const repo = aRepository();

      await expect(
        repo.doesChargingStationExistByStationId(DEFAULT_TENANT_ID, STATION),
      ).resolves.toBe(true);
      await expect(
        repo.doesChargingStationExistByStationId(DEFAULT_TENANT_ID, 'nope'),
      ).resolves.toBe(false);
    });

    it('is false for a station that exists under a different tenant', async () => {
      await expect(
        aRepository().doesChargingStationExistByStationId(OTHER_TENANT_ID, STATION),
      ).resolves.toBe(false);
    });
  });

  describe('setChargingStationIsOnlineAndOCPPVersion', () => {
    it('updates an existing station and records the websocket server', async () => {
      // ChargingStations.connectedWebsocketServerConfigId is an FK into ServerNetworkProfiles.
      await ServerNetworkProfile.create({
        id: 'server-7',
        host: '0.0.0.0',
        port: 8081,
        pingInterval: 60,
        protocols: ['ocpp2.0.1'],
        messageTimeout: 30,
        securityProfile: 0,
        allowUnknownChargingStations: true,
        dynamicTenantResolution: false,
        tenantId: DEFAULT_TENANT_ID,
      } as never);

      const updated = await aRepository().setChargingStationIsOnlineAndOCPPVersion(
        DEFAULT_TENANT_ID,
        STATION,
        false,
        OCPPVersion.OCPP1_6,
        'server-7',
      );

      expect(updated).toBeDefined();
      expect(updated!.isOnline).toBe(false);
      expect(updated!.protocol).toBe(OCPPVersion.OCPP1_6);

      const row = await ChargingStation.findOne({ where: { ocppConnectionName: STATION } });
      expect(
        (row as unknown as { connectedWebsocketServerConfigId: string })
          .connectedWebsocketServerConfigId,
      ).toBe('server-7');
    });

    it('creates the station when an unknown one comes online', async () => {
      const created = await aRepository().setChargingStationIsOnlineAndOCPPVersion(
        DEFAULT_TENANT_ID,
        'brand-new',
        true,
        OCPPVersion.OCPP2_0_1,
      );

      expect(created).toBeDefined();
      expect(created!.ocppConnectionName).toBe('brand-new');
      expect(created!.isOnline).toBe(true);
    });

    it('does not create a station for an unknown one going offline', async () => {
      const result = await aRepository().setChargingStationIsOnlineAndOCPPVersion(
        DEFAULT_TENANT_ID,
        'never-seen',
        false,
        null,
      );

      expect(result).toBeUndefined();
      await expect(
        ChargingStation.count({ where: { ocppConnectionName: 'never-seen' } }),
      ).resolves.toBe(0);
    });
  });

  describe('createOrUpdateChargingStation', () => {
    it('updates the identifying columns of an existing station', async () => {
      const saved = await aRepository().createOrUpdateChargingStation(DEFAULT_TENANT_ID, {
        ocppConnectionName: STATION,
        isOnline: true,
        chargePointVendor: 'NewVendor',
        chargePointModel: 'Model-9',
      } as never);

      expect(saved.id).toBe(stationId);
      expect(saved.chargePointVendor).toBe('NewVendor');
      expect(saved.chargePointModel).toBe('Model-9');
      // Only one row — an upsert, not an insert.
      await expect(ChargingStation.count({ where: { ocppConnectionName: STATION } })).resolves.toBe(
        1,
      );
    });

    it('inserts a station that does not exist yet', async () => {
      const saved = await aRepository().createOrUpdateChargingStation(DEFAULT_TENANT_ID, {
        ocppConnectionName: 'fresh-station',
        isOnline: false,
        chargePointVendor: 'ACME',
      } as never);

      expect(saved.id).not.toBe(stationId);
      expect(saved.ocppConnectionName).toBe('fresh-station');
    });
  });

  describe('updateChargingStationTimestamp', () => {
    it('stores the latest OCPP message timestamp', async () => {
      const when = '2026-03-04T05:06:07.000Z';

      await aRepository().updateChargingStationTimestamp(DEFAULT_TENANT_ID, STATION, when);

      const found = await aRepository().readChargingStationByTenantAndOcppConnectionName(
        DEFAULT_TENANT_ID,
        STATION,
      );
      expect(found!.latestOcppMessageTimestamp).toBe(when);
    });
  });
});
