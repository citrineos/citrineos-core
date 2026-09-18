// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { Sequelize } from 'sequelize-typescript';
import type { SystemConfig } from '@citrineos/types';
import {
  Component,
  DefaultSequelizeInstance,
  DrizzleBootRepository,
  DrizzleVariableAttributeRepository,
  Variable,
} from '../../../index.js';
import { ChargingStation, Tenant, VariableAttribute } from '@dal/db/sequelize/index.js';

const TENANT_ID = 1;
const STATION = 'CS-001';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let config: SystemConfig;
let drizzlePool: pg.Pool;
let drizzleInstance: NodePgDatabase;

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
  } as unknown as SystemConfig;

  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });

  drizzlePool = new pg.Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.username,
    password: config.database.password,
  });
  drizzleInstance = drizzle(drizzlePool);
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
  await Tenant.create({ id: TENANT_ID as any, name: String(TENANT_ID) });
  await ChargingStation.create({
    ocppConnectionName: STATION,
    isOnline: false,
    tenantId: TENANT_ID,
  } as any);
});

function aRepository(): DrizzleBootRepository {
  return new DrizzleBootRepository({
    config,
    drizzleInstance,
    variableAttributeRepository: new DrizzleVariableAttributeRepository({
      config,
      drizzleInstance,
    }),
  });
}

async function aPendingBootWithOneSetVariable(): Promise<number> {
  const component = await Component.create({ name: 'OCPPCommCtrlr', tenantId: TENANT_ID } as any);
  const variable = await Variable.create({ name: 'HeartbeatInterval', tenantId: TENANT_ID } as any);
  const attribute = await VariableAttribute.create({
    ocppConnectionName: STATION,
    componentId: component.id,
    variableId: variable.id,
    value: '30',
    tenantId: TENANT_ID,
  } as any);
  await aRepository().createOrUpdateByKey(
    TENANT_ID,
    { status: 'Pending', pendingBootSetVariableIds: [attribute.id] },
    STATION,
  );
  return attribute.id;
}

describe('DrizzleBootRepository pending boot SetVariables', () => {
  it('readByKey returns the variable attributes assigned to the boot', async () => {
    const attributeId = await aPendingBootWithOneSetVariable();

    const boot = await aRepository().readByKey(TENANT_ID, STATION);

    expect(boot?.pendingBootSetVariables?.map((a) => a.id)).toEqual([attributeId]);
  });

  it('updateByKey returns the variable attributes assigned to the boot', async () => {
    const attributeId = await aPendingBootWithOneSetVariable();

    const boot = await aRepository().updateByKey(
      TENANT_ID,
      { lastBootTime: new Date().toISOString() },
      STATION,
    );

    expect(boot?.pendingBootSetVariables?.map((a) => a.id)).toEqual([attributeId]);
  });
});
