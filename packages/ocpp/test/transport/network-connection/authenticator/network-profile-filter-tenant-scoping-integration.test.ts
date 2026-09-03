// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { AuthenticationOptions, BootstrapConfig } from '@citrineos/base';
import { OCPP2_0_1, OCPPVersion } from '@citrineos/types';
import {
  ChargingStation,
  ChargingStationNetworkProfile,
  DefaultSequelizeInstance,
  ServerNetworkProfile,
  SetNetworkProfile,
  Tenant,
} from '@citrineos/dal';
import type { IDeviceModelRepository } from '@citrineos/dal';
import { NetworkProfileFilter } from '@/transport/network-connection/authenticator/network-profile-filter.js';
import type { IncomingMessage } from 'http';
import { Logger } from 'tslog';

/**
 * ServerNetworkProfile has a tenantId, but its primary key is an operator-chosen string shared
 * across the whole table. A profile id named by one tenant's ChargingStationNetworkProfile can
 * therefore belong to another tenant, and this filter gates a websocket connection on the
 * securityProfile it finds there.
 */
const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'CP001';
const SHARED_PROFILE_ID = 'websocket-server-0';
const SET_NETWORK_PROFILE_ID = 123;
const CONFIGURATION_SLOT = 1;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;

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
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

/** Exposes the protected filter hook. */
class TestNetworkProfileFilter extends NetworkProfileFilter {
  public check(tenantId: number, identifier: string, securityProfile: number): Promise<void> {
    return this['filter'](
      tenantId,
      identifier,
      {} as IncomingMessage,
      { securityProfile } as AuthenticationOptions,
    );
  }
}

function aFilter(): TestNetworkProfileFilter {
  const deviceModelRepository = {
    readAllByQuerystring: vi.fn().mockResolvedValue([{ value: String(CONFIGURATION_SLOT) }]),
  } as unknown as IDeviceModelRepository;

  return new TestNetworkProfileFilter({
    deviceModelRepository,
    logger: new Logger({ type: 'hidden' }),
  });
}

describe('NetworkProfileFilter tenant scoping', () => {
  beforeEach(async () => {
    await ChargingStationNetworkProfile.destroy({ where: {}, truncate: true, cascade: true });
    await ChargingStation.destroy({ where: {}, truncate: true, cascade: true });
    await ServerNetworkProfile.destroy({ where: {}, truncate: true, cascade: true });
    await Tenant.destroy({ where: {}, truncate: true, cascade: true });

    await Tenant.create({ id: TENANT_A, name: 'A' } as never);
    await Tenant.create({ id: TENANT_B, name: 'B' } as never);

    // Only tenant B owns this profile, and it permits security profile 1.
    await ServerNetworkProfile.create({
      id: SHARED_PROFILE_ID,
      host: 'localhost',
      port: 8080,
      pingInterval: 60,
      protocols: [OCPPVersion.OCPP2_0_1],
      messageTimeout: 30,
      securityProfile: 1,
      allowUnknownChargingStations: false,
      dynamicTenantResolution: false,
      tenantId: TENANT_B,
    } as never);

    const station = await ChargingStation.create({
      ocppConnectionName: STATION,
      isOnline: false,
      tenantId: TENANT_A,
    } as never);

    await SetNetworkProfile.create({
      id: SET_NETWORK_PROFILE_ID,
      ocppConnectionName: STATION,
      correlationId: 'any-correlation-id',
      configurationSlot: 1,
      ocppVersion: OCPP2_0_1.OCPPVersionEnumType.OCPP20,
      ocppTransport: OCPP2_0_1.OCPPTransportEnumType.JSON,
      ocppCsmsUrl: 'url',
      messageTimeout: 30,
      securityProfile: 0,
      ocppInterface: OCPP2_0_1.OCPPInterfaceEnumType.Wired1,
      tenantId: TENANT_A,
    });

    // Tenant A's station names it anyway. Nothing validates the reference on the way in.
    await ChargingStationNetworkProfile.create({
      stationId: (station as unknown as { id: number }).id,
      ocppConnectionName: STATION,
      configurationSlot: CONFIGURATION_SLOT,
      websocketServerConfigId: SHARED_PROFILE_ID,
      tenantId: TENANT_A,
      setNetworkProfileId: SET_NETWORK_PROFILE_ID,
    } as never);
  });

  it('refuses a station whose profile reference resolves to another tenant', async () => {
    await expect(aFilter().check(TENANT_A, STATION, 1)).rejects.toThrow(/SecurityProfile/);
  });

  it('allows the station once the profile belongs to its own tenant', async () => {
    await ServerNetworkProfile.create({
      id: 'websocket-server-a',
      host: 'localhost',
      port: 8080,
      pingInterval: 60,
      protocols: [OCPPVersion.OCPP2_0_1],
      messageTimeout: 30,
      securityProfile: 1,
      allowUnknownChargingStations: false,
      dynamicTenantResolution: false,
      tenantId: TENANT_A,
    } as never);
    await ChargingStationNetworkProfile.update(
      { websocketServerConfigId: 'websocket-server-a' },
      { where: { tenantId: TENANT_A, ocppConnectionName: STATION } },
    );

    await expect(aFilter().check(TENANT_A, STATION, 1)).resolves.toBeUndefined();
  });
});
