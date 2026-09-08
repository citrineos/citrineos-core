// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { type BootstrapConfig, DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPPVersion } from '@citrineos/types';
import {
  ChargingStation,
  DefaultSequelizeInstance,
  Evse,
  EvseType,
  SequelizeDeviceModelRepository,
  SequelizeLocationRepository,
  Tenant,
} from '@citrineos/dal';
import { GetCompositeScheduleEndpoint } from '@/apis/ocpp/2/smart-charging/get-composite-schedule-endpoint.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

/**
 * A depot runs a mixed estate: a six-EVSE charger next to single-EVSE units. Asking a single-EVSE
 * station for EVSE 5's composite schedule has to be refused by that station's own EVSEs, not by
 * whether any station in the tenant happens to have one.
 */
const SIX_EVSE_STATION = 'CS-GUARD-SIX';
const SINGLE_EVSE_STATION = 'CS-GUARD-ONE';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let locationRepository: SequelizeLocationRepository;
let deviceModelRepository: SequelizeDeviceModelRepository;

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

  const dependencies = { config, logger: undefined, sequelizeInstance } as never;
  locationRepository = new SequelizeLocationRepository(dependencies);
  deviceModelRepository = new SequelizeDeviceModelRepository(dependencies);
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

async function aStationWithEvses(ocppConnectionName: string, evseNumbers: number[]) {
  await ChargingStation.create({
    ocppConnectionName,
    isOnline: true,
    tenantId: DEFAULT_TENANT_ID,
  } as never);
  for (const evseNumber of evseNumbers) {
    await EvseType.findOrCreate({
      where: { tenantId: DEFAULT_TENANT_ID, id: evseNumber, connectorId: null },
      defaults: { tenantId: DEFAULT_TENANT_ID, id: evseNumber, connectorId: null } as never,
    });
    await Evse.create({
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName,
      evseTypeId: evseNumber,
    } as never);
  }
}

describe('Asking a station for one of its EVSEs', () => {
  const { container } = createTestContainer();
  let sendCall: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    sendCall = vi.fn().mockResolvedValue({ success: true, payload: 'queued' });

    await aStationWithEvses(SIX_EVSE_STATION, [1, 2, 3, 4, 5, 6]);
    await aStationWithEvses(SINGLE_EVSE_STATION, [1]);
  });

  function handle(ocppConnectionName: string, evseId: number) {
    return getTestInstance(container, GetCompositeScheduleEndpoint, {
      ocppSender: { sendCall },
      deviceModelRepository,
      locationRepository,
    }).handle(
      [ocppConnectionName],
      { duration: 60, evseId },
      undefined,
      DEFAULT_TENANT_ID,
      OCPPVersion.OCPP2_0_1,
    );
  }

  it('refuses an EVSE the station does not have, however many the tenant does', async () => {
    const confirmations = await handle(SINGLE_EVSE_STATION, 5);

    expect(confirmations[0].success).toBe(false);
    expect(String(confirmations[0].payload)).toContain(
      `EVSE 5 not found for station ${SINGLE_EVSE_STATION}`,
    );
    expect(sendCall).not.toHaveBeenCalled();
  });

  it('sends for an EVSE the station does have', async () => {
    const confirmations = await handle(SIX_EVSE_STATION, 5);

    expect(confirmations[0].success).toBe(true);
    expect(sendCall).toHaveBeenCalled();
  });
});
