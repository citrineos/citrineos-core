// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { SystemConfig } from '@citrineos/types';
import {
  ChangeConfiguration,
  Component,
  SequelizeChangeConfigurationRepository,
  SequelizeComponentRepository,
  Variable,
} from '../../../index.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// SequelizeComponentRepository is the inherited CRUD surface over Component;
// SequelizeChangeConfigurationRepository adds the OCPP 1.6 configuration upsert.
// device-model-integration.test.ts owns createOrUpdateByGetVariablesResultAndStationId,
// so these suites cover the plain component/variable persistence paths and the
// 1.6 change-configuration flow.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'CS-16-001';

let h: PgHarness;

beforeAll(async () => {
  h = await startPgHarness();
}, 90_000);

afterAll(async () => {
  await h.stop();
});

beforeEach(async () => {
  await resetDb(h);
});

function componentRepo(): SequelizeComponentRepository {
  return new SequelizeComponentRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

function changeConfigRepo(): SequelizeChangeConfigurationRepository {
  return new SequelizeChangeConfigurationRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

// Mirrors the 1.6 response handlers, which pass a plain object cast to the model.
function aConfiguration(overrides: Partial<ChangeConfiguration> = {}): ChangeConfiguration {
  return {
    ocppConnectionName: STATION,
    key: 'HeartbeatInterval',
    value: '300',
    readonly: false,
    ...overrides,
  } as ChangeConfiguration;
}

describe('SequelizeComponentRepository', () => {
  it('create persists the component and readByKey returns it', async () => {
    const repo = componentRepo();
    const created = await repo.create(
      TENANT_A,
      Component.build({ name: 'Connector', instance: '1', tenantId: TENANT_A } as any),
    );

    const found = await repo.readByKey(TENANT_A, created.id);

    expect(found).toBeDefined();
    expect(found!.id).toBe(created.id);
    expect(found!.name).toBe('Connector');
    expect(found!.instance).toBe('1');
    expect(found!.tenantId).toBe(TENANT_A);
  });

  it("readByKey does not return another tenant's component", async () => {
    const created = await Component.create({ name: 'EVSE', tenantId: TENANT_A } as any);

    const found = await componentRepo().readByKey(TENANT_B, created.id);

    expect(found).toBeUndefined();
  });

  it('readOrCreateByQuery creates once, then returns the existing row', async () => {
    const repo = componentRepo();

    const [first, createdFirst] = await repo.readOrCreateByQuery(TENANT_A, {
      where: { name: 'SecurityCtrlr', instance: null },
    });
    const [second, createdSecond] = await repo.readOrCreateByQuery(TENANT_A, {
      where: { name: 'SecurityCtrlr', instance: null },
    });

    expect(createdFirst).toBe(true);
    expect(createdSecond).toBe(false);
    expect(second.id).toBe(first.id);
    expect(first.tenantId).toBe(TENANT_A);
    expect(await Component.count()).toBe(1);
  });

  it('readAllByQuery resolves variables linked through the join table', async () => {
    const component = await Component.create({ name: 'Connector', tenantId: TENANT_A } as any);
    await Component.create({ name: 'EVSE', tenantId: TENANT_A } as any);
    const variable = await Variable.create({ name: 'MaxVoltage', tenantId: TENANT_A } as any);
    // sequelize-typescript exposes $add instead of the classic addVariable mixin.
    await component.$add('variables', variable);

    const rows = await componentRepo().readAllByQuery(TENANT_A, {
      where: { name: 'Connector' },
      include: [Variable],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].variables).toHaveLength(1);
    expect(rows[0].variables![0].name).toBe('MaxVoltage');
  });

  it('rejects a second instance-less component with the same name in a tenant', async () => {
    const repo = componentRepo();
    await repo.create(TENANT_A, Component.build({ name: 'EVSE', tenantId: TENANT_A } as any));

    await expect(
      repo.create(TENANT_A, Component.build({ name: 'EVSE', tenantId: TENANT_A } as any)),
    ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
    expect(await Component.count()).toBe(1);
  });

  it('allows the same name under different instances and in another tenant', async () => {
    await Component.create({ name: 'EVSE', instance: '1', tenantId: TENANT_A } as any);
    await Component.create({ name: 'EVSE', instance: '2', tenantId: TENANT_A } as any);
    await Component.create({ name: 'EVSE', tenantId: TENANT_B } as any);

    expect(await Component.count()).toBe(3);
    expect(await componentRepo().existByQuery(TENANT_A, { where: { name: 'EVSE' } })).toBe(2);
  });

  it('updateByKey writes within the owning tenant only', async () => {
    const created = await Component.create({
      name: 'Connector',
      instance: 'old',
      tenantId: TENANT_A,
    } as any);
    const repo = componentRepo();

    const crossTenant = await repo.updateByKey(
      TENANT_B,
      { instance: 'hijacked' } as Partial<Component>,
      String(created.id),
    );
    const sameTenant = await repo.updateByKey(
      TENANT_A,
      { instance: 'new' } as Partial<Component>,
      String(created.id),
    );

    expect(crossTenant).toBeUndefined();
    expect(sameTenant!.instance).toBe('new');
    expect((await Component.findByPk(created.id))!.instance).toBe('new');
  });

  it('deleteByKey removes the row and returns it', async () => {
    const created = await Component.create({ name: 'Connector', tenantId: TENANT_A } as any);

    const deleted = await componentRepo().deleteByKey(TENANT_A, String(created.id));

    expect(deleted!.name).toBe('Connector');
    expect(await Component.count()).toBe(0);
    expect(await componentRepo().existsByKey(TENANT_A, String(created.id))).toBe(false);
  });
});

describe('SequelizeChangeConfigurationRepository', () => {
  describe('createOrUpdateChangeConfiguration', () => {
    it('creates a configuration when none exists for the station and key', async () => {
      const repo = changeConfigRepo();
      const createdBatches: ChangeConfiguration[][] = [];
      repo.on('created', (rows) => createdBatches.push(rows as ChangeConfiguration[]));

      const result = await repo.createOrUpdateChangeConfiguration(TENANT_A, aConfiguration());

      expect(result!.ocppConnectionName).toBe(STATION);
      expect(result!.key).toBe('HeartbeatInterval');
      expect(result!.value).toBe('300');
      expect(result!.readonly).toBe(false);
      expect(result!.tenantId).toBe(TENANT_A);
      expect(await ChangeConfiguration.count()).toBe(1);
      expect(createdBatches).toHaveLength(1);
      expect(createdBatches[0][0].key).toBe('HeartbeatInterval');
    });

    it('updates the existing row in place on a repeated key', async () => {
      const repo = changeConfigRepo();
      const first = await repo.createOrUpdateChangeConfiguration(TENANT_A, aConfiguration());
      const updatedBatches: ChangeConfiguration[][] = [];
      repo.on('updated', (rows) => updatedBatches.push(rows as ChangeConfiguration[]));

      const second = await repo.createOrUpdateChangeConfiguration(
        TENANT_A,
        aConfiguration({ value: '900', readonly: true }),
      );

      expect(second!.id).toBe(first!.id);
      expect(second!.value).toBe('900');
      expect(second!.readonly).toBe(true);
      expect(await ChangeConfiguration.count()).toBe(1);
      expect(updatedBatches).toHaveLength(1);
      expect(updatedBatches[0][0].value).toBe('900');
      expect((await ChangeConfiguration.findByPk(first!.id))!.value).toBe('900');
    });

    it('keeps rows apart per key and per station', async () => {
      const repo = changeConfigRepo();
      await repo.createOrUpdateChangeConfiguration(TENANT_A, aConfiguration());
      await repo.createOrUpdateChangeConfiguration(
        TENANT_A,
        aConfiguration({ key: 'MeterValueSampleInterval', value: '60' }),
      );
      await repo.createOrUpdateChangeConfiguration(
        TENANT_A,
        aConfiguration({ ocppConnectionName: 'CS-16-002' }),
      );

      const stationRows = await repo.readAllByQuery(TENANT_A, {
        where: { ocppConnectionName: STATION },
      });

      expect(await ChangeConfiguration.count()).toBe(3);
      expect(stationRows).toHaveLength(2);
      expect(stationRows.map((r) => r.key).sort()).toEqual([
        'HeartbeatInterval',
        'MeterValueSampleInterval',
      ]);
    });

    it('scopes the upsert by tenant', async () => {
      const repo = changeConfigRepo();
      await repo.createOrUpdateChangeConfiguration(TENANT_A, aConfiguration());
      await repo.createOrUpdateChangeConfiguration(
        TENANT_B,
        aConfiguration({ tenantId: TENANT_B, value: '600' }),
      );

      const forA = await repo.readAllByQuery(TENANT_A, { where: { key: 'HeartbeatInterval' } });
      const forB = await repo.readAllByQuery(TENANT_B, { where: { key: 'HeartbeatInterval' } });

      expect(await ChangeConfiguration.count()).toBe(2);
      expect(forA).toHaveLength(1);
      expect(forA[0].value).toBe('300');
      expect(forA[0].tenantId).toBe(TENANT_A);
      expect(forB).toHaveLength(1);
      expect(forB[0].value).toBe('600');
      expect(forB[0].tenantId).toBe(TENANT_B);
    });
  });

  describe('error branches', () => {
    it('readOnlyOneByQuery throws when the key matches rows on two stations', async () => {
      const repo = changeConfigRepo();
      await repo.createOrUpdateChangeConfiguration(TENANT_A, aConfiguration());
      await repo.createOrUpdateChangeConfiguration(
        TENANT_A,
        aConfiguration({ ocppConnectionName: 'CS-16-002' }),
      );

      await expect(
        repo.readOnlyOneByQuery(TENANT_A, { where: { key: 'HeartbeatInterval' } }),
      ).rejects.toThrow(/More than one value found/);
    });

    it('rejects a key longer than the 50-character column', async () => {
      const result = changeConfigRepo().createOrUpdateChangeConfiguration(
        TENANT_A,
        aConfiguration({ key: 'X'.repeat(60) }),
      );

      await expect(result).rejects.toThrow(/value too long/);
      expect(await ChangeConfiguration.count()).toBe(0);
    });
  });
});
