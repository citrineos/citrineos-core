// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Boot,
  ChargingStation,
  EvseType,
  VariableAttribute,
  VariableCharacteristics,
} from '@dal/db/sequelize/index.js';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import {
  Component,
  DrizzleVariableAttributeRepository,
  Variable,
  VariableStatus,
} from '../../../index.js';
import { EventData } from '@dal/models/variable-monitoring/index.js';
import { ComponentVariable } from '@dal/models/device-model/component-variable.js';
import { Connector, Evse } from '@dal/models/location/index.js';
import { DrizzleComponentRepository, toComponentDto } from '@dal/repositories/drizzle/component.js';
import {
  DrizzleEventDataRepository,
  toEventDataDto,
} from '@dal/repositories/drizzle/event-data.js';
import { DrizzleVariableRepository, toVariableDto } from '@dal/repositories/drizzle/variable.js';
import { toVariableAttributeDto } from '@dal/repositories/drizzle/variable-attribute.js';
import {
  DrizzleVariableCharacteristicsRepository,
  toVariableCharacteristicsDto,
} from '@dal/repositories/drizzle/variable-characteristics.js';
import {
  DrizzleVariableStatusRepository,
  toVariableStatusDto,
} from '@dal/repositories/drizzle/variable-status.js';
import type { ComponentEntity } from '@dal/db/drizzle/schema/component.js';
import type { EventDataEntity } from '@dal/db/drizzle/schema/event-data.js';
import type { VariableEntity } from '@dal/db/drizzle/schema/variable.js';
import type { VariableAttributeEntity } from '@dal/db/drizzle/schema/variable-attribute.js';
import type { VariableCharacteristicsEntity } from '@dal/db/drizzle/schema/variable-characteristics.js';
import type { VariableStatusEntity } from '@dal/db/drizzle/schema/variable-status.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// Drizzle device-model cluster repositories over the sequelize-synced schema.
// The stub repos (Variable, Component, VariableCharacteristics, VariableStatus,
// EventData) expose only the shared DrizzleRepository CRUD; VariableAttribute adds
// updateAllByQueryString. The sequelize twin (SequelizeDeviceModelRepository) is
// covered in device-model-integration.test.ts, so these run drizzle-only.

const TENANT = 1;
const OTHER_TENANT = 2;
const STATION = 'CS-001';

let h: PgHarness;
let drizzlePool: pg.Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  h = await startPgHarness();
  // Own pool: the DefaultDrizzleInstance singleton exposes no way to close it.
  drizzlePool = new pg.Pool({
    host: h.config.database.host,
    port: h.config.database.port,
    database: h.config.database.database,
    user: h.config.database.username,
    password: h.config.database.password,
  });
  // Stopping the container terminates idle connections (Postgres 57P01). pg
  // escalates an unhandled pool 'error' to an uncaught exception, which fails
  // the run even when every test passed.
  drizzlePool.on('error', () => {});
  db = drizzle(drizzlePool);
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await h?.stop();
}, 90_000);

beforeEach(async () => {
  await resetDb(h);
});

function deps() {
  return { config: h.config, drizzleInstance: db };
}

// DrizzleVariableAttributeRepository takes the component repository for the write path.
function attributeDeps() {
  return { ...deps(), componentRepository: new DrizzleComponentRepository(deps()) };
}

async function aStation(tenantId: number, ocppConnectionName = STATION): Promise<{ id: number }> {
  const station = await ChargingStation.create({
    ocppConnectionName,
    isOnline: false,
    tenantId,
  } as any);
  return station as unknown as { id: number };
}

async function stationIdFor(tenantId: number, ocppConnectionName: string): Promise<number> {
  const existing = (await ChargingStation.findOne({
    where: { ocppConnectionName, tenantId },
  })) as unknown as { id: number } | null;
  return existing ? existing.id : (await aStation(tenantId, ocppConnectionName)).id;
}

async function aVariable(
  tenantId: number,
  name: string,
  instance: string | null = null,
): Promise<{ id: number }> {
  const variable = await Variable.create({ name, instance, tenantId } as any);
  return variable as unknown as { id: number };
}

async function aComponent(
  tenantId: number,
  name: string,
  instance: string | null = null,
): Promise<{ id: number }> {
  const component = await Component.create({ name, instance, tenantId } as any);
  return component as unknown as { id: number };
}

async function anAttribute(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const { ocppConnectionName = STATION, ...rest } = overrides;
  const attribute = await VariableAttribute.create({
    stationId: await stationIdFor(tenantId, ocppConnectionName as string),
    tenantId,
    ...rest,
  } as any);
  return attribute as unknown as { id: number };
}

describe('DrizzleVariableRepository', () => {
  it('findById maps the row and scopes to the tenant', async () => {
    const variable = await aVariable(TENANT, 'HeartbeatInterval', 'main');

    const dto = await new DrizzleVariableRepository(deps()).findById(TENANT, variable.id);

    expect(dto!.id).toBe(variable.id);
    expect(dto!.name).toBe('HeartbeatInterval');
    expect(dto!.instance).toBe('main');
    expect(dto!.tenantId).toBe(TENANT);
    expect(
      await new DrizzleVariableRepository(deps()).findById(OTHER_TENANT, variable.id),
    ).toBeUndefined();
  });

  it('findAll and countAll return only the calling tenant rows', async () => {
    const repo = new DrizzleVariableRepository(deps());
    await aVariable(TENANT, 'A');
    await aVariable(TENANT, 'B');
    await aVariable(OTHER_TENANT, 'A');

    const own = await repo.findAll(TENANT);
    expect(own.map((v) => v.name).sort()).toEqual(['A', 'B']);
    expect(await repo.countAll(TENANT)).toBe(2);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });

  it('updateById rewrites the row; a rename onto an existing name/instance pair rejects', async () => {
    const repo = new DrizzleVariableRepository(deps());
    await aVariable(TENANT, 'A', 'x');
    const other = await aVariable(TENANT, 'B', 'x');

    const updated = await repo.updateById(TENANT, other.id, { instance: 'y' });
    expect(updated!.instance).toBe('y');

    // Composite unique index on (tenantId, name, instance); drizzle wraps the pg
    // error in DrizzleQueryError.
    await expect(repo.updateById(TENANT, other.id, { name: 'A', instance: 'x' })).rejects.toThrow(
      /Failed query: update "Variables"/,
    );
    expect((await Variable.findByPk(other.id))!.get('name')).toBe('B');
  });

  it('deleteById removes the row and returns undefined for an unknown id', async () => {
    const repo = new DrizzleVariableRepository(deps());
    const variable = await aVariable(TENANT, 'ToDelete');

    const deleted = await repo.deleteById(TENANT, variable.id);
    expect(deleted!.name).toBe('ToDelete');
    expect(await Variable.count()).toBe(0);
    expect(await repo.deleteById(TENANT, variable.id)).toBeUndefined();
  });
});

