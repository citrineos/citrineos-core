// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { registeredTables } from '@dal/layers/drizzle/validation/registry.js';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

/**
 * Every column type in use across `schema/`, as reported by drizzle's
 * `getSQLType()`. Each entry has been checked against a real PostgreSQL 16
 * instance (with the citext and postgis extensions) to confirm that
 * `normalizeSqlType` maps it onto the matching `format_type()` output.
 *
 * If this test fails, a schema file has introduced a new column type. Before
 * adding it here: create a column of that type in PostgreSQL, read back
 * `format_type(atttypid, atttypmod)`, and confirm `normalizeSqlType` maps the two
 * spellings together — extending `normalizeType.ts` if it does not. Adding a type
 * here without that check silently blinds the validator to drift on that column.
 */
const VERIFIED_COLUMN_TYPES = new Set([
  'bigint',
  'boolean',
  'citext',
  'geometry(point)',
  'integer',
  'jsonb',
  'numeric',
  'serial',
  'text',
  'timestamp with time zone',
  'varchar(3)',
  'varchar(20)',
  'varchar(25)',
  'varchar(36)',
  'varchar(50)',
  'varchar(255)',
  'varchar(255)[]',
  'varchar(500)',
  'varchar(4000)',
]);

describe('drizzle schema inventory', () => {
  const tables = registeredTables();

  it('registers every schema file in the barrel', () => {
    // Guards against a new schema file being added without a barrel entry, which
    // would leave its table silently unvalidated.
    expect(tables.length).toBe(52);
  });

  it('uses only column types the normalization map has been verified against', () => {
    const unknown = new Map<string, string[]>();

    for (const { table, name } of tables) {
      for (const column of getTableConfig(table).columns) {
        const type = column.getSQLType();
        if (VERIFIED_COLUMN_TYPES.has(type)) continue;
        const users = unknown.get(type) ?? [];
        users.push(`${name}.${column.name}`);
        unknown.set(type, users);
      }
    }

    expect(Object.fromEntries(unknown)).toEqual({});
  });

  it('gives every index an explicit name', () => {
    // Index checking is name-based, so an auto-named index would be unverifiable.
    const unnamed: string[] = [];

    for (const { table, name } of tables) {
      for (const index of getTableConfig(table).indexes) {
        if (!index.config.name) unnamed.push(name);
      }
    }

    expect(unnamed).toEqual([]);
  });

  it('declares no foreign keys, matching what the validator checks', () => {
    // The validator deliberately ignores foreign keys. If schema files start
    // declaring them, that decision needs revisiting.
    const withForeignKeys = tables
      .filter(({ table }) => getTableConfig(table).foreignKeys.length > 0)
      .map(({ name }) => name);

    expect(withForeignKeys).toEqual([]);
  });
});
