// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { introspectColumns, introspectIndexNames, type DbColumn } from './introspect.js';
import { normalizeSqlType } from './normalizeType.js';
import { registeredTables, type RegisteredTable } from './registry.js';

export type SchemaFindingKind =
  | 'missingTable'
  | 'missingColumn'
  | 'columnType'
  | 'columnNullability'
  | 'columnDefault'
  | 'requiredColumnNotDeclared'
  | 'missingIndex';

export interface SchemaFinding {
  table: string;
  kind: SchemaFindingKind;
  column?: string;
  index?: string;
  /** What the drizzle TypeScript schema declares. */
  declared: string;
  /** What PostgreSQL actually has. */
  actual: string;
  /** What breaks at runtime because of this. Written to be actionable from a log. */
  impact: string;
}

export interface ValidateSchemaOptions {
  /** PostgreSQL schema to validate against. Defaults to `public`. */
  schema?: string;
  /** Tables to validate. Defaults to every table in the schema barrel. */
  tables?: RegisteredTable[];
  /**
   * Also compare column defaults. Off by default: most defaults in this codebase are
   * application-side (`$defaultFn`) with no database counterpart, so the check is
   * opt-in. When enabled it compares presence only — see {@link compareDefault}.
   */
  checkDefaults?: boolean;
}

export class SchemaDriftError extends Error {
  constructor(
    readonly findings: SchemaFinding[],
    report: string,
  ) {
    super(report);
    this.name = 'SchemaDriftError';
  }
}

/** Drizzle pseudo-types whose default is supplied by the underlying sequence. */
const SERIAL_TYPES = new Set(['serial', 'bigserial', 'smallserial']);

/**
 * Compares the drizzle TypeScript schema against the live PostgreSQL schema and
 * returns every difference found.
 *
 * This is a one-way containment check: everything the TypeScript schema declares must
 * exist in the database with a matching type. It deliberately does not compute a
 * migration, so tables, columns and indexes that exist only in the database are
 * tolerated — with the single exception of `requiredColumnNotDeclared` below.
 *
 * Checked:
 *  - every declared table exists
 *  - every declared column exists, with a matching SQL type and nullability
 *  - every declared (named) index exists
 *  - no undeclared database column would break inserts
 *
 * Deliberately not checked:
 *  - foreign keys — no schema file declares any
 *  - index definitions (columns, uniqueness, partial predicates) — existence only
 *  - column defaults, unless `checkDefaults` is set
 *  - anything about tables absent from the schema barrel
 */