describe('DrizzleComponentRepository', () => {
  it('findById maps name, instance and evseDatabaseId', async () => {
    const component = await aComponent(TENANT, 'EVSE', 'evse-1');
    const repo = new DrizzleComponentRepository(deps());

    const dto = await repo.findById(TENANT, component.id);

    expect(dto!.name).toBe('EVSE');
    expect(dto!.instance).toBe('evse-1');
    expect(dto!.evseDatabaseId).toBeNull();
    expect(dto!.evse).toBeUndefined();
    expect(await repo.exists(TENANT, component.id)).toBe(true);
    expect(await repo.exists(OTHER_TENANT, component.id)).toBe(false);
  });

  it('deleteById removes only the calling tenant row of two same-named components', async () => {
    const repo = new DrizzleComponentRepository(deps());
    const own = await aComponent(TENANT, 'Controller', 'c1');
    await aComponent(OTHER_TENANT, 'Controller', 'c1');

    expect(await repo.deleteById(TENANT, 999_999)).toBeUndefined();

    const deleted = await repo.deleteById(TENANT, own.id);
    expect(deleted!.id).toBe(own.id);
    expect(await Component.count()).toBe(1);
    expect((await Component.findOne())!.get('tenantId')).toBe(OTHER_TENANT);
  });
});

async function aConnectorWithId(tenantId: number, id: number): Promise<number> {
  if (await Connector.findByPk(id)) {
    return id;
  }
  const station = await stationIdFor(tenantId, `CS-conn-${tenantId}`);
  const evse = await Evse.create({ tenantId, stationId: station, evseTypeId: id } as any);
  await Connector.create({
    id,
    tenantId,
    stationId: station,
    evseId: evse.get('id'),
    connectorId: id,
    evseTypeConnectorId: id,
    status: 'Available',
    timestamp: new Date().toISOString(),
  } as any);
  return id;
}

describe('DrizzleComponentRepository.findOrCreateEvseAndComponent', () => {
  it('creates the component and its EVSE once, then returns the same rows', async () => {
    const repo = new DrizzleComponentRepository(deps());
    const componentType = {
      name: 'Connector',
      evse: { id: 1, connectorId: await aConnectorWithId(TENANT, 2) },
    };

    const first = await repo.findOrCreateEvseAndComponent(TENANT, componentType);
    const second = await repo.findOrCreateEvseAndComponent(TENANT, componentType);

    expect(second.id).toBe(first.id);
    expect(await Component.count()).toBe(1);
    expect(await EvseType.count()).toBe(1);
    const evse = (await EvseType.findOne())!;
    expect(first.evseDatabaseId).toBe(evse.get('databaseId'));
  });

  it('matches an instance-less component by NULL rather than creating a second', async () => {
    const repo = new DrizzleComponentRepository(deps());
    await aComponent(TENANT, 'EVSE');

    const found = await repo.findOrCreateEvseAndComponent(TENANT, { name: 'EVSE' });

    expect(await Component.count()).toBe(1);
    expect(found.instance).toBeNull();
  });

  it('does not seed default attributes without an ocppConnectionName', async () => {
    const repo = new DrizzleComponentRepository(deps());

    await repo.findOrCreateEvseAndComponent(TENANT, { name: 'Connector' });

    expect(await VariableAttribute.count()).toBe(0);
  });

  it('seeds Present/Available/Enabled only on the creating call', async () => {
    const repo = new DrizzleComponentRepository(deps());
    await aStation(TENANT);

    const created = await repo.findOrCreateEvseAndComponent(TENANT, { name: 'Connector' }, STATION);
    expect(await VariableAttribute.count()).toBe(3);

    const names = (await Variable.findAll()).map((v) => v.get('name')).sort();
    expect(names).toEqual(['Available', 'Enabled', 'Present']);
    expect(await ComponentVariable.count()).toBe(3);

    const attribute = (await VariableAttribute.findOne())!;
    expect(attribute.get('componentId')).toBe(created.id);
    expect(attribute.get('value')).toBe('true');
    expect(attribute.get('stationId')).toBe(await stationIdFor(TENANT, STATION));

    // Second call finds the existing component, so nothing is seeded again.
    await repo.findOrCreateEvseAndComponent(TENANT, { name: 'Connector' }, STATION);
    expect(await VariableAttribute.count()).toBe(3);
  });

  it('rolls the whole seeding back when the station does not exist', async () => {
    const repo = new DrizzleComponentRepository(deps());

    await expect(
      repo.findOrCreateEvseAndComponent(TENANT, { name: 'Connector' }, 'CS-missing'),
    ).rejects.toThrow(/no charging station named/);

    // The component insert shares the transaction with the seeding that threw.
    expect(await Component.count()).toBe(0);
    expect(await VariableAttribute.count()).toBe(0);
  });

  it('keeps one component per EVSE instead of repointing the first', async () => {
    const repo = new DrizzleComponentRepository(deps());

    const connectorId = await aConnectorWithId(TENANT, 1);
    const first = await repo.findOrCreateEvseAndComponent(TENANT, {
      name: 'Connector',
      evse: { id: 1, connectorId },
    });
    const second = await repo.findOrCreateEvseAndComponent(TENANT, {
      name: 'Connector',
      evse: { id: 2, connectorId },
    });

    expect(second.id).not.toBe(first.id);
    expect(second.evseDatabaseId).not.toBe(first.evseDatabaseId);
    expect(await Component.count()).toBe(2);
    expect(await EvseType.count()).toBe(2);

    // The first EVSE's component must be left where it was.
    const reloaded = await Component.findByPk(first.id!);
    expect(reloaded!.get('evseDatabaseId')).toBe(first.evseDatabaseId);
  });

  it('still dedupes station-level components, which carry no evse', async () => {
    const repo = new DrizzleComponentRepository(deps());

    const first = await repo.findOrCreateEvseAndComponent(TENANT, { name: 'ClockCtrlr' });
    const again = await repo.findOrCreateEvseAndComponent(TENANT, { name: 'ClockCtrlr' });

    expect(again.id).toBe(first.id);
    expect(first.evseDatabaseId).toBeNull();
    expect(await Component.count()).toBe(1);
  });
});

