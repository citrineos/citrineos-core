// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { registeredTables, type RegisteredTable } from '@citrineos/dal';
import type { SystemConfig } from '@citrineos/types';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { getTableConfig } from 'drizzle-orm/pg-core';
import type { ILogObj, Logger } from 'tslog';
import {
  array,
  buildReport,
  character,
  compareNullability,
  compareTypes,
  DEFAULT_SCHEMA,
  decimal,
  runSchemaValidationGate,
  simple,
  type CanonicalType,
  type SchemaFinding,
  type SchemaValidationOptions,
  type SchemaValidationReport,
} from './schema-validation.js';

/**
 * Startup gate that verifies the live database schema still has the shape the
 * drizzle table declarations describe. The Drizzle counterpart of
 * `assertSequelizeSchemaMatches`, sharing its finding vocabulary, severity rules
 * and startup policy.
 *
 * The code side comes from `getTableConfig()`, the database side from
 * `pg_catalog`. Unlike the Sequelize validator this also covers indexes, because
 * `getTableConfig()` exposes them where `Model.getAttributes()` does not.
 *
 * This is a one-way containment check: everything the declarations name must
 * exist in the database with a compatible type. It deliberately does not compute
 * a migration, so tables the database has but drizzle has not adopted yet are
 * ignored entirely — during the migration to Drizzle most of them are.
 *
 * Deliberately NOT covered:
 *   - foreign keys: no schema file declares any.
 *   - index definitions: existence by name only, see `introspectIndexNames`.
 *   - column defaults, unless `checkDefaults` is set.
 */

export interface DrizzleSchemaValidationOptions extends SchemaValidationOptions {
  /** Tables to validate. Defaults to every table in the schema barrel. */
  tables?: RegisteredTable[];
  /**
   * Also compare column defaults. Off by default: most defaults in this schema
   * are application-side (`$defaultFn`) with no database counterpart, so the
   * check is opt-in. Compares presence only — see {@link compareDefault}.
   */
  checkDefaults?: boolean;
}

/** Drizzle pseudo-types whose default is supplied by the underlying sequence. */
const SERIAL_BASES: Record<string, CanonicalType> = {
  serial: { family: 'integer', base: 'integer', raw: 'INTEGER' },
  bigserial: { family: 'integer', base: 'bigint', raw: 'BIGINT' },
  smallserial: { family: 'integer', base: 'smallint', raw: 'SMALLINT' },
};

/**
 * Canonicalizes a SQL type *name*, as printed by either drizzle's `getSQLType()`
 * or PostgreSQL's `format_type()`.
 *
 * Both sides of this validator are type names rather than structured metadata, so
 * one parser serves both: drizzle says `varchar(255)`, PostgreSQL says
 * `character varying(255)`, and both land on the same canonical value.
 *
 * `format_type()` rather than `information_schema.columns` — which the Sequelize
 * validator reads — because it keeps information that view drops: array element
 * typmods (`character varying(255)[]`) and PostGIS type qualifiers
 * (`geometry(Point)`), the latter mattering for `ChargingStations.coordinates`
 * and `Locations.coordinates`.
 */
