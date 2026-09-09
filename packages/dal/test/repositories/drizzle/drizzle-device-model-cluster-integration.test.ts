// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import {
  ChargingStation,
  Component,
  DrizzleVariableAttributeRepository,
  Variable,
  VariableAttribute,
  VariableCharacteristics,
  VariableStatus,
} from '../../../index.js';
import { EventData } from '@dal/models/variable-monitoring/index.js';
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

async function aStation(tenantId: number, ocppConnectionName = STATION): Promise<{ id: number }> {
  const station = await ChargingStation.create({
    ocppConnectionName,
    isOnline: false,
    tenantId,
  } as any);
  return station as unknown as { id: number };
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
  const attribute = await VariableAttribute.create({
    ocppConnectionName: STATION,
    tenantId,
    ...overrides,
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
    const event = await EventData.create({
      ocppConnectionName: STATION,
      eventId: 1,
      trigger: 'Delta',
      timestamp: new Date('2025-04-01T08:30:00.000Z'),
      actualValue: '22.5',
      eventNotificationType: 'HardWiredNotification',
      tenantId,
      ...overrides,
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
  it('findById maps sequelize defaults and drops the stationId column', async () => {
    const station = await aStation(TENANT);
    const variable = await aVariable(TENANT, 'HeartbeatInterval');
    const attribute = await anAttribute(TENANT, {
      value: '3600',
      variableId: variable.id,
      generatedAt: new Date('2025-03-01T10:00:00.000Z'),
    });

    const dto = await new DrizzleVariableAttributeRepository(deps()).findById(TENANT, attribute.id);

    expect(dto!.type).toBe('Actual');
    expect(dto!.dataType).toBe('string');
    expect(dto!.mutability).toBe('ReadWrite');
    expect(dto!.persistent).toBe(false);
    expect(dto!.constant).toBe(false);
    expect(dto!.value).toBe('3600');
    expect(dto!.generatedAt).toBe('2025-03-01T10:00:00.000Z');
    expect(dto!.variableId).toBe(variable.id);
    expect('stationId' in dto!).toBe(false);
    // The sequelize BeforeCreate hook resolved the FK on the stored row.
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

    const repo = new DrizzleVariableAttributeRepository(deps());
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

    const updated = await new DrizzleVariableAttributeRepository(deps()).updateAllByQueryString(
      { ocppConnectionName: 'GHOST', tenantId: TENANT },
      { value: '42' },
    );

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
      ocppConnectionName: STATION,
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
    expect('stationId' in dto).toBe(false);
  });

  it('toVariableAttributeDto leaves generatedAt undefined when the column is null', () => {
    const dto = toVariableAttributeDto({
      id: 5,
      stationId: null,
      ocppConnectionName: STATION,
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
      ocppConnectionName: STATION,
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
    expect('stationId' in dto).toBe(false);
  });

  it('toEventDataDto leaves timestamp undefined when the column is null', () => {
    const dto = toEventDataDto({
      id: 8,
      stationId: null,
      ocppConnectionName: STATION,
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
