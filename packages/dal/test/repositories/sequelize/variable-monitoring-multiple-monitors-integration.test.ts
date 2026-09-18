// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP2_0_1, type SystemConfig } from '@citrineos/types';
import {
  Component,
  DefaultSequelizeInstance,
  SequelizeVariableMonitoringRepository,
  Variable,
} from '@citrineos/dal';
import { ChargingStation, Tenant } from '@dal/db/sequelize/index.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const TENANT_ID = DEFAULT_TENANT_ID;
const OCPP_CONNECTION_NAME = 'CS-001';
const { UpperThreshold, LowerThreshold } = OCPP2_0_1.MonitorEnumType;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
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
}, 90_000);

afterAll(async () => {
  await sequelizeInstance.close();
  await pgContainer.stop();
});

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
});

function makeRepo(): SequelizeVariableMonitoringRepository {
  return new SequelizeVariableMonitoringRepository({
    config: {} as SystemConfig,
    sequelizeInstance,
  });
}

async function seedEvsePower(): Promise<{ componentId: string; variableId: string }> {
  await Tenant.create({ id: TENANT_ID as any, name: String(TENANT_ID) });
  const station = await ChargingStation.create({
    ocppConnectionName: OCPP_CONNECTION_NAME,
    isOnline: false,
    tenantId: TENANT_ID,
  });
  stationId = station.id;
  const component = await Component.create({ name: 'EVSE', tenantId: TENANT_ID });
  const variable = await Variable.create({ name: 'Power', tenantId: TENANT_ID });
  return { componentId: String(component.id), variableId: String(variable.id) };
}

function aSetMonitoringData(
  type: OCPP2_0_1.MonitorEnumType,
  value: number,
  id?: number,
): OCPP2_0_1.SetMonitoringDataType {
  return {
    ...(id !== undefined ? { id } : {}),
    value,
    type,
    severity: 4,
    component: { name: 'EVSE' },
    variable: { name: 'Power' },
  };
}

function anAcceptedResult(
  id: number,
  type: OCPP2_0_1.MonitorEnumType,
): OCPP2_0_1.SetMonitoringResultType {
  return {
    id,
    status: OCPP2_0_1.SetMonitoringStatusEnumType.Accepted,
    type,
    severity: 4,
    component: { name: 'EVSE' },
    variable: { name: 'Power' },
  };
}

async function monitorsOnStation() {
  return makeRepo().readAllByQuery(TENANT_ID, {
    where: { stationId },
    order: [['databaseId', 'ASC']],
  });
}