export function canonicalizeSqlTypeName(raw: string): CanonicalType {
  let name = raw.trim().toLowerCase();

  // Peel off array suffixes, repeatedly for multi-dimensional arrays.
  if (name.endsWith('[]')) {
    return array(canonicalizeSqlTypeName(name.slice(0, -2)));
  }

  // Split a trailing modifier off the base name. Only a numeric modifier is
  // treated as capacity; anything else (`geometry(Point)`) stays part of the base
  // so that qualifier differences still register as a mismatch.
  let precision: number | null = null;
  let scale: number | null = null;
  const numericModifier = /^(.*?)\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?\)$/.exec(name);
  if (numericModifier) {
    name = numericModifier[1].trim();
    precision = Number(numericModifier[2]);
    scale = numericModifier[3] === undefined ? null : Number(numericModifier[3]);
  }

  const serial = SERIAL_BASES[name];
  // A serial's underlying integer type carries no modifier of its own.
  if (serial) return serial;

  switch (name) {
    case 'varchar':
    case 'character varying':
      return character('varchar', precision);
    case 'char':
    case 'bpchar':
    case 'character':
      return character('char', precision);
    case 'text':
      return character('text', null);
    case 'citext':
      return character('citext', null);

    case 'int2':
    case 'smallint':
      return { family: 'integer', base: 'smallint', raw: 'SMALLINT' };
    case 'int':
    case 'int4':
    case 'integer':
      return { family: 'integer', base: 'integer', raw: 'INTEGER' };
    case 'int8':
    case 'bigint':
      return { family: 'integer', base: 'bigint', raw: 'BIGINT' };

    case 'float4':
    case 'real':
      return { family: 'float', base: 'real', raw: 'REAL' };
    case 'float8':
    case 'double precision':
      return { family: 'float', base: 'double', raw: 'DOUBLE PRECISION' };

    case 'numeric':
    case 'decimal':
      return decimal(precision, scale);

    case 'bool':
    case 'boolean':
      return simple('boolean', 'BOOLEAN');
    case 'timestamptz':
    case 'timestamp with time zone':
      return simple('timestamptz', 'TIMESTAMP WITH TIME ZONE');
    case 'timestamp':
    case 'timestamp without time zone':
      return simple('timestamp', 'TIMESTAMP WITHOUT TIME ZONE');
    case 'date':
      return simple('date', 'DATE');
    case 'time':
    case 'timetz':
    case 'time with time zone':
    case 'time without time zone':
      return simple('time', 'TIME');
    case 'json':
      return simple('json', 'JSON');
    case 'jsonb':
      return simple('jsonb', 'JSONB');
    case 'uuid':
      return simple('uuid', 'UUID');
    case 'bytea':
      return simple('bytea', 'BYTEA');

    default: {
      // Unrecognized types (PostGIS geometry, leftover Postgres enums) compare on
      // their full name, qualifier included, so nothing is silently treated as
      // equal just because this parser has not been taught about it.
      const full = numericModifier
        ? `${name}(${scale === null ? precision : `${precision},${scale}`})`
        : name;
      return simple(full, full.toUpperCase());
    }
  }
}

/** A column as it actually exists in PostgreSQL. */
interface DbColumnInfo extends Record<string, unknown> {
  table: string;
  name: string;
  /** `format_type()` output, e.g. `character varying(255)`. */
  sqlType: string;
  notNull: boolean;
  /** True for a column default or an identity column. */
  hasDefault: boolean;
  defaultExpression: string | null;
}

interface DbIndexInfo extends Record<string, unknown> {
  table: string;
  name: string;
}

/**
 * Reads column metadata for the given tables from `pg_catalog`.
 *
 * Scoped by table name, so tables drizzle has not adopted are never read and
 * cannot produce findings.
 *
 * Note the `sql.param(...)::text[]` cast: drizzle's `sql` template spreads a
 * plain JavaScript array into one bind parameter per element, which produces a
 * malformed array literal for `= ANY(...)`. `sql.param` binds it as one value.
 */
