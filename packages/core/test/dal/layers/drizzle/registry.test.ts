// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { registeredTables, tableMap } from '@dal/layers/drizzle/validation/registry.js';
import * as schemaModules from '@dal/layers/drizzle/schema/index.js';
import {
  authorizationTable,
  tenantAuthorizationTable,
} from '@dal/layers/drizzle/schema/Authorization.js';
import { integer, pgSchema, pgTable, serial } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

const publicTable = pgTable('RegistryProbe', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenantId').notNull(),
});

describe('registeredTables', () => {
  it('walks the real namespaced schema barrel', () => {
    // The barrel is a namespace of namespaces; the registry has to descend into it.
    const names = registeredTables().map((t) => t.name);
    expect(names).toContain('Authorizations');
    expect(names).toContain('VariableAttributes');
    // Stable, human-readable ordering so drift reports read the same way every run.
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('does not throw on ESM module namespace objects', () => {
    // Module namespace objects have a null prototype, which makes drizzle's `is()`
    // throw a TypeError if called on them unguarded. Passing the real barrel here
    // is the regression test for that.
    expect(() => registeredTables(schemaModules)).not.toThrow();
  });

  it('collects tables from a flat container as well as a nested one', () => {
    expect(registeredTables({ publicTable }).map((t) => t.name)).toEqual(['RegistryProbe']);
    expect(registeredTables({ nested: { publicTable } }).map((t) => t.name)).toEqual([
      'RegistryProbe',
    ]);
  });

  it('ignores non-table exports', () => {
    const result = registeredTables({
      mod: {
        publicTable,
        factory: tenantAuthorizationTable,
        zodSchema: { parse: () => undefined },
        constant: 42,
        nothing: null,
        alsoNothing: undefined,
      },
    });

    expect(result.map((t) => t.name)).toEqual(['RegistryProbe']);
  });

  it('excludes schema-per-tenant tables', () => {
    // tenantXTable() builds tables in a `tenant_N` schema. Those are never
    // validated: the public-schema declaration is the source of truth.
    const tenantScoped = pgSchema('tenant_7').table('RegistryProbe', {
      id: serial('id').primaryKey(),
      tenantId: integer('tenantId').notNull(),
    });

    expect(registeredTables({ mod: { tenantScoped } })).toEqual([]);
  });

  it('deduplicates a table exported more than once', () => {
    expect(registeredTables({ a: { publicTable }, b: { publicTable } })).toHaveLength(1);
  });
});

describe('tableMap', () => {
  it('flattens to a name-keyed map for drizzle-kit interop', () => {
    // drizzle-kit's programmatic API only inspects the top level of the object it
    // is given, so it must be handed this rather than the nested barrel.
    const map = tableMap();
    expect(Object.keys(map)).toHaveLength(52);
    expect(map['Authorizations']).toBe(authorizationTable);
  });
});
