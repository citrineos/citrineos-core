// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { SystemConfig } from '@citrineos/types';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { describe, expect, it, vi } from 'vitest';
import { bootTable, tenantBootTable } from '@dal/db/drizzle/schema/boot.js';
import { DrizzleBootRepository } from '@dal/repositories/drizzle/boot.js';
import type { DrizzleVariableAttributeRepository } from '@dal/repositories/drizzle/variable-attribute.js';

describe('DrizzleBootRepository useTenantSchema', () => {
  it('forwards useTenantSchema to DrizzleRepository so getTable targets tenant schemas', async () => {
    const from = vi.fn().mockResolvedValue([]);
    const select = vi.fn().mockReturnValue({ from });
    const repo = new DrizzleBootRepository({
      config: {} as SystemConfig,
      drizzleInstance: { select } as unknown as NodePgDatabase,
      useTenantSchema: true,
      variableAttributeRepository: {} as DrizzleVariableAttributeRepository,
    });

    await repo.findAll(9);

    expect(from).toHaveBeenCalledWith(tenantBootTable(9));
    expect(from).not.toHaveBeenCalledWith(bootTable);
  });
});