export async function validateDrizzleSchema(
  db: NodePgDatabase,
  options: ValidateSchemaOptions = {},
): Promise<SchemaFinding[]> {
  const { schema = 'public', checkDefaults = false } = options;
  const tables = options.tables ?? registeredTables();
  const tableNames = tables.map((t) => t.name);

  const [dbColumns, dbIndexes] = await Promise.all([
    introspectColumns(db, tableNames, schema),
    introspectIndexNames(db, tableNames, schema),
  ]);

  const columnsByTable = new Map<string, DbColumn[]>();
  for (const column of dbColumns) {
    const list = columnsByTable.get(column.table);
    if (list) list.push(column);
    else columnsByTable.set(column.table, [column]);
  }

  const indexesByTable = new Map<string, Set<string>>();
  for (const index of dbIndexes) {
    const set = indexesByTable.get(index.table);
    if (set) set.add(index.name);
    else indexesByTable.set(index.table, new Set([index.name]));
  }

  const findings: SchemaFinding[] = [];

  for (const { table, name } of tables) {
    const config = getTableConfig(table);
    const actualColumns = columnsByTable.get(name);

    // A table with no rows in pg_attribute does not exist. Report that once rather
    // than emitting one finding per declared column.
    if (!actualColumns) {
      findings.push({
        table: name,
        kind: 'missingTable',
        declared: `table with ${config.columns.length} column(s)`,
        actual: 'table does not exist',
        impact: 'every query against this table fails',
      });
      continue;
    }

    const actualByName = new Map(actualColumns.map((c) => [c.name, c]));

    // ── Declared in TypeScript: must exist, with a matching type ──────────────
    for (const column of config.columns) {
      const actual = actualByName.get(column.name);
      const declaredType = column.getSQLType();

      if (!actual) {
        findings.push({
          table: name,
          kind: 'missingColumn',
          column: column.name,
          declared: declaredType,
          actual: 'column does not exist',
          impact:
            'drizzle names every column explicitly in generated SQL, so all reads ' +
            'and writes on this table fail',
        });
        continue;
      }

      const declaredNormalized = normalizeSqlType(declaredType);
      const actualNormalized = normalizeSqlType(actual.sqlType);
      if (declaredNormalized !== actualNormalized) {
        findings.push({
          table: name,
          kind: 'columnType',
          column: column.name,
          declared: describeType(declaredType, declaredNormalized),
          actual: describeType(actual.sqlType, actualNormalized),
          impact: 'values may be silently coerced or truncated, or rejected by the driver',
        });
      }

      if (column.notNull !== actual.notNull) {
        findings.push({
          table: name,
          kind: 'columnNullability',
          column: column.name,
          declared: column.notNull ? 'NOT NULL' : 'nullable',
          actual: actual.notNull ? 'NOT NULL' : 'nullable',
          impact: column.notNull
            ? 'the entity type promises a non-null value the database does not guarantee'
            : 'the entity type permits null, so inserts and updates writing null will fail',
        });
      }

      if (checkDefaults) {
        const finding = compareDefault(name, column, actual, declaredType);
        if (finding) findings.push(finding);
      }
    }

    // ── Present in the database but not declared ──────────────────────────────
    // Harmless in general: drizzle emits explicit column lists, so an undeclared
    // column is invisible to reads and writes alike. The exception is a NOT NULL
    // column with no default — drizzle omits it from INSERT, so every insert fails.
    const declaredNames = new Set(config.columns.map((c) => c.name));
    for (const actual of actualColumns) {
      if (declaredNames.has(actual.name)) continue;
      if (!actual.notNull || actual.hasDefault) continue;

      findings.push({
        table: name,
        kind: 'requiredColumnNotDeclared',
        column: actual.name,
        declared: 'not declared in the drizzle schema',
        actual: `${actual.sqlType} NOT NULL, no default`,
        impact: `every INSERT into "${name}" fails — drizzle omits undeclared columns`,
      });
    }

    // ── Declared indexes must exist, by name ──────────────────────────────────
    const actualIndexNames = indexesByTable.get(name) ?? new Set<string>();
    for (const index of config.indexes) {
      const indexName = index.config.name;
      if (!indexName || actualIndexNames.has(indexName)) continue;

      const columnList = index.config.columns
        .map((c) => (c as { name?: string }).name ?? '<expression>')
        .join(', ');
      const partial = index.config.where ? ' (partial)' : '';

      findings.push({
        table: name,
        kind: 'missingIndex',
        index: indexName,
        declared: `${index.config.unique ? 'UNIQUE ' : ''}index on (${columnList})${partial}`,
        actual: 'index does not exist',
        impact: index.config.unique
          ? 'uniqueness is NOT enforced — duplicate rows can be written'
          : 'queries relying on this index fall back to sequential scans',
      });
    }
  }

  return findings;
}

/** `varchar(255)` reads clearly alone; `serial` vs `integer` needs the normalized form. */
function describeType(raw: string, normalized: string): string {
  return raw.toLowerCase() === normalized ? raw : `${raw} (i.e. ${normalized})`;
}

/**
 * Compares default presence only, and only where a comparison is meaningful.
 *
 * Value comparison is intentionally not attempted: PostgreSQL rewrites default
 * expressions into its own canonical form and adds casts, so comparing them textually
 * against a drizzle `SQL` object is unreliable. Presence is the part that is both well
 * defined and worth knowing.
 *
 * Skipped cases, each of which would otherwise be a guaranteed false positive:
 *  - serial columns: the default comes from the sequence, and drizzle does not model
 *    it as a column default
 *  - `$defaultFn` columns: the value is generated in the application, so the database
 *    legitimately has no default (and one would be harmless, since drizzle always
 *    sends an explicit value)
 */
function compareDefault(
  table: string,
  column: { name: string; default: unknown; defaultFn: unknown },
  actual: DbColumn,
  declaredType: string,
): SchemaFinding | undefined {
  if (SERIAL_TYPES.has(declaredType.toLowerCase())) return undefined;
  if (column.defaultFn !== undefined) return undefined;

  const declaresDefault = column.default !== undefined;
  if (declaresDefault === actual.hasDefault) return undefined;

  return declaresDefault
    ? {
        table,
        kind: 'columnDefault',
        column: column.name,
        declared: 'a column default',
        actual: 'no column default',
        impact: 'rows inserted outside drizzle (raw SQL, migrations) get no default value',
      }
    : {
        table,
        kind: 'columnDefault',
        column: column.name,
        declared: 'no column default',
        actual: `default ${actual.defaultExpression ?? '(unknown)'}`,
        impact: 'the database supplies a value the schema does not describe',
      };
}
