// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  type OCPP2_response_types,
  OCPPVersion,
  SetNetworkProfileStatusEnum,
  type SystemConfig,
} from '@citrineos/types';
import {
  ChargingStation,
  ChargingStationNetworkProfile,
  DefaultSequelizeInstance,
  ServerNetworkProfile,
  SetNetworkProfile,
  Tenant,
} from '@dal/index.js';
import { SetNetworkProfileResponseOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * prepareSetNetworkProfile mints one correlation id for the whole batch and writes a
 * SetNetworkProfile row per station under it, so the response handler has to pick out the row
 * belonging to the station that answered.
 */
const CORRELATION_ID = 'corr-shared';
const STATION_A = 'CP-A';
const STATION_B = 'CP-B';
const PROFILE_ID = 'websocket-server-0';

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
  } as unknown as SystemConfig);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

function aResponse(
  ocppConnectionName: string,
): IMessage<OCPP2_response_types.SetNetworkProfileResponse> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName,
      correlationId: CORRELATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload: { status: SetNetworkProfileStatusEnum.Accepted },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Configuration,
    action: OCPP_CallAction.SetNetworkProfile,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<OCPP2_response_types.SetNetworkProfileResponse>;
}

async function aSetNetworkProfileRow(ocppConnectionName: string, configurationSlot: number) {
  return SetNetworkProfile.build({
    ocppConnectionName,
    correlationId: CORRELATION_ID,
    configurationSlot,
    websocketServerConfigId: PROFILE_ID,
    ocppVersion: OCPP2_0_1.OCPPVersionEnumType.OCPP20,
    ocppTransport: OCPP2_0_1.OCPPTransportEnumType.JSON,
    ocppCsmsUrl: 'ws://localhost:8080',
    messageTimeout: 30,
    securityProfile: 1,
    ocppInterface: OCPP2_0_1.OCPPInterfaceEnumType.Wired0,
    tenantId: DEFAULT_TENANT_ID,
  } as never).save();
}

describe('SetNetworkProfileResponseOcpp2Handler with a batched correlation id', () => {
  const { container } = createTestContainer();

  beforeEach(async () => {
    await ChargingStationNetworkProfile.destroy({ where: {}, truncate: true, cascade: true });
    await SetNetworkProfile.destroy({ where: {}, truncate: true, cascade: true });
    await ChargingStation.destroy({ where: {}, truncate: true, cascade: true });
    await ServerNetworkProfile.destroy({ where: {}, truncate: true, cascade: true });
    await Tenant.destroy({ where: {}, truncate: true, cascade: true });

    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await ServerNetworkProfile.create({
      id: PROFILE_ID,
      host: 'localhost',
      port: 8080,
      pingInterval: 60,
      protocols: [OCPPVersion.OCPP2_0_1],
      messageTimeout: 30,
      securityProfile: 1,
      allowUnknownChargingStations: false,
      dynamicTenantResolution: false,
      tenantId: DEFAULT_TENANT_ID,
    } as never);

    for (const name of [STATION_A, STATION_B]) {
      await ChargingStation.create({
        ocppConnectionName: name,
        isOnline: false,
        tenantId: DEFAULT_TENANT_ID,
      } as never);
    }

    // One row per station under the one correlation id, exactly as prepareSetNetworkProfile
    // writes them: same slot and same profile, differing only by station.
    await aSetNetworkProfileRow(STATION_A, 1);
    await aSetNetworkProfileRow(STATION_B, 1);
  });

  it('links the station to the request that was sent to it', async () => {
    const handler = getTestInstance(container, SetNetworkProfileResponseOcpp2Handler, {});

    await handler.handle(aResponse(STATION_B));

    const stored = await ChargingStationNetworkProfile.findOne({
      where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName: STATION_B },
    });
    const ownRow = await SetNetworkProfile.findOne({
      where: { tenantId: DEFAULT_TENANT_ID, ocppConnectionName: STATION_B },
    });

    expect(stored).not.toBeNull();
    expect(stored!.setNetworkProfileId).toBe(ownRow!.id);
  });
});
