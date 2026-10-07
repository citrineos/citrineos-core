// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ChangeConfiguration } from '@dal/db/sequelize/index.js';
import type { SystemConfig } from '@citrineos/types';
import { SequelizeChangeConfigurationRepository } from '../../../index.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// SequelizeChangeConfigurationRepository adds the OCPP 1.6 configuration upsert.
// device-model-integration.test.ts owns createOrUpdateByGetVariablesResultAndStationId,
// so this suite covers the 1.6 change-configuration flow.

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
