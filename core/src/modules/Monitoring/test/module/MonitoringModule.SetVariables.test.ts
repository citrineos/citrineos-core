// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import {
  DEFAULT_TENANT_ID,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPPVersion,
} from '@citrineos/base';
import {
  ChargingStation,
  Component,
  DefaultSequelizeInstance,
  OCPPMessage,
  SequelizeDeviceModelRepository,
  SequelizeOCPPMessageRepository,
  SequelizeVariableMonitoringRepository,
  Tenant,
  Variable,
  VariableAttribute,
  VariableStatus,
} from '@dal/index.js';
import { MonitoringModule } from '../../src/module/module.js';
import {
  aSetVariableData,
  aSetVariableResult,
  aSetVariablesResponse,
  aSetVariablesResponseMessage,
} from '../providers/Monitoring.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_ID = DEFAULT_TENANT_ID;
const STATION_ID = 'CS-001';
const CORRELATION_ID = 'corr-abc-123';

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

  // Define schema relationships for testing
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
// Repository / module factory
// ---------------------------------------------------------------------------

function makeRepos() {
  const config = {} as BootstrapConfig;
  return {
    deviceModelRepo: new SequelizeDeviceModelRepository(config, undefined, sequelizeInstance),
    ocppMessageRepo: new SequelizeOCPPMessageRepository(config, undefined, sequelizeInstance),
    variableMonitoringRepo: new SequelizeVariableMonitoringRepository(
      config,
      undefined,
      sequelizeInstance,
    ),
  };
}

function makeModule(): MonitoringModule {
  const { deviceModelRepo, ocppMessageRepo, variableMonitoringRepo } = makeRepos();

  const mockConfig = { modules: { monitoring: { requests: [], responses: [] } } } as any;
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    getSubLogger: vi.fn().mockReturnThis(),
  } as any;

  return new MonitoringModule(
    mockConfig,
    /* cache */ {} as any,
    /* sender */ {} as any,
    /* handler */ { module: null } as any,
    mockLogger,
    /* ocppValidator */ { validate: vi.fn().mockResolvedValue(undefined) } as any,
    deviceModelRepo,
    variableMonitoringRepo,
    ocppMessageRepo,
    /* idGenerator */ { generateRequestId: vi.fn().mockResolvedValue(1) } as any,
  );
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedBase(): Promise<void> {
  await Tenant.create({ id: TENANT_ID as any });
  await ChargingStation.create({ id: STATION_ID, isOnline: false, tenantId: TENANT_ID });
}

async function seedComponent(name: string, instance: string | null = null): Promise<Component> {
  return Component.create({ name, instance, tenantId: TENANT_ID });
}

async function seedVariable(name: string, instance: string | null = null): Promise<Variable> {
  return Variable.create({ name, instance, tenantId: TENANT_ID });
}

async function seedVariableAttribute(
  componentId: number,
  variableId: number,
  value: string,
  type: OCPP2_0_1.AttributeEnumType = OCPP2_0_1.AttributeEnumType.Actual,
): Promise<VariableAttribute> {
  return VariableAttribute.create({
    stationId: STATION_ID,
    componentId,
    variableId,
    type,
    value,
    generatedAt: new Date(),
    tenantId: TENANT_ID,
  });
}

async function seedVariableStatus(
  variableAttributeId: number,
  value: string,
  status: OCPP2_0_1.SetVariableStatusEnumType,
): Promise<VariableStatus> {
  return VariableStatus.create({ variableAttributeId, value, status, tenantId: TENANT_ID });
}

/**
 * Seeds an OCPPMessage as the CSMS-originated SetVariables request.
 * Stored in raw OCPP array format: [messageTypeId, correlationId, action, payload].
 */
