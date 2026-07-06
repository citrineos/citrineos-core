// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1 } from '@citrineos/base';
import {
  ChargingStation,
  Component,
  DefaultSequelizeInstance,
  SequelizeDeviceModelRepository,
  Tenant,
  Variable,
  VariableAttribute,
  VariableStatus,
} from '@dal/index.js';
import { aGetVariableResult } from '../providers/Monitoring.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_ID = DEFAULT_TENANT_ID;
const OCPP_CONNECTION_NAME = 'CS-001';
const TIMESTAMP = '2025-01-01T00:00:00.000Z';

// ---------------------------------------------------------------------------
// Container & DB lifecycle
// ---------------------------------------------------------------------------

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

  VariableAttribute.belongsTo(Component, { foreignKey: 'componentId' });
  Component.hasMany(VariableAttribute, { foreignKey: 'componentId' });
  VariableAttribute.belongsTo(Variable, { foreignKey: 'variableId' });
  Variable.hasMany(VariableAttribute, { foreignKey: 'variableId' });
  VariableAttribute.hasMany(VariableStatus, { foreignKey: 'variableAttributeId' });
  VariableStatus.belongsTo(VariableAttribute, { foreignKey: 'variableAttributeId' });
  await sequelizeInstance.sync({ force: true });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance.close();
  await pgContainer.stop();
});

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepo(): SequelizeDeviceModelRepository {
  return new SequelizeDeviceModelRepository({} as BootstrapConfig, undefined, sequelizeInstance);
}

async function seedBase(): Promise<void> {
  await Tenant.create({ id: TENANT_ID as any });
  await ChargingStation.create({
    ocppConnectionName: OCPP_CONNECTION_NAME,
    isOnline: false,
    tenantId: TENANT_ID,
  });
}

