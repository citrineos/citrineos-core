// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { is } from 'drizzle-orm';
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';
import * as drizzleSchema from '../../../src/db/drizzle/schema/index.js';
import { registeredTables } from '../../../src/db/drizzle/schema-registry.js';

/**
 * Drizzle has no runtime registry — nothing collects `pgTable` declarations the way
 * `sequelize.models` collects models — so `schema/index.ts` is the only thing that
 * knows the full set of tables, and the startup validator checks exactly what that
 * file exports. A schema file missing from the barrel is therefore never validated,
 * and the failure is invisible: the drift report still says "in sync".
 *
 * These tests make the directory the source of truth and the barrel the assertion,
 * so forgetting an entry fails CI instead of silently shrinking the validated
 * surface. The barrel itself stays a static import list, which is what bundlers,
 * `drizzle(pool, { schema })` and drizzle-kit all need.
 */

const SCHEMA_DIR = fileURLToPath(new URL('../../../src/db/drizzle/schema/', import.meta.url));

/** Table-declaring files: the directory minus the barrel and the shared column types. */
function schemaFilesOnDisk(): string[] {
  return readdirSync(SCHEMA_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
    .filter((f) => f !== 'index.ts' && f !== 'column-types.ts')
    .map((f) => f.replace(/\.ts$/, ''))
    .sort();
}

/** The modules the barrel re-exports, read as text so nothing has to be imported. */
function filesReExportedByBarrel(): string[] {
  const source = readFileSync(`${SCHEMA_DIR}index.ts`, 'utf8');
  return [...source.matchAll(/^export \* from '\.\/([\w-]+)\.js';$/gm)]
    .map((m) => m[1])
    .filter((f) => f !== 'column-types')
    .sort();
}

describe('the drizzle schema barrel', () => {
  it('re-exports every schema file in the directory', () => {
    const missing = schemaFilesOnDisk().filter((f) => !filesReExportedByBarrel().includes(f));

    expect(
      missing,
      'These schema files are not re-exported from schema/index.ts, so the startup ' +
        'validator never checks their tables. Add an `export * from' +
        " './<file>.js';` line for each.",
    ).toEqual([]);
  });

  it('has no entries for files that no longer exist', () => {
    const onDisk = schemaFilesOnDisk();
    const stale = filesReExportedByBarrel().filter((f) => !onDisk.includes(f));
    expect(stale, 'schema/index.ts re-exports modules that are not in the directory').toEqual([]);
  });

  it('yields one registered table per schema file at runtime', () => {
    // The text check above proves the lines are present; this proves they actually
    // resolve to tables — catching a schema file that exports no pgTable, or one
    // whose table is schema-qualified and therefore skipped by the registry.
    expect(registeredTables().length).toBe(schemaFilesOnDisk().length);
  });

  it('is flat, so drizzle-kit and drizzle(pool, { schema }) can read it', () => {
    const topLevelTables = Object.values(drizzleSchema).filter(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        Object.getPrototypeOf(value) !== null &&
        is(value, PgTable),
    );

    expect(
      topLevelTables.length,
      'schema/index.ts must use `export * from`, not `export * as x from`',
    ).toBe(registeredTables().length);
  });

  it('exports only public-schema tables', () => {
    // tenantXTable() builds tables in a `tenant_N` schema and is a function, so it
    // should never reach the validator as a table value.
    for (const { table, name } of registeredTables()) {
      expect(getTableConfig(table).schema, `${name} should be public-schema`).toBeUndefined();
    }
  });
});