describe('DrizzleComponentRepository.findOrCreateEvseAndComponentAndVariable', () => {
  it('links component to variable once across repeated calls', async () => {
    const repo = new DrizzleComponentRepository(deps());
    const args = [TENANT, { name: 'Connector' }, { name: 'AvailabilityState' }] as const;

    const [c1, v1] = await repo.findOrCreateEvseAndComponentAndVariable(...args);
    const [c2, v2] = await repo.findOrCreateEvseAndComponentAndVariable(...args);

    expect(c2.id).toBe(c1.id);
    expect(v2.id).toBe(v1.id);
    expect(await ComponentVariable.count()).toBe(1);
  });

  it('keeps variables with the same name but different instances apart', async () => {
    const repo = new DrizzleComponentRepository(deps());

    const [, plain] = await repo.findOrCreateEvseAndComponentAndVariable(
      TENANT,
      { name: 'Connector' },
      { name: 'Power' },
    );
    const [, scoped] = await repo.findOrCreateEvseAndComponentAndVariable(
      TENANT,
      { name: 'Connector' },
      { name: 'Power', instance: 'L1' },
    );

    expect(scoped.id).not.toBe(plain.id);
    expect(await Variable.count()).toBe(2);
    expect(await ComponentVariable.count()).toBe(2);
  });
});

describe('DrizzleComponentRepository.findComponentAndVariable', () => {
  it('resolves the component belonging to the requested EVSE', async () => {
    const repo = new DrizzleComponentRepository(deps());
    const connectorId = await aConnectorWithId(TENANT, 1);
    const onEvse1 = await repo.findOrCreateEvseAndComponent(TENANT, {
      name: 'Connector',
      evse: { id: 1, connectorId },
    });
    const onEvse2 = await repo.findOrCreateEvseAndComponent(TENANT, {
      name: 'Connector',
      evse: { id: 2, connectorId },
    });
    await aVariable(TENANT, 'AvailabilityState');

    const [first] = await repo.findComponentAndVariable(
      TENANT,
      { name: 'Connector', evse: { id: 1, connectorId } },
      { name: 'AvailabilityState' },
    );
    const [second] = await repo.findComponentAndVariable(
      TENANT,
      { name: 'Connector', evse: { id: 2, connectorId } },
      { name: 'AvailabilityState' },
    );

    expect(onEvse1.id).not.toBe(onEvse2.id);
    expect(first!.id).toBe(onEvse1.id);
    expect(second!.id).toBe(onEvse2.id);
  });

  it('matches nothing when the requested EVSE does not exist', async () => {
    const repo = new DrizzleComponentRepository(deps());
    const connectorId = await aConnectorWithId(TENANT, 1);
    await repo.findOrCreateEvseAndComponent(TENANT, {
      name: 'Connector',
      evse: { id: 1, connectorId },
    });
    await aVariable(TENANT, 'AvailabilityState');

    const [component] = await repo.findComponentAndVariable(
      TENANT,
      { name: 'Connector', evse: { id: 99, connectorId } },
      { name: 'AvailabilityState' },
    );

    expect(component).toBeUndefined();
  });

  it('returns the variable with its characteristics attached', async () => {
    const repo = new DrizzleComponentRepository(deps());
    await aComponent(TENANT, 'Connector');
    const variable = await aVariable(TENANT, 'AvailabilityState');
    await VariableCharacteristics.create({
      tenantId: TENANT,
      variableId: variable.id,
      dataType: 'integer',
      supportsMonitoring: true,
    } as any);

    const [component, found] = await repo.findComponentAndVariable(
      TENANT,
      { name: 'Connector' },
      { name: 'AvailabilityState' },
    );

    expect(component!.name).toBe('Connector');
    expect(found!.id).toBe(variable.id);
    expect(found!.variableCharacteristics!.dataType).toBe('integer');
  });

  it('returns undefined per side and scopes to the tenant', async () => {
    const repo = new DrizzleComponentRepository(deps());
    await aComponent(TENANT, 'Connector');
    await aVariable(OTHER_TENANT, 'AvailabilityState');

    const [component, variable] = await repo.findComponentAndVariable(
      TENANT,
      { name: 'Connector' },
      { name: 'AvailabilityState' },
    );

    expect(component).toBeDefined();
    expect(variable).toBeUndefined();
    expect(
      (await repo.findComponentAndVariable(OTHER_TENANT, { name: 'Connector' }, { name: 'x' }))[0],
    ).toBeUndefined();
  });

  it('leaves variableCharacteristics undefined when none exist', async () => {
    const repo = new DrizzleComponentRepository(deps());
    await aVariable(TENANT, 'AvailabilityState');

    const [, variable] = await repo.findComponentAndVariable(
      TENANT,
      { name: 'Connector' },
      { name: 'AvailabilityState' },
    );

    expect(variable!.variableCharacteristics).toBeUndefined();
  });
});

