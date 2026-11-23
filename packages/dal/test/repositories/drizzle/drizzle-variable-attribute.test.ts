// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { SystemConfig } from '@citrineos/types';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { describe, expect, it, vi } from 'vitest';
import {
  tenantVariableAttributeTable,
  variableAttributeTable,
} from '@dal/db/drizzle/schema/variable-attribute.js';
import type { VariableAttributeQuerystring } from '@dal/interfaces/queries/variable-attribute.js';
import type { DrizzleComponentRepository } from '@dal/repositories/drizzle/component.js';
import { DrizzleVariableAttributeRepository } from '@dal/repositories/drizzle/variable-attribute.js';

function makeDbSpy() {
  const returning = vi.fn().mockResolvedValue([]);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });
  return {
    db: { update } as unknown as NodePgDatabase,
    update,
    set,
    where,
  };
}

describe('DrizzleVariableAttributeRepository.updateAllByQueryString', () => {
  it('targets the tenant-scoped table when useTenantSchema is true instead of shared public table', async () => {
    const { db, update, where } = makeDbSpy();
    const repo = new DrizzleVariableAttributeRepository({
      config: {} as SystemConfig,
      drizzleInstance: db,
      useTenantSchema: true,
      componentRepository: {} as DrizzleComponentRepository,
    });

    await repo.updateAllByQueryString({ tenantId: 7 } as VariableAttributeQuerystring, {
      bootConfigId: null,
    });

    expect(update).toHaveBeenCalledOnce();
    const updatedTable = update.mock.calls[0][0];
    expect(updatedTable).toBe(tenantVariableAttributeTable(7));
    expect(updatedTable).not.toBe(variableAttributeTable);
    expect(where).toHaveBeenCalledWith(undefined);
  });

  it('includes tenantId=0 filter instead of dropping zero tenantId as falsy', async () => {
    const { db, update, where } = makeDbSpy();
    const repo = new DrizzleVariableAttributeRepository({
      config: {} as SystemConfig,
      drizzleInstance: db,
      useTenantSchema: false,
      componentRepository: {} as DrizzleComponentRepository,
    });

    await repo.updateAllByQueryString({ tenantId: 0 } as VariableAttributeQuerystring, {
      bootConfigId: null,
    });

    expect(update).toHaveBeenCalledOnce();
    expect(where.mock.calls[0][0]).toBeDefined();
  });

  it('returns empty without updating when tenantId is missing', async () => {
    const { db, update } = makeDbSpy();
    const repo = new DrizzleVariableAttributeRepository({
      config: {} as SystemConfig,
      drizzleInstance: db,
      useTenantSchema: false,
      componentRepository: {} as DrizzleComponentRepository,
    });

    const result = await repo.updateAllByQueryString({} as VariableAttributeQuerystring, {
      bootConfigId: null,
    });

    expect(result).toEqual([]);
    expect(update).not.toHaveBeenCalled();
  });
});
