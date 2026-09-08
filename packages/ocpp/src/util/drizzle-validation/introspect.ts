// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * drizzle's `db.execute<T>()` constrains `T` to `Record<string, unknown>`, which a
 * plain interface does not satisfy (interfaces have no implicit index signature).
 * Intersecting at the call site keeps the exported row types precise.
 */
type Row<T> = T & Record<string, unknown>;

/** A column as it actually exists in PostgreSQL. */
export interface DbColumn {
  table: string;
  name: string;
  /** `format_type()` output, e.g. `character varying(255)`. */
  sqlType: string;
  notNull: boolean;
  /** True for a column default or an identity column. */
  hasDefault: boolean;
  /** The default expression, or null. Only read when default checking is enabled. */
  defaultExpression: string | null;
}

/** A single index name, scoped to its table. */
export interface DbIndex {
  table: string;
  name: string;
}

/**
 * Reads column metadata for the given tables from `pg_catalog`.
 *
 * `pg_catalog` rather than `information_schema` because `format_type()` returns the
 * type and its modifier as a single string (`character varying(255)`), directly
 * comparable to drizzle's `getSQLType()`. `information_schema.columns` splits the
 * same information across `data_type`, `character_maximum_length`,
 * `numeric_precision` and `numeric_scale`, which would have to be reassembled here.
 *
 * Scoped by table name, so tables not yet ported to drizzle are never read and
 * cannot produce findings.
 *
 * Note the `sql.param(...)::text[]` cast: drizzle's `sql` template spreads a plain
 * JavaScript array into one bind parameter per element, which produces a malformed
 * array literal for `= ANY(...)`. `sql.param` binds the array as a single value.
 */
export async function introspectColumns(
  db: NodePgDatabase,
  tables: string[],
  schema = 'public',
): Promise<DbColumn[]> {
  if (tables.length === 0) return [];

  const result = await db.execute<Row<DbColumn>>(sql`
    SELECT c.relname                            AS "table",
           a.attname                            AS "name",
           format_type(a.atttypid, a.atttypmod) AS "sqlType",
           a.attnotnull                         AS "notNull",
           (a.atthasdef OR a.attidentity <> '') AS "hasDefault",
           pg_get_expr(d.adbin, d.adrelid)      AS "defaultExpression"
      FROM pg_attribute a
      JOIN pg_class     c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
     WHERE n.nspname = ${schema}
       AND c.relkind IN ('r', 'p')
       AND c.relname = ANY(${sql.param(tables)}::text[])
       AND a.attnum > 0
       AND NOT a.attisdropped
     ORDER BY c.relname, a.attnum
  `);

  return result.rows;
}

/**
 * Reads index names for the given tables.
 *
 * Names only — index definitions are deliberately not compared. Every index under
 * `schema/` is declared with an explicit name (enforced by `typeInventory.test.ts`),
 * which makes name-based existence checking reliable and avoids normalising the
 * `WHERE` predicates of the partial unique indexes: PostgreSQL rewrites those into
 * its own canonical form, so comparing them textually is unreliable.
 */
export async function introspectIndexNames(
  db: NodePgDatabase,
  tables: string[],
  schema = 'public',
): Promise<DbIndex[]> {
  if (tables.length === 0) return [];

  const result = await db.execute<Row<DbIndex>>(sql`
    SELECT t.relname AS "table",
           i.relname AS "name"
      FROM pg_index      ix
      JOIN pg_class      i ON i.oid = ix.indexrelid
      JOIN pg_class      t ON t.oid = ix.indrelid
      JOIN pg_namespace  n ON n.oid = t.relnamespace
     WHERE n.nspname = ${schema}
       AND t.relname = ANY(${sql.param(tables)}::text[])
     ORDER BY t.relname, i.relname
  `);

  return result.rows;
}
