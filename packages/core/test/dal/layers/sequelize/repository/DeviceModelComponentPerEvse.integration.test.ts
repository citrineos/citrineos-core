// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { type BootstrapConfig, DEFAULT_TENANT_ID } from '@citrineos/base';
import { AttributeEnum, OCPP2_0_1 } from '@citrineos/types';
import {
  ChargingStation,
  Component,
  DefaultSequelizeInstance,
  SequelizeDeviceModelRepository,
  Tenant,
} from '@dal/index.js';

/**
 * An OCPP 2.0.1 station reports the same component name once per EVSE, telling them apart by the
 * component's evse. Identifying a component by name and instance alone therefore collapses every
 * EVSE onto one row, and the variable attributes hanging off it collapse with it.
 */
const STATION = 'CS-DEVICE-MODEL-1';
const AVAILABILITY = 'AvailabilityState';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
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

  deviceModelRepository = new SequelizeDeviceModelRepository({
    config,
    logger: undefined,
    sequelizeInstance,
  } as never);
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

/** What a station sends for one of its EVSEs in a NotifyReport. */
async function reportEvseState(evseId: number, state: string) {
  await deviceModelRepository.createOrUpdateDeviceModelByStationId(
    DEFAULT_TENANT_ID,
    {
      component: { name: 'EVSE', evse: { id: evseId } },
      variable: { name: AVAILABILITY },
      variableAttribute: [{ type: OCPP2_0_1.AttributeEnumType.Actual, value: state }],
    },
    STATION,
    new Date().toISOString(),
  );
}

function readEvseState(evseId: number) {
  return deviceModelRepository.readAllByQuerystring(DEFAULT_TENANT_ID, {
    tenantId: DEFAULT_TENANT_ID,
    ocppConnectionName: STATION,
    component_name: 'EVSE',
    component_evse_id: evseId,
    variable_name: AVAILABILITY,
    type: AttributeEnum.Actual,
  });
}

describe('A station reporting the same component for more than one EVSE', () => {
  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await ChargingStation.create({
      ocppConnectionName: STATION,
      isOnline: true,
      tenantId: DEFAULT_TENANT_ID,
    } as never);

    await reportEvseState(1, 'Available');
    await reportEvseState(2, 'Occupied');
  });

  it('keeps one component per EVSE', async () => {
    const components = await Component.findAll({ where: { name: 'EVSE' } });

    expect(components).toHaveLength(2);
  });

  it('keeps the state each EVSE reported', async () => {
    const [firstEvse] = await readEvseState(1);
    const [secondEvse] = await readEvseState(2);

    expect(firstEvse?.value).toBe('Available');
    expect(secondEvse?.value).toBe('Occupied');
  });

  it('resolves the component and variable for one EVSE', async () => {
    const [component, variable] = await deviceModelRepository.findComponentAndVariable(
      DEFAULT_TENANT_ID,
      { name: 'EVSE', evse: { id: 2 } },
      { name: AVAILABILITY },
    );

    expect(variable).toBeDefined();
    expect(component?.evse?.id).toBe(2);
  });
});