describe('DrizzleComponentRepository.findConnectorComponentsForAvailabilityState', () => {
  async function seedConnector(
    tenantId: number,
    evseId: number,
    connectorId: number,
    variableName = 'AvailabilityState',
  ): Promise<{ id: number }> {
    const evse = await EvseType.create({
      id: evseId,
      connectorId: await aConnectorWithId(tenantId, connectorId),
      tenantId,
    } as any);
    // components_tenantId_name is unique where instance is null, so each seeded
    // connector component needs its own instance.
    const component = await Component.create({
      name: 'Connector',
      instance: `${evseId}-${connectorId}`,
      tenantId,
      evseDatabaseId: evse.get('databaseId'),
    } as any);
    // One shared variable row per tenant; the join table is what fans it out
    // across connector components, so this must not create a second.
    const [variable] = await Variable.findOrCreate({
      where: { name: variableName, instance: null, tenantId },
      defaults: { name: variableName, tenantId } as any,
    });
    await ComponentVariable.create({
      tenantId,
      componentId: component.get('id'),
      variableId: variable.get('id'),
    } as any);
    return component as unknown as { id: number };
  }

  it('hydrates evse and variables for the matching EVSE/connector pair', async () => {
    const repo = new DrizzleComponentRepository(deps());
    const wanted = await seedConnector(TENANT, 1, 1);
    await seedConnector(TENANT, 1, 2);
    await seedConnector(TENANT, 2, 1);

    const rows = await repo.findConnectorComponentsForAvailabilityState(TENANT, 1, 1);

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(wanted.id);
    expect(rows[0].evse!.id).toBe(1);
    expect(rows[0].evse!.connectorId).toBe(1);
    expect(rows[0].variables!.map((v) => v.name)).toEqual(['AvailabilityState']);
  });

  it('excludes a component whose only variable is not AvailabilityState', async () => {
    const repo = new DrizzleComponentRepository(deps());
    await seedConnector(TENANT, 1, 1, 'Power');

    expect(await repo.findConnectorComponentsForAvailabilityState(TENANT, 1, 1)).toEqual([]);
  });

  it('excludes a component with no EVSE and does not cross tenants', async () => {
    const repo = new DrizzleComponentRepository(deps());
    const component = await Component.create({ name: 'Connector', tenantId: TENANT } as any);
    const variable = await Variable.create({ name: 'AvailabilityState', tenantId: TENANT } as any);
    await ComponentVariable.create({
      tenantId: TENANT,
      componentId: component.get('id'),
      variableId: variable.get('id'),
    } as any);
    await seedConnector(OTHER_TENANT, 1, 1);

    expect(await repo.findConnectorComponentsForAvailabilityState(TENANT, 1, 1)).toEqual([]);
  });
});

describe('DrizzleVariableCharacteristicsRepository', () => {
  it('findById converts DECIMAL columns from strings to numbers', async () => {
    const variable = await aVariable(TENANT, 'Voltage');
    const row = await VariableCharacteristics.create({
      unit: 'V',
      dataType: 'decimal',
      minLimit: 0.5,
      maxLimit: 100.25,
      supportsMonitoring: true,
      variableId: variable.id,
      tenantId: TENANT,
    } as any);

    const dto = await new DrizzleVariableCharacteristicsRepository(deps()).findById(
      TENANT,
      (row as unknown as { id: number }).id,
    );

    expect(dto!.minLimit).toBe(0.5);
    expect(dto!.maxLimit).toBe(100.25);
    expect(typeof dto!.minLimit).toBe('number');
    expect(dto!.unit).toBe('V');
    expect(dto!.supportsMonitoring).toBe(true);
    expect(dto!.variableId).toBe(variable.id);
  });

  it('updateById rejects a duplicate variableId', async () => {
    const repo = new DrizzleVariableCharacteristicsRepository(deps());
    const v1 = await aVariable(TENANT, 'A');
    const v2 = await aVariable(TENANT, 'B');
    await VariableCharacteristics.create({
      dataType: 'string',
      supportsMonitoring: false,
      variableId: v1.id,
      tenantId: TENANT,
    } as any);
    const second = await VariableCharacteristics.create({
      dataType: 'string',
      supportsMonitoring: false,
      variableId: v2.id,
      tenantId: TENANT,
    } as any);
    const secondId = (second as unknown as { id: number }).id;

    // Unique index on variableId.
    await expect(repo.updateById(TENANT, secondId, { variableId: v1.id })).rejects.toThrow(
      /Failed query: update "VariableCharacteristics"/,
    );
    expect((await VariableCharacteristics.findByPk(secondId))!.get('variableId')).toBe(v2.id);
  });
});

describe('DrizzleVariableStatusRepository', () => {
  it('findById maps value, status, statusInfo and variableAttributeId', async () => {
    const attribute = await anAttribute(TENANT);
    const row = await VariableStatus.create({
      value: '3600',
      status: 'Accepted',
      statusInfo: { reasonCode: 'Applied', additionalInfo: 'restart pending' },
      variableAttributeId: attribute.id,
      tenantId: TENANT,
    } as any);
    const rowId = (row as unknown as { id: number }).id;
    const repo = new DrizzleVariableStatusRepository(deps());

    const dto = await repo.findById(TENANT, rowId);

    expect(dto!.value).toBe('3600');
    expect(dto!.status).toBe('Accepted');
    expect(dto!.statusInfo).toEqual({ reasonCode: 'Applied', additionalInfo: 'restart pending' });
    expect(dto!.variableAttributeId).toBe(attribute.id);
    expect(await repo.findById(OTHER_TENANT, rowId)).toBeUndefined();
  });

  it('updateById returns undefined for an unknown id; deleteById returns the removed row', async () => {
    const repo = new DrizzleVariableStatusRepository(deps());
    const row = await VariableStatus.create({
      value: 'x',
      status: 'Rejected',
      tenantId: TENANT,
    } as any);
    const rowId = (row as unknown as { id: number }).id;

    expect(await repo.updateById(TENANT, 999_999, { status: 'Accepted' })).toBeUndefined();

    const deleted = await repo.deleteById(TENANT, rowId);
    expect(deleted!.status).toBe('Rejected');
    expect(await VariableStatus.count()).toBe(0);
  });
});

