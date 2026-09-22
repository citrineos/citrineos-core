// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  Component,
  DefaultSequelizeInstance,
  SequelizeDeviceModelRepository,
  Variable,
  VariableStatus,
} from '@citrineos/dal';
import { OCPP2_0_1, type SystemConfig } from '@citrineos/types';
import { Boot, VariableAttribute } from '@dal/db/sequelize/index.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ChargingStation } from '../../../src/models/location/charging-station.js';
import { Tenant } from '../../../src/models/tenant.js';
import { aGetVariableResult } from '../../providers/monitoring.js';

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
  } as unknown as SystemConfig;

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
  return new SequelizeDeviceModelRepository({ config: {} as SystemConfig, sequelizeInstance });
}

let stationId: number;

async function seedBase(): Promise<void> {
  await Tenant.create({ id: TENANT_ID as any, name: String(TENANT_ID) });
  const station = await ChargingStation.create({
    ocppConnectionName: OCPP_CONNECTION_NAME,
    isOnline: false,
    tenantId: TENANT_ID,
  });
  stationId = station.id;
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
    stationId,
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

describe('createOrUpdateDeviceModelByStationId', () => {
  it.each([
    ['a newly created attribute', 'FreshVariable'],
    ['an updated existing attribute', 'MaxVoltage'],
  ])(
    'exposes component and variable as readable properties for %s',
    async (_case, variableName) => {
      await seedBase();
      await seedVariableAttribute('Connector', 'MaxVoltage', 'original-value');

      const saved = await makeRepo().createOrUpdateDeviceModelByStationId(
        TENANT_ID,
        {
          component: { name: 'Connector' },
          variable: { name: variableName },
          variableAttribute: [
            {
              type: OCPP2_0_1.AttributeEnumType.Actual,
              value: 'some-value',
              mutability: OCPP2_0_1.MutabilityEnumType.ReadWrite,
            },
          ],
        },
        OCPP_CONNECTION_NAME,
        TIMESTAMP,
      );

      expect(saved).toHaveLength(1);
      expect(saved[0].component?.name).toBe('Connector');
      expect(saved[0].variable?.name).toBe(variableName);
    },
  );

  it('keeps the relations in the serialized row as well', async () => {
    await seedBase();

    const saved = await makeRepo().createOrUpdateDeviceModelByStationId(
      TENANT_ID,
      {
        component: { name: 'Connector' },
        variable: { name: 'MaxVoltage' },
        variableAttribute: [{ type: OCPP2_0_1.AttributeEnumType.Actual, value: 'some-value' }],
      },
      OCPP_CONNECTION_NAME,
      TIMESTAMP,
    );

    // Round-tripping through JSON invokes the row's own toJSON, which reads
    // dataValues rather than the assigned properties.
    const serialized = JSON.parse(JSON.stringify(saved[0]));
    expect(serialized).toMatchObject({
      component: expect.objectContaining({ name: 'Connector' }),
      variable: expect.objectContaining({ name: 'MaxVoltage' }),
    });
  });
});

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
        where: { stationId },
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
        where: { stationId },
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
        where: { stationId },
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

describe('deleteAllByQuerystring', () => {
  // Components and Variables are unique on (tenantId, name), so rows that share a
  // component or a variable have to reuse the existing row rather than create one.
  async function seedSharedVariableAttribute(
    componentName: string,
    variableName: string,
    value: string,
  ): Promise<VariableAttribute> {
    const [component] = await Component.findOrCreate({
      where: { name: componentName, tenantId: TENANT_ID },
    });
    const [variable] = await Variable.findOrCreate({
      where: { name: variableName, tenantId: TENANT_ID },
    });
    return VariableAttribute.create({
      stationId,
      componentId: component.id,
      variableId: variable.id,
      type: OCPP2_0_1.AttributeEnumType.Actual,
      value,
      generatedAt: new Date(),
      tenantId: TENANT_ID,
    });
  }

  it('deletes only the attributes the component and variable filters match', async () => {
    await seedBase();
    const target = await seedSharedVariableAttribute('InternalCtrlr', 'ICCID', 'target');
    await seedSharedVariableAttribute('InternalCtrlr', 'IMSI', 'same-component');
    await seedSharedVariableAttribute('SecurityCtrlr', 'ICCID', 'same-variable');
    await seedSharedVariableAttribute('OCPPCommCtrlr', 'Priority', 'unrelated');

    const deleted = await makeRepo().deleteAllByQuerystring(TENANT_ID, {
      tenantId: TENANT_ID,
      ocppConnectionName: OCPP_CONNECTION_NAME,
      component_name: 'InternalCtrlr',
      variable_name: 'ICCID',
    });

    expect(deleted).toHaveLength(1);
    expect(deleted[0].id).toBe(target.id);

    const survivors = await VariableAttribute.findAll();
    expect(survivors).toHaveLength(3);
    expect(survivors.map((row) => row.id)).not.toContain(target.id);
  });

  it('deletes nothing when the filters match nothing', async () => {
    await seedBase();
    await seedSharedVariableAttribute('InternalCtrlr', 'ICCID', 'target');

    const deleted = await makeRepo().deleteAllByQuerystring(TENANT_ID, {
      tenantId: TENANT_ID,
      ocppConnectionName: OCPP_CONNECTION_NAME,
      component_name: 'NoSuchCtrlr',
    });

    expect(deleted).toHaveLength(0);
    expect(await VariableAttribute.count()).toBe(1);
  });
});
describe('readAllSetVariableByStationId', () => {
  it('returns the attributes assigned to the station boot config as SetVariableData', async () => {
    await seedBase();
    const station = await ChargingStation.findOne({
      where: { ocppConnectionName: OCPP_CONNECTION_NAME },
    });
    const boot = await Boot.create({
      stationId: station?.id,
      status: 'Pending',
      tenantId: TENANT_ID,
    } as any);
    const assigned = await seedVariableAttribute('OCPPCommCtrlr', 'HeartbeatInterval', '30');
    await assigned.update({ bootConfigId: boot.id });
    await seedVariableAttribute('Connector', 'MaxVoltage', '230');

    const setVariableData = await makeRepo().readAllSetVariableByStationId(
      TENANT_ID,
      OCPP_CONNECTION_NAME,
    );

    expect(setVariableData).toEqual([
      expect.objectContaining({
        attributeType: OCPP2_0_1.AttributeEnumType.Actual,
        attributeValue: '30',
        component: expect.objectContaining({ name: 'OCPPCommCtrlr' }),
        variable: expect.objectContaining({ name: 'HeartbeatInterval' }),
      }),
    ]);
  });
});