async function seedVariableAttribute(
  componentName: string,
  variableName: string,
  value: string,
  type: OCPP2_0_1.AttributeEnumType = OCPP2_0_1.AttributeEnumType.Actual,
): Promise<VariableAttribute> {
  const component = await Component.create({ name: componentName, tenantId: TENANT_ID });
  const variable = await Variable.create({ name: variableName, tenantId: TENANT_ID });
  return VariableAttribute.create({
    ocppConnectionName: OCPP_CONNECTION_NAME,
    componentId: component.id,
    variableId: variable.id,
    type,
    value,
    generatedAt: new Date(),
    tenantId: TENANT_ID,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createOrUpdateByGetVariablesResultAndStationId', () => {
  describe('when attributeStatus is Accepted', () => {
    it('updates the stored VariableAttribute value with the returned value', async () => {
      await seedBase();
      await seedVariableAttribute('Connector', 'MaxVoltage', 'original-value');

      const result = aGetVariableResult((r) => {
        r.component = { name: 'Connector' };
        r.variable = { name: 'MaxVoltage' };
        r.attributeStatus = OCPP2_0_1.GetVariableStatusEnumType.Accepted;
        r.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        r.attributeValue = 'new-value';
      });

      await makeRepo().createOrUpdateByGetVariablesResultAndStationId(
        TENANT_ID,
        [result],
        OCPP_CONNECTION_NAME,
        TIMESTAMP,
      );

      const updated = await VariableAttribute.findOne({
        where: { ocppConnectionName: OCPP_CONNECTION_NAME },
      });
      expect(updated?.value).toBe('new-value');
    });

    it('creates a VariableStatus record linked to the VariableAttribute', async () => {
      await seedBase();
      const seeded = await seedVariableAttribute('Connector', 'MaxVoltage', 'original-value');

      const result = aGetVariableResult((r) => {
        r.component = { name: 'Connector' };
        r.variable = { name: 'MaxVoltage' };
        r.attributeStatus = OCPP2_0_1.GetVariableStatusEnumType.Accepted;
        r.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        r.attributeValue = 'new-value';
      });

      await makeRepo().createOrUpdateByGetVariablesResultAndStationId(
        TENANT_ID,
        [result],
        OCPP_CONNECTION_NAME,
        TIMESTAMP,
      );

      const status = await VariableStatus.findOne({
        where: { variableAttributeId: seeded.id },
      });
      expect(status).not.toBeNull();
      expect(status?.status).toBe(OCPP2_0_1.GetVariableStatusEnumType.Accepted);
      expect(status?.value).toBe('new-value');
    });
  });

  describe('when attributeStatus is Rejected', () => {
    it('does NOT overwrite the existing VariableAttribute value', async () => {
      await seedBase();
      await seedVariableAttribute('Connector', 'MaxVoltage', 'original-value');

      const result = aGetVariableResult((r) => {
        r.component = { name: 'Connector' };
        r.variable = { name: 'MaxVoltage' };
        r.attributeStatus = OCPP2_0_1.GetVariableStatusEnumType.Rejected;
        r.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        r.attributeValue = undefined;
      });

      await makeRepo().createOrUpdateByGetVariablesResultAndStationId(
        TENANT_ID,
        [result],
        OCPP_CONNECTION_NAME,
        TIMESTAMP,
      );

      const attr = await VariableAttribute.findOne({
        where: { ocppConnectionName: OCPP_CONNECTION_NAME },
      });
      expect(attr?.value).toBe('original-value');
    });

    it('creates a VariableStatus record linked to the existing VariableAttribute', async () => {
      await seedBase();
      const seeded = await seedVariableAttribute('Connector', 'MaxVoltage', 'original-value');

      const result = aGetVariableResult((r) => {
        r.component = { name: 'Connector' };
        r.variable = { name: 'MaxVoltage' };
        r.attributeStatus = OCPP2_0_1.GetVariableStatusEnumType.Rejected;
        r.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        r.attributeValue = undefined;
      });

      await makeRepo().createOrUpdateByGetVariablesResultAndStationId(
        TENANT_ID,
        [result],
        OCPP_CONNECTION_NAME,
        TIMESTAMP,
      );

      const status = await VariableStatus.findOne({
        where: { variableAttributeId: seeded.id },
      });
      expect(status).not.toBeNull();
      expect(status?.status).toBe(OCPP2_0_1.GetVariableStatusEnumType.Rejected);
      expect(status?.variableAttributeId).toBe(seeded.id);
    });
  });

  describe('when attributeStatus is UnknownComponent or UnknownVariable', () => {
    it.each([
      OCPP2_0_1.GetVariableStatusEnumType.UnknownComponent,
      OCPP2_0_1.GetVariableStatusEnumType.UnknownVariable,
      OCPP2_0_1.GetVariableStatusEnumType.NotSupportedAttributeType,
    ])('does not overwrite an existing value for status %s', async (status) => {
      await seedBase();
      await seedVariableAttribute('Connector', 'MaxVoltage', 'original-value');

      const result = aGetVariableResult((r) => {
        r.component = { name: 'Connector' };
        r.variable = { name: 'MaxVoltage' };
        r.attributeStatus = status;
        r.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        r.attributeValue = undefined;
      });

      await makeRepo().createOrUpdateByGetVariablesResultAndStationId(
        TENANT_ID,
        [result],
        OCPP_CONNECTION_NAME,
        TIMESTAMP,
      );

      const attr = await VariableAttribute.findOne({
        where: { ocppConnectionName: OCPP_CONNECTION_NAME },
      });
      expect(attr?.value).toBe('original-value');
    });

    it('creates a VariableStatus with a valid variableAttributeId even when no attribute existed before', async () => {
      await seedBase();

      const result = aGetVariableResult((r) => {
        r.component = { name: 'NewComponent' };
        r.variable = { name: 'NewVariable' };
        r.attributeStatus = OCPP2_0_1.GetVariableStatusEnumType.UnknownVariable;
        r.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        r.attributeValue = undefined;
      });

      await makeRepo().createOrUpdateByGetVariablesResultAndStationId(
        TENANT_ID,
        [result],
        OCPP_CONNECTION_NAME,
        TIMESTAMP,
      );

      const variableStatus = await VariableStatus.findOne({
        where: { status: OCPP2_0_1.GetVariableStatusEnumType.UnknownVariable },
      });
      expect(variableStatus).not.toBeNull();
      expect(variableStatus?.variableAttributeId).not.toBeNull();
    });
  });
});