describe('DrizzleEventDataRepository', () => {
  async function anEvent(
    tenantId: number,
    overrides: Record<string, unknown> = {},
  ): Promise<{ id: number }> {
    const { ocppConnectionName = STATION, ...rest } = overrides;
    const event = await EventData.create({
      stationId: await stationIdFor(tenantId, ocppConnectionName as string),
      eventId: 1,
      trigger: 'Delta',
      timestamp: new Date('2025-04-01T08:30:00.000Z'),
      actualValue: '22.5',
      eventNotificationType: 'HardWiredNotification',
      tenantId,
      ...rest,
    } as any);
    return event as unknown as { id: number };
  }

  it('findById converts timestamp to ISO and scopes to the tenant', async () => {
    const variable = await aVariable(TENANT, 'Temperature');
    const event = await anEvent(TENANT, { variableId: variable.id, cleared: false, cause: 7 });
    const repo = new DrizzleEventDataRepository(deps());

    const dto = await repo.findById(TENANT, event.id);

    expect(dto!.timestamp).toBe('2025-04-01T08:30:00.000Z');
    expect(dto!.eventId).toBe(1);
    expect(dto!.trigger).toBe('Delta');
    expect(dto!.actualValue).toBe('22.5');
    expect(dto!.cause).toBe(7);
    expect(dto!.cleared).toBe(false);
    expect(dto!.variableId).toBe(variable.id);
    expect(await repo.findById(OTHER_TENANT, event.id)).toBeUndefined();
  });

  it('findAll returns repeated events for one station: eventId restarts across boots', async () => {
    await anEvent(TENANT, { eventId: 1 });
    await anEvent(TENANT, { eventId: 1, timestamp: new Date('2025-04-02T08:30:00.000Z') });
    await anEvent(OTHER_TENANT, { eventId: 1 });

    const own = await new DrizzleEventDataRepository(deps()).findAll(TENANT);

    expect(own).toHaveLength(2);
    expect(own.every((e) => e.eventId === 1)).toBe(true);
    expect(await EventData.count()).toBe(3);
  });

  it('updateById sets cleared on the stored event', async () => {
    const event = await anEvent(TENANT, { cleared: false });

    const dto = await new DrizzleEventDataRepository(deps()).updateById(TENANT, event.id, {
      cleared: true,
    });

    expect(dto!.cleared).toBe(true);
    expect((await EventData.findByPk(event.id))!.get('cleared')).toBe(true);
  });
});

describe('DrizzleVariableAttributeRepository', () => {
  it('findById maps sequelize defaults and carries the station FK', async () => {
    const station = await aStation(TENANT);
    const variable = await aVariable(TENANT, 'HeartbeatInterval');
    const attribute = await anAttribute(TENANT, {
      value: '3600',
      variableId: variable.id,
      generatedAt: new Date('2025-03-01T10:00:00.000Z'),
    });

    const dto = await new DrizzleVariableAttributeRepository(attributeDeps()).findById(
      TENANT,
      attribute.id,
    );

    expect(dto!.type).toBe('Actual');
    expect(dto!.dataType).toBe('string');
    expect(dto!.mutability).toBe('ReadWrite');
    expect(dto!.persistent).toBe(false);
    expect(dto!.constant).toBe(false);
    expect(dto!.value).toBe('3600');
    expect(dto!.generatedAt).toBe('2025-03-01T10:00:00.000Z');
    expect(dto!.variableId).toBe(variable.id);
    expect(dto!.stationId).toBe(station.id);
    expect((await VariableAttribute.findByPk(attribute.id))!.get('stationId')).toBe(station.id);
  });

  it('updateAllByQueryString touches only rows matching connection name and tenant', async () => {
    await aStation(TENANT);
    await aStation(OTHER_TENANT);
    await aStation(TENANT, 'CS-002');
    const v1 = await aVariable(TENANT, 'A');
    const v2 = await aVariable(TENANT, 'B');
    const v3 = await aVariable(OTHER_TENANT, 'A');
    const a1 = await anAttribute(TENANT, { variableId: v1.id, value: 'old' });
    const a2 = await anAttribute(TENANT, { variableId: v2.id, value: 'old' });
    const other = await anAttribute(OTHER_TENANT, { variableId: v3.id, value: 'old' });
    const elsewhere = await anAttribute(TENANT, {
      ocppConnectionName: 'CS-002',
      value: 'old',
    });

    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    const onUpdated = vi.fn();
    repo.on('updated', onUpdated);

    const updated = await repo.updateAllByQueryString(
      { ocppConnectionName: STATION, tenantId: TENANT },
      { value: '42' },
    );

    expect(updated.map((a) => a.id!).sort((x, y) => x - y)).toEqual([a1.id, a2.id]);
    expect(updated.every((a) => a.value === '42')).toBe(true);
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(onUpdated.mock.calls[0][0]).toHaveLength(2);
    expect((await VariableAttribute.findByPk(other.id))!.get('value')).toBe('old');
    expect((await VariableAttribute.findByPk(elsewhere.id))!.get('value')).toBe('old');
  });

  it('updateAllByQueryString returns an empty list when nothing matches', async () => {
    await aStation(TENANT);
    await anAttribute(TENANT, { value: 'old' });

    const updated = await new DrizzleVariableAttributeRepository(
      attributeDeps(),
    ).updateAllByQueryString({ ocppConnectionName: 'GHOST', tenantId: TENANT }, { value: '42' });

    expect(updated).toEqual([]);
    expect((await VariableAttribute.findOne())!.get('value')).toBe('old');
  });
});