describe('SequelizeVariableMonitoringRepository with more than one monitor on a variable', () => {
  it('keeps a row for each new monitor set on the same variable', async () => {
    const { componentId, variableId } = await seedEvsePower();
    const repo = makeRepo();

    await repo.createOrUpdateBySetMonitoringDataTypeAndStationId(
      TENANT_ID,
      aSetMonitoringData(UpperThreshold, 22000),
      componentId,
      variableId,
      OCPP_CONNECTION_NAME,
    );
    await repo.createOrUpdateBySetMonitoringDataTypeAndStationId(
      TENANT_ID,
      aSetMonitoringData(LowerThreshold, 100),
      componentId,
      variableId,
      OCPP_CONNECTION_NAME,
    );

    const rows = await monitorsOnStation();
    expect(rows.map((row) => [row.type, row.value])).toEqual([
      [UpperThreshold, 22000],
      [LowerThreshold, 100],
    ]);
  });

  it('stores the id the station assigned to each monitor', async () => {
    const { componentId, variableId } = await seedEvsePower();
    const repo = makeRepo();
    await repo.createOrUpdateBySetMonitoringDataTypeAndStationId(
      TENANT_ID,
      aSetMonitoringData(UpperThreshold, 22000),
      componentId,
      variableId,
      OCPP_CONNECTION_NAME,
    );
    await repo.createOrUpdateBySetMonitoringDataTypeAndStationId(
      TENANT_ID,
      aSetMonitoringData(LowerThreshold, 100),
      componentId,
      variableId,
      OCPP_CONNECTION_NAME,
    );

    await repo.updateResultByStationId(
      TENANT_ID,
      anAcceptedResult(11, UpperThreshold),
      OCPP_CONNECTION_NAME,
    );
    await repo.updateResultByStationId(
      TENANT_ID,
      anAcceptedResult(12, LowerThreshold),
      OCPP_CONNECTION_NAME,
    );

    const rows = await monitorsOnStation();
    expect(rows.map((row) => [row.type, row.id])).toEqual([
      [UpperThreshold, 11],
      [LowerThreshold, 12],
    ]);
  });

  it('replaces the monitor whose id is given', async () => {
    const { componentId, variableId } = await seedEvsePower();
    const repo = makeRepo();
    await repo.createOrUpdateBySetMonitoringDataTypeAndStationId(
      TENANT_ID,
      aSetMonitoringData(UpperThreshold, 22000),
      componentId,
      variableId,
      OCPP_CONNECTION_NAME,
    );
    await repo.updateResultByStationId(
      TENANT_ID,
      anAcceptedResult(11, UpperThreshold),
      OCPP_CONNECTION_NAME,
    );

    await repo.createOrUpdateBySetMonitoringDataTypeAndStationId(
      TENANT_ID,
      aSetMonitoringData(UpperThreshold, 30000, 11),
      componentId,
      variableId,
      OCPP_CONNECTION_NAME,
    );

    const rows = await monitorsOnStation();
    expect(rows.map((row) => [row.id, row.type, row.value])).toEqual([[11, UpperThreshold, 30000]]);
  });

  it('records a Duplicate answer against the new monitor and leaves the installed one alone', async () => {
    const { componentId, variableId } = await seedEvsePower();
    const repo = makeRepo();
    await repo.createOrUpdateBySetMonitoringDataTypeAndStationId(
      TENANT_ID,
      aSetMonitoringData(UpperThreshold, 22000),
      componentId,
      variableId,
      OCPP_CONNECTION_NAME,
    );
    await repo.updateResultByStationId(
      TENANT_ID,
      anAcceptedResult(11, UpperThreshold),
      OCPP_CONNECTION_NAME,
    );
    await repo.createOrUpdateBySetMonitoringDataTypeAndStationId(
      TENANT_ID,
      aSetMonitoringData(UpperThreshold, 30000),
      componentId,
      variableId,
      OCPP_CONNECTION_NAME,
    );

    const answered = await repo.updateResultByStationId(
      TENANT_ID,
      {
        status: OCPP2_0_1.SetMonitoringStatusEnumType.Duplicate,
        type: UpperThreshold,
        severity: 4,
        component: { name: 'EVSE' },
        variable: { name: 'Power' },
      },
      OCPP_CONNECTION_NAME,
    );

    expect(answered.value).toBe(30000);
    const rows = await monitorsOnStation();
    expect(rows.map((row) => [row.id, row.value])).toEqual([
      [11, 22000],
      [null, 30000],
    ]);
  });

  it('updates each reported monitor on its own row', async () => {
    const { componentId, variableId } = await seedEvsePower();
    for (const [id, type, value] of [
      [11, UpperThreshold, 22000],
      [12, LowerThreshold, 100],
    ] as const) {
      await sequelizeInstance.models.VariableMonitoring.create({
        tenantId: TENANT_ID,
        stationId,
        componentId,
        variableId,
        id,
        type,
        value,
        severity: 4,
        transaction: false,
      });
    }

    await makeRepo().createOrUpdateByMonitoringDataTypeAndStationId(
      TENANT_ID,
      {
        component: { name: 'EVSE' },
        variable: { name: 'Power' },
        variableMonitoring: [
          { id: 11, transaction: false, value: 23000, type: UpperThreshold, severity: 4 },
          { id: 12, transaction: false, value: 50, type: LowerThreshold, severity: 4 },
        ],
      },
      componentId,
      variableId,
      OCPP_CONNECTION_NAME,
    );

    const rows = await monitorsOnStation();
    expect(rows.map((row) => [row.id, row.type, row.value])).toEqual([
      [11, UpperThreshold, 23000],
      [12, LowerThreshold, 50],
    ]);
  });
});