async function introspectColumns(
  db: NodePgDatabase,
  tables: string[],
  schema: string,
): Promise<DbColumnInfo[]> {
  if (tables.length === 0) return [];

  const result = await db.execute<DbColumnInfo>(sql`
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
 * Names only, and deliberately: every index under `schema/` is declared with an
 * explicit name, which makes existence-by-name reliable and avoids normalizing
 * the `WHERE` predicates of the ten partial unique indexes — PostgreSQL rewrites
 * those into its own canonical form, so comparing them textually is unreliable.
 *
 * The trade-off is a known blind spot: an index present under the right name but
 * built on the wrong columns passes.
 */
async function introspectIndexNames(
  db: NodePgDatabase,
  tables: string[],
  schema: string,
): Promise<DbIndexInfo[]> {
  if (tables.length === 0) return [];

  const result = await db.execute<DbIndexInfo>(sql`
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

/**
 * Introspects the live schema and compares it against the registered drizzle
 * tables. Never throws on drift — returns findings.
 */
export async function validateDrizzleSchema(
  db: NodePgDatabase,
  options: DrizzleSchemaValidationOptions = {},
): Promise<SchemaValidationReport> {
  const schema = options.schema ?? DEFAULT_SCHEMA;
  const checkDefaults = options.checkDefaults ?? false;
  const tables = options.tables ?? registeredTables();
  const tableNames = tables.map((t: RegisteredTable) => t.name);
  const findings: SchemaFinding[] = [];

  const [dbColumns, dbIndexes] = await Promise.all([
    introspectColumns(db, tableNames, schema),
    introspectIndexNames(db, tableNames, schema),
  ]);

  const dbTables = new Map<string, Map<string, DbColumnInfo>>();
  for (const row of dbColumns) {
    let columns = dbTables.get(row.table);
    if (!columns) {
      columns = new Map<string, DbColumnInfo>();
      dbTables.set(row.table, columns);
    }
    columns.set(row.name, row);
  }

  const dbIndexNames = new Map<string, Set<string>>();
  for (const row of dbIndexes) {
    const names = dbIndexNames.get(row.table);
    if (names) names.add(row.name);
    else dbIndexNames.set(row.table, new Set([row.name]));
  }

  let tablesChecked = 0;
  let columnsChecked = 0;

  for (const { table, name } of tables) {
    const config = getTableConfig(table);
    const dbColumnsForTable = dbTables.get(name);

    // No rows in pg_attribute means the table does not exist. Reported once,
    // rather than as one missing-column finding per declared column.
    if (!dbColumnsForTable) {
      findings.push({
        kind: 'missing-table',
        severity: 'error',
        table: name,
        message: `Table "${name}" is declared by the drizzle schema but does not exist in schema "${schema}"`,
      });
      continue;
    }

    tablesChecked++;
    const matchedColumns = new Set<string>();

    for (const column of config.columns) {
      const expected = canonicalizeSqlTypeName(column.getSQLType());
      const dbColumn = dbColumnsForTable.get(column.name);

      if (!dbColumn) {
        findings.push({
          kind: 'missing-column',
          severity: 'error',
          table: name,
          column: column.name,
          expected: expected.raw,
          message: `Column "${name}"."${column.name}" is declared by the drizzle schema but does not exist; drizzle names every column explicitly in generated SQL, so all reads and writes on this table will fail`,
        });
        continue;
      }

      matchedColumns.add(column.name);
      columnsChecked++;

      const actual = canonicalizeSqlTypeName(dbColumn.sqlType);
      const comparison = compareTypes(expected, actual);

      switch (comparison.result) {
        case 'mismatch':
          findings.push({
            kind: 'type-mismatch',
            severity: 'error',
            table: name,
            column: column.name,
            expected: expected.raw,
            actual: actual.raw,
            message: `Column "${name}"."${column.name}" has type ${actual.raw} but the drizzle schema declares ${expected.raw}`,
          });
          break;
        case 'narrower':
          // The database cannot hold everything the declaration believes it can,
          // so some insert path will fail at runtime.
          findings.push({
            kind: 'length-narrower',
            severity: 'error',
            table: name,
            column: column.name,
            expected: expected.raw,
            actual: actual.raw,
            message: `Column "${name}"."${column.name}" is ${actual.raw}, narrower than the declared ${expected.raw}; values the schema permits will be rejected`,
          });
          break;
        case 'wider':
          findings.push({
            kind: 'length-wider',
            severity: 'warning',
            table: name,
            column: column.name,
            expected: expected.raw,
            actual: actual.raw,
            message: `Column "${name}"."${column.name}" is ${actual.raw}, wider than the declared ${expected.raw}`,
          });
          break;
      }

      const nullability = compareNullability(!column.notNull, column.primary, !dbColumn.notNull);
      if (nullability === 'code-stricter') {
        findings.push({
          kind: 'nullability-code-stricter',
          severity: 'error',
          table: name,
          column: column.name,
          expected: 'NOT NULL',
          actual: 'NULL',
          message: `Column "${name}"."${column.name}" is nullable but the drizzle schema declares it NOT NULL; the entity type promises a value the database does not guarantee`,
        });
      } else if (nullability === 'db-stricter') {
        findings.push({
          kind: 'nullability-db-stricter',
          severity: 'warning',
          table: name,
          column: column.name,
          expected: 'NULL',
          actual: 'NOT NULL',
          message: `Column "${name}"."${column.name}" is NOT NULL but the drizzle schema does not declare it NOT NULL; inserts and updates writing null will fail`,
        });
      }

      if (checkDefaults) {
        const finding = compareDefault(name, column, dbColumn);
        if (finding) findings.push(finding);
      }
    }

    // Columns the database has but the declaration does not name are usually
    // harmless: drizzle emits explicit column lists, so they are invisible to
    // both reads and writes. A NOT NULL column with no default is the exception —
    // drizzle omits it from INSERT, so every insert into the table fails.
    for (const [columnName, dbColumn] of dbColumnsForTable) {
      if (matchedColumns.has(columnName)) continue;

      const breaksInserts = dbColumn.notNull && !dbColumn.hasDefault;
      const actual = canonicalizeSqlTypeName(dbColumn.sqlType);
      findings.push({
        kind: 'extra-column',
        severity: breaksInserts ? 'error' : 'warning',
        table: name,
        column: columnName,
        actual: actual.raw,
        message: breaksInserts
          ? `Column "${name}"."${columnName}" is ${actual.raw} NOT NULL with no default but is not declared by the drizzle schema; drizzle omits undeclared columns, so every INSERT into "${name}" will fail`
          : `Column "${name}"."${columnName}" exists in the database but is not declared by the drizzle schema`,
      });
    }

    // Declared indexes must exist by name. Unique indexes are a correctness
    // matter; the rest only cost performance.
    const existingIndexNames = dbIndexNames.get(name) ?? new Set<string>();
    for (const index of config.indexes) {
      const indexName = index.config.name;
      if (!indexName || existingIndexNames.has(indexName)) continue;

      const columnList = index.config.columns
        .map((c) => (c as { name?: string }).name ?? '<expression>')
        .join(', ');
      const unique = index.config.unique;
      const description = `${unique ? 'unique ' : ''}index on (${columnList})${
        index.config.where ? ', partial' : ''
      }`;

      findings.push({
        kind: 'missing-index',
        severity: unique ? 'error' : 'warning',
        table: name,
        index: indexName,
        expected: description,
        message: unique
          ? `Index "${indexName}" on "${name}" (${description}) is declared by the drizzle schema but does not exist; uniqueness is NOT enforced, so duplicate rows can be written`
          : `Index "${indexName}" on "${name}" (${description}) is declared by the drizzle schema but does not exist; queries relying on it will fall back to sequential scans`,
      });
    }
  }

  return buildReport(findings, tablesChecked, columnsChecked);
}

/**
 * Compares default *presence* only, and only where a comparison is meaningful.
 *
 * Value comparison is intentionally not attempted: PostgreSQL rewrites default
 * expressions into its own canonical form and adds casts, so comparing them
 * textually against a drizzle `SQL` object is unreliable. Presence is the part
 * that is both well defined and worth knowing.
 *
 * Skipped cases, each of which would otherwise be a guaranteed false positive:
 *   - serial columns: the default comes from the sequence, and drizzle does not
 *     model it as a column default.
 *   - `$defaultFn` columns: the value is generated in the application, so the
 *     database legitimately has none — and one would be harmless, since drizzle
 *     always sends an explicit value.
 */
function compareDefault(
  table: string,
  column: { name: string; default: unknown; defaultFn: unknown; getSQLType: () => string },
  dbColumn: DbColumnInfo,
): SchemaFinding | undefined {
  if (SERIAL_BASES[column.getSQLType().trim().toLowerCase()]) return undefined;
  if (column.defaultFn !== undefined) return undefined;

  const declaresDefault = column.default !== undefined;
  if (declaresDefault === dbColumn.hasDefault) return undefined;

  return declaresDefault
    ? {
        kind: 'default-mismatch',
        severity: 'warning',
        table,
        column: column.name,
        expected: 'a column default',
        actual: 'no column default',
        message: `Column "${table}"."${column.name}" has no database default but the drizzle schema declares one; rows inserted outside drizzle get no default value`,
      }
    : {
        kind: 'default-mismatch',
        severity: 'warning',
        table,
        column: column.name,
        expected: 'no column default',
        actual: `default ${dbColumn.defaultExpression ?? '(unknown)'}`,
        message: `Column "${table}"."${column.name}" has a database default (${dbColumn.defaultExpression ?? 'unknown'}) that the drizzle schema does not describe`,
      };
}

/**
 * Startup gate for the drizzle schema declarations. Introspects the schema, logs
 * one consolidated block, and throws when errors are present.
 *
 * Reads the same `database.validateSchema` / `validateSchemaSeverity` settings as
 * the Sequelize gate and honours the same sync/alter/force skip, so one switch
 * governs schema validation whichever data layer is active.
 */
export async function assertDrizzleSchemaMatches(
  db: NodePgDatabase,
  config: SystemConfig,
  logger: Logger<ILogObj>,
  options: Pick<DrizzleSchemaValidationOptions, 'checkDefaults' | 'tables'> = {},
): Promise<SchemaValidationReport | null> {
  return runSchemaValidationGate({
    config,
    logger,
    loggerName: 'DrizzleSchemaValidator',
    summaryPrefix: 'drizzle schema validation',
    declaredBy: 'the drizzle schema declarations',
    validate: (schema) => validateDrizzleSchema(db, { ...options, schema }),
  });
}
