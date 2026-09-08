// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Drizzle pseudo-types with no distinct PostgreSQL type of their own. A `serial` is
 * an `integer` plus a `nextval(...)` default, so `format_type()` reports the
 * underlying integer type.
 */
const SERIAL_BASE: Record<string, string> = {
  serial: 'integer',
  bigserial: 'bigint',
  smallserial: 'smallint',
};

/**
 * Types drizzle and PostgreSQL spell differently. `format_type()` always reports the
 * SQL standard spelling; drizzle's `getSQLType()` reports the short form.
 */
const SPELLING: Record<string, string> = {
  varchar: 'character varying',
  char: 'character',
  bpchar: 'character',
  timestamptz: 'timestamp with time zone',
  timetz: 'time with time zone',
  bool: 'boolean',
  int: 'integer',
  int4: 'integer',
  int8: 'bigint',
  int2: 'smallint',
  float8: 'double precision',
  float4: 'real',
  decimal: 'numeric',
};

/**
 * Reduces a SQL type name to a canonical form comparable across drizzle's
 * `getSQLType()` and PostgreSQL's `format_type()`.
 *
 * Both the `(n)` / `(p,s)` modifier and the `[]` array suffix are load-bearing and
 * are preserved: `varchar(255)` must not compare equal to `varchar(500)`, and
 * `varchar(255)` must not compare equal to `varchar(255)[]`.
 *
 * The maps above are complete for every column type currently used under `schema/`.
 * `typeInventory.test.ts` fails if a schema file introduces a type outside the
 * verified set, so this cannot silently fall out of date.
 */
export function normalizeSqlType(raw: string): string {
  let type = raw.trim().toLowerCase();

  // Peel off array suffixes (repeated, for multi-dimensional arrays).
  let arraySuffix = '';
  while (type.endsWith('[]')) {
    arraySuffix += '[]';
    type = type.slice(0, -2).trimEnd();
  }

  // Split "character varying(255)" into base "character varying" + modifier "(255)".
  // Only a numeric modifier is treated as one, so type names containing parentheses
  // are left intact.
  const match = /^(.*?)\s*(\(\s*\d+\s*(?:,\s*\d+\s*)?\))?$/.exec(type);
  const base = (match?.[1] ?? type).trim();
  const modifier = (match?.[2] ?? '').replace(/\s+/g, '');

  const serialBase = SERIAL_BASE[base];
  const canonical = serialBase ?? SPELLING[base] ?? base;

  // A serial's underlying integer type carries no modifier.
  return `${canonical}${serialBase ? '' : modifier}${arraySuffix}`;
}

/** True when two SQL type names describe the same PostgreSQL type. */
export function sqlTypesMatch(declared: string, actual: string): boolean {
  return normalizeSqlType(declared) === normalizeSqlType(actual);
}