describe('drizzle row-to-DTO mappers', () => {
  const timestamps = {
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  };

  it('toVariableAttributeDto converts generatedAt to ISO and null flags to false', () => {
    const dto = toVariableAttributeDto({
      id: 4,
      stationId: 9,
      type: null,
      dataType: 'string',
      value: null,
      mutability: null,
      persistent: null,
      constant: null,
      generatedAt: new Date('2025-03-01T10:00:00.000Z'),
      variableId: 12,
      componentId: null,
      evseDatabaseId: null,
      bootConfigId: null,
      tenantId: TENANT,
      ...timestamps,
    } as VariableAttributeEntity);

    expect(dto.generatedAt).toBe('2025-03-01T10:00:00.000Z');
    expect(dto.type).toBeNull();
    expect(dto.value).toBeNull();
    expect(dto.mutability).toBeNull();
    expect(dto.persistent).toBe(false);
    expect(dto.constant).toBe(false);
    expect(dto.variableId).toBe(12);
    expect(dto.componentId).toBeNull();
    expect(dto.stationId).toBe(9);
  });

  it('toVariableAttributeDto leaves generatedAt undefined when the column is null', () => {
    const dto = toVariableAttributeDto({
      id: 5,
      stationId: 12,
      type: 'Target',
      dataType: 'integer',
      value: '10',
      mutability: 'ReadOnly',
      persistent: true,
      constant: true,
      generatedAt: null,
      variableId: null,
      componentId: 3,
      evseDatabaseId: 6,
      bootConfigId: 7,
      tenantId: TENANT,
      ...timestamps,
    } as VariableAttributeEntity);

    expect(dto.generatedAt).toBeUndefined();
    expect(dto.type).toBe('Target');
    expect(dto.persistent).toBe(true);
    expect(dto.evseDatabaseId).toBe(6);
    expect(dto.bootConfigId).toBe(7);
  });

  it('toVariableDto substitutes an empty name and keeps a null instance', () => {
    const dto = toVariableDto({
      id: 1,
      name: null,
      instance: null,
      tenantId: TENANT,
      ...timestamps,
    } as VariableEntity);

    expect(dto.name).toBe('');
    expect(dto.instance).toBeNull();
    expect(dto.customData).toBeUndefined();
    expect(dto.tenant).toBeUndefined();
    expect(dto.createdAt).toEqual(timestamps.createdAt);
  });

  it('toComponentDto maps scalars and leaves relation fields undefined', () => {
    const dto = toComponentDto({
      id: 2,
      name: 'EVSE',
      instance: 'evse-1',
      evseDatabaseId: 15,
      tenantId: TENANT,
      ...timestamps,
    } as ComponentEntity);

    expect(dto.name).toBe('EVSE');
    expect(dto.instance).toBe('evse-1');
    expect(dto.evseDatabaseId).toBe(15);
    expect(dto.evse).toBeUndefined();
    expect(dto.variables).toBeUndefined();
  });

  it('toVariableCharacteristicsDto converts numeric strings and null supportsMonitoring', () => {
    const dto = toVariableCharacteristicsDto({
      id: 3,
      unit: null,
      dataType: 'decimal',
      minLimit: '0.5',
      maxLimit: null,
      valuesList: null,
      supportsMonitoring: null,
      variableId: 8,
      tenantId: TENANT,
      ...timestamps,
    } as VariableCharacteristicsEntity);

    expect(dto.minLimit).toBe(0.5);
    expect(dto.maxLimit).toBeNull();
    expect(dto.unit).toBeNull();
    expect(dto.supportsMonitoring).toBe(false);
    expect(dto.variableId).toBe(8);
  });

  it('toVariableStatusDto substitutes empty strings for null value and status', () => {
    const dto = toVariableStatusDto({
      id: 6,
      value: null,
      status: null,
      statusInfo: { reasonCode: 'X' },
      variableAttributeId: null,
      tenantId: TENANT,
      ...timestamps,
    } as VariableStatusEntity);

    expect(dto.value).toBe('');
    expect(dto.status).toBe('');
    expect(dto.statusInfo).toEqual({ reasonCode: 'X' });
    expect(dto.variableAttributeId).toBeNull();
  });

  it('toEventDataDto converts timestamp to ISO and null FK columns to undefined', () => {
    const dto = toEventDataDto({
      id: 7,
      stationId: 9,
      eventId: 3,
      trigger: 'Alerting',
      cause: null,
      timestamp: new Date('2025-04-01T08:30:00.000Z'),
      actualValue: '55',
      techCode: null,
      techInfo: null,
      cleared: true,
      transactionId: null,
      variableMonitoringId: 11,
      eventNotificationType: 'CustomMonitor',
      variableId: null,
      componentId: null,
      tenantId: TENANT,
      ...timestamps,
    } as EventDataEntity);

    expect(dto.timestamp).toBe('2025-04-01T08:30:00.000Z');
    expect(dto.trigger).toBe('Alerting');
    expect(dto.variableId).toBeUndefined();
    expect(dto.componentId).toBeUndefined();
    expect(dto.variableMonitoringId).toBe(11);
    expect(dto.stationId).toBe(9);
  });

  it('toEventDataDto leaves timestamp undefined when the column is null', () => {
    const dto = toEventDataDto({
      id: 8,
      stationId: null,
      eventId: 4,
      trigger: 'Delta',
      cause: 2,
      timestamp: null,
      actualValue: '0',
      techCode: null,
      techInfo: null,
      cleared: null,
      transactionId: null,
      variableMonitoringId: null,
      eventNotificationType: 'HardWiredNotification',
      variableId: 1,
      componentId: 2,
      tenantId: TENANT,
      ...timestamps,
    } as EventDataEntity);

    expect(dto.timestamp).toBeUndefined();
    expect(dto.variableId).toBe(1);
    expect(dto.componentId).toBe(2);
  });
});

describe('DrizzleVariableAttributeRepository.updateResultByStationId', () => {
  const TS = '2026-09-30T12:00:00.000Z';

  // A station-level component, so the lookup exercises the no-EVSE filter branch.
  async function seedAttribute(value: string | null = 'original'): Promise<number> {
    const component = await aComponent(TENANT, 'ClockCtrlr');
    const variable = await aVariable(TENANT, 'TimeOffset');
    const attribute = await anAttribute(TENANT, {
      componentId: component.id,
      variableId: variable.id,
      type: 'Actual',
      value,
    });
    return attribute.id;
  }

  const aResult = (status: string) =>
    ({
      attributeType: 'Actual',
      attributeStatus: status,
      attributeStatusInfo: { reasonCode: 'test' },
      component: { name: 'ClockCtrlr' },
      variable: { name: 'TimeOffset' },
    }) as any;

  it('stores the accepted value and records a status carrying it', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    const attributeId = await seedAttribute();

    const dto = await repo.updateResultByStationId(TENANT, aResult('Accepted'), STATION, TS, 'new');

    expect(dto!.value).toBe('new');
    expect((await VariableAttribute.findByPk(attributeId))!.get('value')).toBe('new');
    const statuses = await VariableStatus.findAll({ where: { variableAttributeId: attributeId } });
    expect(statuses).toHaveLength(1);
    expect(statuses[0].get('status')).toBe('Accepted');
    expect(statuses[0].get('value')).toBe('new');
  });

  it('reverts to the last accepted value when the station rejects the write', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    const attributeId = await seedAttribute();

    await repo.updateResultByStationId(TENANT, aResult('Accepted'), STATION, TS, 'accepted-one');
    // Something else moved the stored value on after that acceptance -- a report, say.
    // Without the revert the rejection would leave 'drifted' in place, so the two
    // outcomes differ here where they would not if the values already matched.
    await VariableAttribute.update({ value: 'drifted' }, { where: { id: attributeId } });

    const dto = await repo.updateResultByStationId(
      TENANT,
      aResult('Rejected'),
      STATION,
      TS,
      'nope',
    );

    expect(dto!.value).toBe('accepted-one');
    expect((await VariableAttribute.findByPk(attributeId))!.get('value')).toBe('accepted-one');
    // The rejected attempt is still recorded, carrying the value the station refused.
    const statuses = await VariableStatus.findAll({ where: { variableAttributeId: attributeId } });
    expect(statuses).toHaveLength(2);
    expect(statuses.map((s) => s.get('status')).sort()).toEqual(['Accepted', 'Rejected']);
  });

  it('clears the value when a rejection has no accepted status to fall back on', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    const attributeId = await seedAttribute();

    const dto = await repo.updateResultByStationId(TENANT, aResult('Rejected'), STATION, TS);

    expect(dto!.value).toBeNull();
    expect((await VariableAttribute.findByPk(attributeId))!.get('value')).toBeNull();
  });

  it('throws when no attribute matches the reported component and variable', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    await seedAttribute();

    await expect(
      repo.updateResultByStationId(
        TENANT,
        { ...aResult('Accepted'), variable: { name: 'NoSuchVariable' } },
        STATION,
        TS,
      ),
    ).rejects.toThrow(/Unable to update variable attribute status/);
  });
});