async function seedSetVariablesRequest(
  setVariableData: OCPP2_0_1.SetVariableDataType[],
  correlationId: string = CORRELATION_ID,
): Promise<OCPPMessage> {
  return OCPPMessage.create({
    stationId: STATION_ID,
    correlationId,
    origin: MessageOrigin.ChargingStationManagementSystem,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_0_1,
    action: 'SetVariables',
    message: [
      2,
      correlationId,
      'SetVariables',
      { setVariableData } as OCPP2_0_1.SetVariablesRequest,
    ],
    tenantId: TENANT_ID,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MonitoringModule – SetVariables response handling', () => {
  // -------------------------------------------------------------------------
  // getSetVariablesDataMapFromOriginalSetVariablesRequest
  // -------------------------------------------------------------------------

  describe('getSetVariablesDataMapFromOriginalSetVariablesRequest', () => {
    it('returns an empty map when no OCPPMessage exists for the correlation id', async () => {
      await seedBase();
      // No OCPPMessage seeded
      const module = makeModule();

      const map = await (module as any).getSetVariablesDataMapFromOriginalSetVariablesRequest(
        TENANT_ID,
        STATION_ID,
        CORRELATION_ID,
      );

      expect(map).toEqual({});
    });

    it('builds a keyed map from the SetVariables request stored in the DB', async () => {
      await seedBase();
      const data1 = aSetVariableData((d) => {
        d.component = { name: 'Connector', instance: null };
        d.variable = { name: 'MaxVoltage', instance: null };
        d.attributeValue = '240';
        d.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
      });
      const data2 = aSetVariableData((d) => {
        d.component = { name: 'EVSE', instance: '1' };
        d.variable = { name: 'Power', instance: 'A' };
        d.attributeValue = '7200';
        d.attributeType = undefined;
      });
      await seedSetVariablesRequest([data1, data2]);

      const module = makeModule();

      const map = await (module as any).getSetVariablesDataMapFromOriginalSetVariablesRequest(
        TENANT_ID,
        STATION_ID,
        CORRELATION_ID,
      );

      expect(map['Connector-null-MaxVoltage-null']).toEqual(data1);
      expect(map['EVSE-1-Power-A']).toEqual(data2);
    });

    it('treats missing component/variable instance as the "null" string key segment', async () => {
      await seedBase();
      const data = aSetVariableData((d) => {
        d.component = { name: 'Clock' };
        d.variable = { name: 'NtpSource' };
        d.attributeValue = 'pool.ntp.org';
        d.attributeType = undefined;
      });
      await seedSetVariablesRequest([data]);

      const module = makeModule();

      const map = await (module as any).getSetVariablesDataMapFromOriginalSetVariablesRequest(
        TENANT_ID,
        STATION_ID,
        CORRELATION_ID,
      );

      // undefined instance → falls back to 'null' string segment
      expect(map['Clock-null-NtpSource-null']).toEqual(data);
    });

    it('only returns entries matching the given correlationId', async () => {
      await seedBase();
      const data = aSetVariableData((d) => {
        d.component = { name: 'Connector' };
        d.variable = { name: 'MaxVoltage' };
        d.attributeValue = '240';
      });
      await seedSetVariablesRequest([data], 'other-corr-id');
      // No message seeded for CORRELATION_ID

      const module = makeModule();

      const map = await (module as any).getSetVariablesDataMapFromOriginalSetVariablesRequest(
        TENANT_ID,
        STATION_ID,
        CORRELATION_ID, // different from 'other-corr-id'
      );

      expect(map).toEqual({});
    });
  });

  // -------------------------------------------------------------------------
  // getExistingOrCreateVariableAttribute
  // -------------------------------------------------------------------------

  describe('getExistingOrCreateVariableAttribute', () => {
    it('returns the existing VariableAttribute from the DB without creating a new one', async () => {
      await seedBase();
      const component = await seedComponent('Connector');
      const variable = await seedVariable('MaxVoltage');
      const seeded = await seedVariableAttribute(component.id, variable.id, '120');

      const module = makeModule();

      const result = await (module as any).getExistingOrCreateVariableAttribute(
        TENANT_ID,
        STATION_ID,
        'Connector',
        null,
        'MaxVoltage',
        null,
        '240',
        OCPP2_0_1.AttributeEnumType.Actual,
      );

      expect(result.id).toBe(seeded.id);
      // Only the one we seeded exists
      const allAttrs = await VariableAttribute.findAll({ where: { stationId: STATION_ID } });
      expect(allAttrs).toHaveLength(1);
    });

    it('creates a new VariableAttribute in the DB when none exists', async () => {
      await seedBase();
      // No Component, Variable, or VariableAttribute seeded

      const module = makeModule();

      const result = await (module as any).getExistingOrCreateVariableAttribute(
        TENANT_ID,
        STATION_ID,
        'Connector',
        null,
        'MaxVoltage',
        null,
        '240',
        OCPP2_0_1.AttributeEnumType.Actual,
      );

      expect(result).toBeDefined();
      const inDb = await VariableAttribute.findOne({
        where: { stationId: STATION_ID, type: OCPP2_0_1.AttributeEnumType.Actual },
        include: [
          { model: Component, where: { name: 'Connector' } },
          { model: Variable, where: { name: 'MaxVoltage' } },
        ],
      });
      expect(inDb).not.toBeNull();
    });

    it('finds the attribute matching the specific component and variable instance', async () => {
      await seedBase();
      const comp = await seedComponent('EVSE', '1');
      const varA = await seedVariable('Power', 'A');
      const seeded = await seedVariableAttribute(
        comp.id,
        varA.id,
        '7200',
        OCPP2_0_1.AttributeEnumType.Actual,
      );

      const module = makeModule();

      const result = await (module as any).getExistingOrCreateVariableAttribute(
        TENANT_ID,
        STATION_ID,
        'EVSE',
        '1',
        'Power',
        'A',
        '9600',
        OCPP2_0_1.AttributeEnumType.Actual,
      );

      expect(result.id).toBe(seeded.id);
    });
  });

  // -------------------------------------------------------------------------
  // handleSetVariableResultType
  // -------------------------------------------------------------------------

  describe('handleSetVariableResultType', () => {
    it('updates VariableAttribute.value and creates an Accepted VariableStatus when status is Accepted', async () => {
      await seedBase();
      const component = await seedComponent('Connector');
      const variable = await seedVariable('MaxVoltage');
      const varAttr = await seedVariableAttribute(component.id, variable.id, '120');

      const dataMap = {
        'Connector-null-MaxVoltage-null': aSetVariableData((d) => {
          d.component = { name: 'Connector' };
          d.variable = { name: 'MaxVoltage' };
          d.attributeValue = '240';
          d.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        }),
      };
      const result = aSetVariableResult((r) => {
        r.component = { name: 'Connector' };
        r.variable = { name: 'MaxVoltage' };
        r.attributeStatus = OCPP2_0_1.SetVariableStatusEnumType.Accepted;
        r.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
      });

      const module = makeModule();
      await (module as any).handleSetVariableResultType(
        TENANT_ID,
        STATION_ID,
        result,
        dataMap,
        new Date().toISOString(),
      );

      const updated = await VariableAttribute.findByPk(varAttr.id);
      expect(updated?.value).toBe('240');

      const statuses = await VariableStatus.findAll({ where: { variableAttributeId: varAttr.id } });
      expect(statuses).toHaveLength(1);
      expect(statuses[0].status).toBe(OCPP2_0_1.SetVariableStatusEnumType.Accepted);
      expect(statuses[0].value).toBe('240');
    });

    it('does NOT update VariableAttribute.value when status is Rejected, restoring the last Accepted value', async () => {
      await seedBase();
      const component = await seedComponent('Connector');
      const variable = await seedVariable('MaxVoltage');
      // Current value is the last accepted value
      const varAttr = await seedVariableAttribute(component.id, variable.id, '120');
      await seedVariableStatus(varAttr.id, '120', OCPP2_0_1.SetVariableStatusEnumType.Accepted);

      const dataMap = {
        'Connector-null-MaxVoltage-null': aSetVariableData((d) => {
          d.component = { name: 'Connector' };
          d.variable = { name: 'MaxVoltage' };
          d.attributeValue = '999'; // attempted but rejected
          d.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        }),
      };
      const result = aSetVariableResult((r) => {
        r.component = { name: 'Connector' };
        r.variable = { name: 'MaxVoltage' };
        r.attributeStatus = OCPP2_0_1.SetVariableStatusEnumType.Rejected;
        r.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
      });

      const module = makeModule();
      await (module as any).handleSetVariableResultType(
        TENANT_ID,
        STATION_ID,
        result,
        dataMap,
        new Date().toISOString(),
      );

      const updated = await VariableAttribute.findByPk(varAttr.id);
      // Restored to last Accepted value, not the attempted '999'
      expect(updated?.value).toBe('120');

      const statuses = await VariableStatus.findAll({
        where: { variableAttributeId: varAttr.id },
        order: [['createdAt', 'ASC']],
      });
      expect(statuses).toHaveLength(2);
      expect(statuses[1].status).toBe(OCPP2_0_1.SetVariableStatusEnumType.Rejected);
    });

    it('does nothing to the DB when the result component/variable is not in the data map', async () => {
      await seedBase();
      const component = await seedComponent('Connector');
      const variable = await seedVariable('MaxVoltage');
      const varAttr = await seedVariableAttribute(component.id, variable.id, '120');

      const dataMap = {
        'Connector-null-MaxVoltage-null': aSetVariableData((d) => {
          d.component = { name: 'Connector' };
          d.variable = { name: 'MaxVoltage' };
          d.attributeValue = '240';
        }),
      };
      const result = aSetVariableResult((r) => {
        r.component = { name: 'Unknown' };
        r.variable = { name: 'Unknown' };
        r.attributeStatus = OCPP2_0_1.SetVariableStatusEnumType.Accepted;
      });

      const module = makeModule();
      await (module as any).handleSetVariableResultType(
        TENANT_ID,
        STATION_ID,
        result,
        dataMap,
        new Date().toISOString(),
      );

      const unchanged = await VariableAttribute.findByPk(varAttr.id);
      expect(unchanged?.value).toBe('120');

      const statuses = await VariableStatus.findAll({ where: { variableAttributeId: varAttr.id } });
      expect(statuses).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // _handleSetVariables (full end-to-end with real DB)
  // -------------------------------------------------------------------------

  describe('_handleSetVariables', () => {
    it('updates VariableAttribute.value in the DB when the response status is Accepted', async () => {
      await seedBase();
      const component = await seedComponent('Connector');
      const variable = await seedVariable('MaxVoltage');
      const varAttr = await seedVariableAttribute(component.id, variable.id, '120');

      await seedSetVariablesRequest([
        aSetVariableData((d) => {
          d.component = { name: 'Connector' };
          d.variable = { name: 'MaxVoltage' };
          d.attributeValue = '240';
          d.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        }),
      ]);

      await (makeModule() as any)._handleSetVariables(
        aSetVariablesResponseMessage(
          aSetVariablesResponse((r) => {
            r.setVariableResult = [
              aSetVariableResult((res) => {
                res.component = { name: 'Connector' };
                res.variable = { name: 'MaxVoltage' };
                res.attributeStatus = OCPP2_0_1.SetVariableStatusEnumType.Accepted;
                res.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
              }),
            ];
          }),
          { correlationId: CORRELATION_ID, stationId: STATION_ID, tenantId: TENANT_ID },
        ),
      );

      const updated = await VariableAttribute.findByPk(varAttr.id);
      expect(updated?.value).toBe('240');
    });

    it('creates a VariableStatus record with Accepted status and the new value', async () => {
      await seedBase();
      const component = await seedComponent('Connector');
      const variable = await seedVariable('MaxVoltage');
      const varAttr = await seedVariableAttribute(component.id, variable.id, '120');

      await seedSetVariablesRequest([
        aSetVariableData((d) => {
          d.component = { name: 'Connector' };
          d.variable = { name: 'MaxVoltage' };
          d.attributeValue = '240';
          d.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        }),
      ]);

      await (makeModule() as any)._handleSetVariables(
        aSetVariablesResponseMessage(
          aSetVariablesResponse((r) => {
            r.setVariableResult = [
              aSetVariableResult((res) => {
                res.component = { name: 'Connector' };
                res.variable = { name: 'MaxVoltage' };
                res.attributeStatus = OCPP2_0_1.SetVariableStatusEnumType.Accepted;
                res.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
              }),
            ];
          }),
          { correlationId: CORRELATION_ID, stationId: STATION_ID, tenantId: TENANT_ID },
        ),
      );

      const statuses = await VariableStatus.findAll({ where: { variableAttributeId: varAttr.id } });
      expect(statuses).toHaveLength(1);
      expect(statuses[0].status).toBe(OCPP2_0_1.SetVariableStatusEnumType.Accepted);
      expect(statuses[0].value).toBe('240');
    });

    it('does NOT update VariableAttribute.value when status is Rejected, and restores the last Accepted value', async () => {
      await seedBase();
      const component = await seedComponent('Connector');
      const variable = await seedVariable('MaxVoltage');
      const varAttr = await seedVariableAttribute(component.id, variable.id, '120');
      await seedVariableStatus(varAttr.id, '120', OCPP2_0_1.SetVariableStatusEnumType.Accepted);

      await seedSetVariablesRequest([
        aSetVariableData((d) => {
          d.component = { name: 'Connector' };
          d.variable = { name: 'MaxVoltage' };
          d.attributeValue = '999'; // attempted but charger rejects it
          d.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        }),
      ]);

      await (makeModule() as any)._handleSetVariables(
        aSetVariablesResponseMessage(
          aSetVariablesResponse((r) => {
            r.setVariableResult = [
              aSetVariableResult((res) => {
                res.component = { name: 'Connector' };
                res.variable = { name: 'MaxVoltage' };
                res.attributeStatus = OCPP2_0_1.SetVariableStatusEnumType.Rejected;
                res.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
              }),
            ];
          }),
          { correlationId: CORRELATION_ID, stationId: STATION_ID, tenantId: TENANT_ID },
        ),
      );

      // Value reverted to last accepted, not the rejected attempt
      const updated = await VariableAttribute.findByPk(varAttr.id);
      expect(updated?.value).toBe('120');

      const statuses = await VariableStatus.findAll({
        where: { variableAttributeId: varAttr.id },
        order: [['createdAt', 'ASC']],
      });
      expect(statuses).toHaveLength(2);
      expect(statuses[1].status).toBe(OCPP2_0_1.SetVariableStatusEnumType.Rejected);
    });

    it('leaves VariableAttribute.value unchanged when no OCPP request is found for the correlation id', async () => {
      await seedBase();
      const component = await seedComponent('Connector');
      const variable = await seedVariable('MaxVoltage');
      const varAttr = await seedVariableAttribute(component.id, variable.id, '120');
      // Intentionally do NOT seed an OCPPMessage

      await (makeModule() as any)._handleSetVariables(
        aSetVariablesResponseMessage(
          aSetVariablesResponse((r) => {
            r.setVariableResult = [
              aSetVariableResult((res) => {
                res.component = { name: 'Connector' };
                res.variable = { name: 'MaxVoltage' };
                res.attributeStatus = OCPP2_0_1.SetVariableStatusEnumType.Accepted;
              }),
            ];
          }),
          { correlationId: CORRELATION_ID, stationId: STATION_ID, tenantId: TENANT_ID },
        ),
      );

      const unchanged = await VariableAttribute.findByPk(varAttr.id);
      expect(unchanged?.value).toBe('120');

      const statuses = await VariableStatus.findAll({ where: { variableAttributeId: varAttr.id } });
      expect(statuses).toHaveLength(0);
    });

    it('creates a new VariableAttribute when none exists and the response status is Accepted', async () => {
      await seedBase();
      // No Component, Variable, or VariableAttribute seeded

      await seedSetVariablesRequest([
        aSetVariableData((d) => {
          d.component = { name: 'Connector' };
          d.variable = { name: 'MaxVoltage' };
          d.attributeValue = '240';
          d.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        }),
      ]);

      await (makeModule() as any)._handleSetVariables(
        aSetVariablesResponseMessage(
          aSetVariablesResponse((r) => {
            r.setVariableResult = [
              aSetVariableResult((res) => {
                res.component = { name: 'Connector' };
                res.variable = { name: 'MaxVoltage' };
                res.attributeStatus = OCPP2_0_1.SetVariableStatusEnumType.Accepted;
                res.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
              }),
            ];
          }),
          { correlationId: CORRELATION_ID, stationId: STATION_ID, tenantId: TENANT_ID },
        ),
      );

      const created = await VariableAttribute.findOne({
        where: { stationId: STATION_ID, type: OCPP2_0_1.AttributeEnumType.Actual },
        include: [
          { model: Component, where: { name: 'Connector' } },
          { model: Variable, where: { name: 'MaxVoltage' } },
        ],
      });
      expect(created).not.toBeNull();
      expect(created?.value).toBe('240');
    });

    it('updates only the Accepted variable in a multi-result response; the Rejected one stays at its last Accepted value', async () => {
      await seedBase();

      const compA = await seedComponent('CompA');
      const varA = await seedVariable('VarA');
      const attrA = await seedVariableAttribute(compA.id, varA.id, 'old-A');

      const compB = await seedComponent('CompB');
      const varB = await seedVariable('VarB');
      const attrB = await seedVariableAttribute(compB.id, varB.id, 'current-B');
      await seedVariableStatus(attrB.id, 'current-B', OCPP2_0_1.SetVariableStatusEnumType.Accepted);

      await seedSetVariablesRequest([
        aSetVariableData((d) => {
          d.component = { name: 'CompA' };
          d.variable = { name: 'VarA' };
          d.attributeValue = 'new-A';
          d.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        }),
        aSetVariableData((d) => {
          d.component = { name: 'CompB' };
          d.variable = { name: 'VarB' };
          d.attributeValue = 'attempted-B';
          d.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
        }),
      ]);

      await (makeModule() as any)._handleSetVariables(
        aSetVariablesResponseMessage(
          aSetVariablesResponse((r) => {
            r.setVariableResult = [
              aSetVariableResult((res) => {
                res.component = { name: 'CompA' };
                res.variable = { name: 'VarA' };
                res.attributeStatus = OCPP2_0_1.SetVariableStatusEnumType.Accepted;
                res.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
              }),
              aSetVariableResult((res) => {
                res.component = { name: 'CompB' };
                res.variable = { name: 'VarB' };
                res.attributeStatus = OCPP2_0_1.SetVariableStatusEnumType.Rejected;
                res.attributeType = OCPP2_0_1.AttributeEnumType.Actual;
              }),
            ];
          }),
          { correlationId: CORRELATION_ID, stationId: STATION_ID, tenantId: TENANT_ID },
        ),
      );

      const updatedA = await VariableAttribute.findByPk(attrA.id);
      const updatedB = await VariableAttribute.findByPk(attrB.id);

      expect(updatedA?.value).toBe('new-A');
      expect(updatedB?.value).toBe('current-B');
    });
  });

  // -------------------------------------------------------------------------
  // getSetVariableDataMapKey  (pure logic – no DB needed)
  // -------------------------------------------------------------------------

  describe('getSetVariableDataMapKey', () => {
    it('produces consistent keys for the same inputs', () => {
      const module = makeModule();
      const key1 = (module as any).getSetVariableDataMapKey('Comp', null, 'Var', null);
      const key2 = (module as any).getSetVariableDataMapKey('Comp', null, 'Var', null);
      expect(key1).toBe(key2);
    });

    it('differentiates keys by instance value', () => {
      const module = makeModule();
      const keyNoInstance = (module as any).getSetVariableDataMapKey('Comp', null, 'Var', null);
      const keyWithInstance = (module as any).getSetVariableDataMapKey('Comp', '1', 'Var', null);
      expect(keyNoInstance).not.toBe(keyWithInstance);
    });

    it('returns a string in the expected format', () => {
      const module = makeModule();
      const key = (module as any).getSetVariableDataMapKey(
        'MyComponent',
        'inst',
        'MyVariable',
        'v1',
      );
      expect(key).toBe('MyComponent-inst-MyVariable-v1');
    });
  });
});
