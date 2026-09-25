// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { SystemConfig } from '@citrineos/types';
import {
  DrizzleRepository,
  DrizzleTenantScopedRepository,
  type CitrineTable,
  type TenantScopedTable,
} from '../../../src/repositories/drizzle/base.js';
import {
  chargingStationNetworkProfileTable,
  type ChargingStationNetworkProfileEntity,
} from '../../../src/db/drizzle/schema/charging-station-network-profile.js';
import { chargingStationTable } from '../../../src/db/drizzle/schema/charging-station.js';
import { DrizzleChargingStationNetworkProfileRepository } from '../../../src/repositories/drizzle/charging-station-network-profile.js';

/**
 * Guards the split between the two repository base classes.
 *
 * Join tables — ChargingStationNetworkProfiles, ComponentVariables,
 * LocalListVersionAuthorizations, SendLocalListAuthorizations — have a tenantId but
 * no `id` column, so the id-keyed methods cannot work on them and must not be
 * inherited. These assertions exist so that moving such a table back onto
 * DrizzleRepository fails loudly rather than compiling and failing at runtime.
 *
 * No database: the repositories are constructed with a stub executor, and nothing
 * here issues a query.
 */

// ─── Compile-time contract ───────────────────────────────────────────────────
// A plain `extends` check rather than expectTypeOf, so `tsc -p` catches a
// regression too, not only a vitest typecheck run.

type Assert<T extends true> = T;
type JoinTable = typeof chargingStationNetworkProfileTable;
type IdKeyedTable = typeof chargingStationTable;

export type _JoinTableIsTenantScoped = Assert<JoinTable extends TenantScopedTable ? true : false>;
export type _JoinTableIsNotIdKeyed = Assert<JoinTable extends CitrineTable ? false : true>;
export type _StationTableIsIdKeyed = Assert<IdKeyedTable extends CitrineTable ? true : false>;

// ─── Runtime shape ───────────────────────────────────────────────────────────

const deps = {
  config: {} as SystemConfig,
  // Never used: no test here runs a query.
  drizzleInstance: {} as NodePgDatabase,
};

class JoinRepository extends DrizzleTenantScopedRepository<
  typeof chargingStationNetworkProfileTable,
  ChargingStationNetworkProfileEntity
> {
  protected getTable(): typeof chargingStationNetworkProfileTable {
    return chargingStationNetworkProfileTable;
  }

  protected toDto(row: ChargingStationNetworkProfileEntity): ChargingStationNetworkProfileEntity {
    return row;
  }
}

const ID_KEYED_METHODS = ['findById', 'exists', 'updateById', 'deleteById'] as const;
const TENANT_SCOPED_METHODS = ['findAll', 'countAll'] as const;

describe('DrizzleTenantScopedRepository', () => {
  const repository = new JoinRepository(deps);

  it.each(ID_KEYED_METHODS)('does not inherit %s', (method) => {
    // The table has no `id`, so these could only ever throw at runtime.
    expect(repository[method as keyof JoinRepository]).toBeUndefined();
  });

  it.each(TENANT_SCOPED_METHODS)('still provides %s', (method) => {
    expect(typeof repository[method as keyof JoinRepository]).toBe('function');
  });

  it('exposes the transaction and event helpers to subclasses', () => {
    // Natural-key writes in join repositories must be able to buffer their events
    // until commit, which means reaching `raise` and `withAtomicWrite`.
    const internals = repository as unknown as Record<string, unknown>;
    expect(typeof internals.raise).toBe('function');
    expect(typeof internals.withAtomicWrite).toBe('function');
    expect(typeof internals.tenantFilter).toBe('function');
  });
});

describe('DrizzleRepository', () => {
  it('still adds the id-keyed methods on top', () => {
    // The other half of the split: trimming too much would silently strip these
    // from all 48 id-keyed repositories.
    for (const method of ID_KEYED_METHODS) {
      expect(typeof DrizzleRepository.prototype[method]).toBe('function');
    }
  });

  it('inherits the tenant-scoped half', () => {
    expect(DrizzleRepository.prototype).toBeInstanceOf(DrizzleTenantScopedRepository);
  });
});

describe('DrizzleChargingStationNetworkProfileRepository', () => {
  const repository = new DrizzleChargingStationNetworkProfileRepository(deps);

  it('is tenant-scoped rather than id-keyed', () => {
    expect(repository).toBeInstanceOf(DrizzleTenantScopedRepository);
    expect(repository).not.toBeInstanceOf(DrizzleRepository);
  });
});