describe('DrizzleVariableAttributeRepository.createOrUpdateDeviceModelByStationId', () => {
  const TS = '2026-09-30T12:00:00.000Z';

  beforeEach(async () => {
    await aStation(TENANT);
  });

  const aReport = (overrides: Record<string, unknown> = {}) =>
    ({
      component: { name: 'Connector', evse: { id: 1, connectorId: 1 } },
      variable: { name: 'AvailabilityState' },
      variableAttribute: [{ type: 'Actual', value: 'Available' }],
      ...overrides,
    }) as any;

  it('creates the component, variable and attribute on a first report', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    await aConnectorWithId(TENANT, 1);

    const saved = await repo.createOrUpdateDeviceModelByStationId(TENANT, aReport(), STATION, TS);

    expect(saved).toHaveLength(1);
    expect(saved[0].value).toBe('Available');
    // The resolved relations come back without a reload.
    expect(saved[0].component!.name).toBe('Connector');
    expect(saved[0].variable!.name).toBe('AvailabilityState');
    expect(await Component.count({ where: { name: 'Connector' } })).toBe(1);
  });

  it('keeps one attribute per EVSE for the same component and variable name', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    const connectorId = await aConnectorWithId(TENANT, 1);

    const [onEvse1] = await repo.createOrUpdateDeviceModelByStationId(
      TENANT,
      aReport({ component: { name: 'Connector', evse: { id: 1, connectorId } } }),
      STATION,
      TS,
    );
    const [onEvse2] = await repo.createOrUpdateDeviceModelByStationId(
      TENANT,
      aReport({ component: { name: 'Connector', evse: { id: 2, connectorId } } }),
      STATION,
      TS,
    );

    expect(onEvse1.id).not.toBe(onEvse2.id);
    expect(await Component.count({ where: { name: 'Connector' } })).toBe(2);
  });

  it('updates the existing attribute rather than inserting a second', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    await aConnectorWithId(TENANT, 1);

    const [first] = await repo.createOrUpdateDeviceModelByStationId(TENANT, aReport(), STATION, TS);
    const [again] = await repo.createOrUpdateDeviceModelByStationId(
      TENANT,
      aReport({ variableAttribute: [{ type: 'Actual', value: 'Occupied' }] }),
      STATION,
      TS,
    );

    expect(again.id).toBe(first.id);
    expect(again.value).toBe('Occupied');
    // 3 seeded defaults from creating the component, plus the one reported attribute.
    expect(await VariableAttribute.count()).toBe(4);
  });

  it('keeps the stored value for a WriteOnly variable', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    await aConnectorWithId(TENANT, 1);

    await repo.createOrUpdateDeviceModelByStationId(TENANT, aReport(), STATION, TS);
    const [updated] = await repo.createOrUpdateDeviceModelByStationId(
      TENANT,
      aReport({ variableAttribute: [{ type: 'Actual', mutability: 'WriteOnly' }] }),
      STATION,
      TS,
    );

    // B08.FR.03: the station omits a WriteOnly value, which must not blank the row.
    expect(updated.value).toBe('Available');
  });

  it('upserts variable characteristics rather than duplicating them', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    await aConnectorWithId(TENANT, 1);
    const characteristics = { dataType: 'integer', supportsMonitoring: true, unit: 'W' };

    await repo.createOrUpdateDeviceModelByStationId(
      TENANT,
      aReport({ variableCharacteristics: characteristics }),
      STATION,
      TS,
    );
    await repo.createOrUpdateDeviceModelByStationId(
      TENANT,
      aReport({ variableCharacteristics: { ...characteristics, unit: 'kW' } }),
      STATION,
      TS,
    );

    const rows = await VariableCharacteristics.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0].get('unit')).toBe('kW');
  });

  it('writes nothing when two attributes share a type', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    await aConnectorWithId(TENANT, 1);

    await expect(
      repo.createOrUpdateDeviceModelByStationId(
        TENANT,
        aReport({
          variableAttribute: [
            { type: 'Actual', value: 'a' },
            { type: 'Actual', value: 'b' },
          ],
        }),
        STATION,
        TS,
      ),
    ).rejects.toThrow(/different types/);
    expect(await Component.count({ where: { name: 'Connector' } })).toBe(0);
  });
});

describe('DrizzleVariableAttributeRepository.createOrUpdateByGetVariablesResultAndStationId', () => {
  const TS = '2026-09-30T12:00:00.000Z';

  beforeEach(async () => {
    await aStation(TENANT);
  });

  const aResult = (status: string, value?: string) =>
    ({
      attributeType: 'Actual',
      attributeStatus: status,
      attributeStatusInfo: { reasonCode: status },
      attributeValue: value,
      component: { name: 'ClockCtrlr' },
      variable: { name: 'TimeOffset' },
    }) as any;

  it('returns accepted results and records a status for each', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());

    const saved = await repo.createOrUpdateByGetVariablesResultAndStationId(
      TENANT,
      [aResult('Accepted', '+02:00')],
      STATION,
      TS,
    );

    expect(saved).toHaveLength(1);
    expect(saved[0].value).toBe('+02:00');
    const statuses = await VariableStatus.findAll();
    expect(statuses).toHaveLength(1);
    expect(statuses[0].get('status')).toBe('Accepted');
  });

  it('records a rejected result without returning it', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());

    const saved = await repo.createOrUpdateByGetVariablesResultAndStationId(
      TENANT,
      [aResult('Rejected', 'nope')],
      STATION,
      TS,
    );

    // Not returned, but the attempt is still on record against a created attribute.
    expect(saved).toHaveLength(0);
    // 3 seeded defaults from creating ClockCtrlr, plus the attribute this result created.
    expect(await VariableAttribute.count()).toBe(4);
    const statuses = await VariableStatus.findAll();
    expect(statuses).toHaveLength(1);
    expect(statuses[0].get('status')).toBe('Rejected');
    expect(statuses[0].get('value')).toBe('nope');
  });
});

describe('DrizzleVariableAttributeRepository.createOrUpdateBySetVariablesDataAndStationId', () => {
  const TS = '2026-09-30T12:00:00.000Z';

  beforeEach(async () => {
    await aStation(TENANT);
  });

  it('writes one attribute per SetVariables entry', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());

    const saved = await repo.createOrUpdateBySetVariablesDataAndStationId(
      TENANT,
      [
        {
          attributeType: 'Actual',
          attributeValue: '30',
          component: { name: 'ClockCtrlr' },
          variable: { name: 'TimeOffset' },
        },
        {
          attributeType: 'Actual',
          attributeValue: 'true',
          component: { name: 'SecurityCtrlr' },
          variable: { name: 'Enabled' },
        },
      ] as any,
      STATION,
      TS,
    );

    expect(saved).toHaveLength(2);
    expect(saved.map((a) => a.value).sort()).toEqual(['30', 'true']);
    // Two new components seed 3 defaults each. TimeOffset is new, but Enabled is
    // already one of SecurityCtrlr's seeded defaults, so it updates rather than inserts.
    expect(await VariableAttribute.count()).toBe(7);
  });
});

describe('DrizzleVariableAttributeRepository.readAllSetVariableByStationId', () => {
  // Only attributes carrying a bootConfigId are replayed, so each needs a Boot row.
  async function aBootConfig(tenantId: number): Promise<number> {
    const boot = await Boot.create({
      stationId: await stationIdFor(tenantId, STATION),
      status: 'Accepted',
      tenantId,
    } as any);
    return boot.get('id') as number;
  }

  it('returns only the attributes pinned to a boot config', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    const bootConfigId = await aBootConfig(TENANT);
    const component = await aComponent(TENANT, 'ClockCtrlr');
    const variable = await aVariable(TENANT, 'TimeOffset');
    const other = await aVariable(TENANT, 'TimeSource');

    await anAttribute(TENANT, {
      componentId: component.id,
      variableId: variable.id,
      type: 'Actual',
      value: '+02:00',
      bootConfigId,
    });
    // No bootConfigId, so it must not be replayed.
    await anAttribute(TENANT, {
      componentId: component.id,
      variableId: other.id,
      type: 'Actual',
      value: 'Heartbeat',
    });

    const data = await repo.readAllSetVariableByStationId(TENANT, STATION);

    expect(data).toHaveLength(1);
    expect(data[0].attributeValue).toBe('+02:00');
    expect(data[0].component.name).toBe('ClockCtrlr');
    expect(data[0].variable.name).toBe('TimeOffset');
    // A station-level component has no EVSE, so the key is omitted entirely.
    expect(data[0].component.evse).toBeUndefined();
  });

  it('carries the evse through for a component that has one', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    const componentRepo = new DrizzleComponentRepository(deps());
    const bootConfigId = await aBootConfig(TENANT);
    const connectorId = await aConnectorWithId(TENANT, 1);
    const component = await componentRepo.findOrCreateEvseAndComponent(TENANT, {
      name: 'Connector',
      evse: { id: 1, connectorId },
    });
    const variable = await aVariable(TENANT, 'AvailabilityState');
    await anAttribute(TENANT, {
      componentId: component.id,
      variableId: variable.id,
      type: 'Actual',
      value: 'Available',
      bootConfigId,
    });

    const data = await repo.readAllSetVariableByStationId(TENANT, STATION);

    expect(data).toHaveLength(1);
    expect(data[0].component.evse).toEqual({ id: 1, connectorId });
  });

  it('returns nothing for a station that does not exist', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    expect(await repo.readAllSetVariableByStationId(TENANT, 'CS-missing')).toEqual([]);
  });
});

describe('DrizzleVariableAttributeRepository.findVariableAttributeByComponentAndVariable', () => {
  it('resolves the attribute belonging to the requested EVSE', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    await aStation(TENANT);
    const connectorId = await aConnectorWithId(TENANT, 1);

    const [onEvse1] = await repo.createOrUpdateDeviceModelByStationId(
      TENANT,
      {
        component: { name: 'Connector', evse: { id: 1, connectorId } },
        variable: { name: 'AvailabilityState' },
        variableAttribute: [{ type: 'Actual', value: 'Available' }],
      } as any,
      STATION,
      '2026-10-07T12:00:00.000Z',
    );
    const [onEvse2] = await repo.createOrUpdateDeviceModelByStationId(
      TENANT,
      {
        component: { name: 'Connector', evse: { id: 2, connectorId } },
        variable: { name: 'AvailabilityState' },
        variableAttribute: [{ type: 'Actual', value: 'Occupied' }],
      } as any,
      STATION,
      '2026-10-07T12:00:00.000Z',
    );

    // Both directions: with limit(1) and no evse filter one of these would return the
    // other EVSE's row, so asserting only one of them passes by scan order alone.
    const first = await repo.findVariableAttributeByComponentAndVariable(
      TENANT,
      STATION,
      'Actual' as any,
      { name: 'Connector', evse: { id: 1, connectorId } },
      { name: 'AvailabilityState' },
    );
    const second = await repo.findVariableAttributeByComponentAndVariable(
      TENANT,
      STATION,
      'Actual' as any,
      { name: 'Connector', evse: { id: 2, connectorId } },
      { name: 'AvailabilityState' },
    );

    expect(onEvse1.id).not.toBe(onEvse2.id);
    expect(first!.id).toBe(onEvse1.id);
    expect(first!.value).toBe('Available');
    expect(second!.id).toBe(onEvse2.id);
    expect(second!.value).toBe('Occupied');
  });

  it('returns undefined when nothing matches', async () => {
    const repo = new DrizzleVariableAttributeRepository(attributeDeps());
    await aStation(TENANT);

    expect(
      await repo.findVariableAttributeByComponentAndVariable(
        TENANT,
        STATION,
        'Actual' as any,
        { name: 'NoSuchComponent' },
        { name: 'NoSuchVariable' },
      ),
    ).toBeUndefined();
  });
});
