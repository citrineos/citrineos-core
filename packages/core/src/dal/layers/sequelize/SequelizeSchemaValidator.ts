// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig } from '@citrineos/base';
import { DataTypes, QueryTypes } from 'sequelize';
import type { Sequelize } from 'sequelize-typescript';
import type { ILogObj, Logger } from 'tslog';

/**
 * Startup gate that verifies the live database schema still has the shape the
 * Sequelize models declare.
 *
 * Sequelize has no built-in equivalent of Hibernate's `hbm2ddl.auto=validate`,
 * so this assembles the check from the two halves it does expose:
 * `Model.getAttributes()` for the code side and `information_schema.columns`
 * for the database side. Migrations remain the source of truth for the
 * database; this only reports where the two have diverged.
 *
 * Deliberately NOT covered: column defaults, indexes, foreign keys, unique
 * constraints. None of those are reachable from `getAttributes()`.
 */

export const DEFAULT_SCHEMA = 'public';

export type SchemaFindingSeverity = 'error' | 'warning';

export type SchemaFindingKind =
  | 'missing-table'
  | 'missing-column'
  | 'extra-column'
  | 'type-mismatch'
  | 'length-narrower'
  | 'length-wider'
  | 'nullability-code-stricter'
  | 'nullability-db-stricter';

export interface SchemaFinding {
  kind: SchemaFindingKind;
  severity: SchemaFindingSeverity;
  table: string;
  column?: string;
  expected?: string;
  actual?: string;
  message: string;
}

export interface SchemaValidationReport {
  findings: SchemaFinding[];
  errors: SchemaFinding[];
  warnings: SchemaFinding[];
  tablesChecked: number;
  columnsChecked: number;
}

export interface SchemaValidationOptions {
  /** Postgres schema to introspect. Defaults to `public`. */
  schema?: string;
}

/**
 * Held off-instance deliberately, because loggers serialize an Error's own
 * properties and a nested report survives that badly:
 *
 *   - `console.error(err)` / `util.inspect` walk enumerable own properties to a
 *     default depth of 2, printing `findings: [ [Object], [Object] ]`.
 *   - tslog walks `getOwnPropertyNames` regardless of enumerability, appending
 *     the entire report as one long JSON blob.
 *
 * Both duplicate detail the error message already lists line by line, and both
 * bury it. A WeakMap keeps `error.report` working for callers while staying
 * invisible to either. The per-finding logs emitted before the throw are the
 * structured, queryable representation.
 */
const reportsByError = new WeakMap<SchemaValidationError, SchemaValidationReport>();

export class SchemaValidationError extends Error {
  constructor(message: string, report: SchemaValidationReport) {
    super(message);
    this.name = 'SchemaValidationError';
    reportsByError.set(this, report);
  }

  get report(): SchemaValidationReport {
    return reportsByError.get(this)!;
  }
}

/**
 * A column type reduced to something comparable across the two sides.
 *
 * `family` groups types whose members differ only in capacity, so that
 * VARCHAR(50) vs VARCHAR(255) or SMALLINT vs BIGINT can be reported as a
 * capacity difference rather than an unhelpful type mismatch. Types outside a
 * family must match their `base` exactly.
 */
type TypeFamily = 'character' | 'integer' | 'float' | 'decimal' | 'other';

interface CanonicalType {
  family: TypeFamily;
  base: string;
  /** Character types. `null` means unbounded (`text`). */
  length?: number | null;
  /** Decimal types. `null` means unconstrained. */
  precision?: number | null;
  scale?: number | null;
  /** Set for array types; the element type. */
  element?: CanonicalType;
  /** Human-readable form used in findings. */
  raw: string;
}

/** Capacity ordering within the integer and float families. */
const NUMERIC_RANK: Record<string, number> = {
  smallint: 1,
  integer: 2,
  bigint: 3,
  real: 1,
  double: 2,
};

interface DbColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  is_nullable: 'YES' | 'NO';
}

/**
 * `udt_name` rather than `data_type`: it is unambiguous for arrays (`_varchar`)
 * and it names user-defined types (a leftover Postgres enum reports as
 * `USER-DEFINED` in `data_type`, which tells us nothing).
 */
function canonicalizeDbType(col: DbColumn): CanonicalType {
  const udt = col.udt_name.toLowerCase();

  if (udt.startsWith('_')) {
    const element = canonicalizeDbType({ ...col, udt_name: udt.slice(1) });
    return { family: 'other', base: 'array', element, raw: `${element.raw}[]` };
  }

  switch (udt) {
    case 'varchar':
      return character('varchar', col.character_maximum_length);
    case 'bpchar':
    case 'char':
      return character('char', col.character_maximum_length);
    case 'text':
      return character('text', null);
    case 'citext':
      return character('citext', null);

    case 'int2':
      return { family: 'integer', base: 'smallint', raw: 'SMALLINT' };
    case 'int4':
      return { family: 'integer', base: 'integer', raw: 'INTEGER' };
    case 'int8':
      return { family: 'integer', base: 'bigint', raw: 'BIGINT' };

    case 'float4':
      return { family: 'float', base: 'real', raw: 'REAL' };
    case 'float8':
      return { family: 'float', base: 'double', raw: 'DOUBLE PRECISION' };

    case 'numeric':
      return decimal(col.numeric_precision, col.numeric_scale);

    case 'bool':
      return simple('boolean', 'BOOLEAN');
    case 'timestamptz':
      return simple('timestamptz', 'TIMESTAMP WITH TIME ZONE');
    case 'timestamp':
      return simple('timestamp', 'TIMESTAMP WITHOUT TIME ZONE');
    case 'date':
      return simple('date', 'DATE');
    case 'time':
    case 'timetz':
      return simple('time', 'TIME');
    case 'json':
      return simple('json', 'JSON');
    case 'jsonb':
      return simple('jsonb', 'JSONB');
    case 'uuid':
      return simple('uuid', 'UUID');
    case 'bytea':
      return simple('bytea', 'BYTEA');
    default:
      // Includes Postgres enum types, which surface under their own type name.
      return simple(udt, col.data_type.toUpperCase() === 'USER-DEFINED' ? udt : udt.toUpperCase());
  }
}

/**
 * Canonicalizes from the DataType instance's `key` and `options` rather than
 * parsing `toSql()`, which varies by dialect and is not meant to be reparsed.
 */
function canonicalizeCodeType(type: unknown): CanonicalType {
  const instance = type as { key?: string; options?: Record<string, any>; type?: unknown };
  const key = (instance?.key ?? '').toUpperCase();
  const options = instance?.options ?? {};

  switch (key) {
    case 'STRING':
      // Sequelize's own default when no length is given.
      return character('varchar', typeof options.length === 'number' ? options.length : 255);
    case 'CHAR':
      return character('char', typeof options.length === 'number' ? options.length : 255);
    case 'TEXT':
      return character('text', null);
    case 'CITEXT':
      return character('citext', null);

    case 'SMALLINT':
    case 'TINYINT':
      // Postgres has no TINYINT; Sequelize emits SMALLINT for it.
      return { family: 'integer', base: 'smallint', raw: 'SMALLINT' };
    case 'INTEGER':
      return { family: 'integer', base: 'integer', raw: 'INTEGER' };
    case 'BIGINT':
      return { family: 'integer', base: 'bigint', raw: 'BIGINT' };
    case 'MEDIUMINT':
      return { family: 'integer', base: 'integer', raw: 'INTEGER' };

    case 'REAL':
      return { family: 'float', base: 'real', raw: 'REAL' };
    case 'FLOAT':
    case 'DOUBLE':
    case 'DOUBLE PRECISION':
      // Bare FLOAT in Postgres is float8, i.e. double precision.
      return { family: 'float', base: 'double', raw: 'DOUBLE PRECISION' };

    case 'DECIMAL':
    case 'NUMERIC':
      return decimal(
        typeof options.precision === 'number' ? options.precision : null,
        typeof options.scale === 'number' ? options.scale : null,
      );

    case 'BOOLEAN':
      return simple('boolean', 'BOOLEAN');
    case 'DATE':
      return simple('timestamptz', 'TIMESTAMP WITH TIME ZONE');
    case 'DATEONLY':
      return simple('date', 'DATE');
    case 'TIME':
      return simple('time', 'TIME');
    case 'JSON':
      return simple('json', 'JSON');
    case 'JSONB':
      return simple('jsonb', 'JSONB');
    case 'UUID':
    case 'UUIDV1':
    case 'UUIDV4':
      return simple('uuid', 'UUID');
    case 'BLOB':
      return simple('bytea', 'BYTEA');

    case 'ARRAY': {
      const element = canonicalizeCodeType(instance.type);
      return { family: 'other', base: 'array', element, raw: `${element.raw}[]` };
    }
    case 'ENUM': {
      const values: string[] = Array.isArray(options.values) ? options.values : [];
      return simple('enum', `ENUM(${values.join(', ')})`);
    }

    default:
      return simple(key.toLowerCase() || 'unknown', key || 'UNKNOWN');
  }
}

function character(base: string, length: number | null): CanonicalType {
  return {
    family: 'character',
    base,
    length,
    raw: length === null ? base.toUpperCase() : `${base.toUpperCase()}(${length})`,
  };
}

function decimal(precision: number | null, scale: number | null): CanonicalType {
  return {
    family: 'decimal',
    base: 'decimal',
    precision,
    scale,
    raw: precision === null ? 'NUMERIC' : `NUMERIC(${precision},${scale ?? 0})`,
  };
}

function simple(base: string, raw: string): CanonicalType {
  return { family: 'other', base, raw };
}

/** `null` length/precision means unbounded, which outranks every bounded value. */
function capacity(value: number | null | undefined): number {
  return value === null || value === undefined ? Number.POSITIVE_INFINITY : value;
}

type Comparison =
  | { result: 'equal' }
  | { result: 'narrower' }
  | { result: 'wider' }
  | { result: 'mismatch' };

/**
 * Compares two canonical types. Within a family the answer is a capacity
 * verdict (`narrower` / `wider`); across families, or for unrelated base types,
 * it is a `mismatch`.
 */
export function compareTypes(expected: CanonicalType, actual: CanonicalType): Comparison {
  if (expected.base === 'array' || actual.base === 'array') {
    if (expected.base !== actual.base || !expected.element || !actual.element) {
      return { result: 'mismatch' };
    }
    const inner = compareTypes(expected.element, actual.element);
    if (inner.result === 'mismatch') return inner;
    // `information_schema.columns` reports character_maximum_length and
    // numeric_precision as NULL for array columns — the element type's typmod
    // is simply not exposed there. Capacity is therefore unknowable for those
    // families and comparing it would flag every VARCHAR(n)[] column as
    // "wider". Element base types stay comparable via udt_name (_int4 vs
    // _int8), so those verdicts are kept.
    if (expected.element.family === 'character' || expected.element.family === 'decimal') {
      return { result: 'equal' };
    }
    return inner;
  }

  if (expected.family !== actual.family) return { result: 'mismatch' };

  switch (expected.family) {
    case 'character': {
      // varchar/text/citext all hold character data; only capacity differs.
      // char vs varchar is a real difference (blank padding).
      const charLike = (t: CanonicalType) => t.base === 'char';
      if (charLike(expected) !== charLike(actual)) return { result: 'mismatch' };
      const want = capacity(expected.length);
      const have = capacity(actual.length);
      if (have === want) return { result: 'equal' };
      return have < want ? { result: 'narrower' } : { result: 'wider' };
    }
    case 'integer':
    case 'float': {
      const want = NUMERIC_RANK[expected.base] ?? 0;
      const have = NUMERIC_RANK[actual.base] ?? 0;
      if (have === want) return { result: 'equal' };
      return have < want ? { result: 'narrower' } : { result: 'wider' };
    }
    case 'decimal': {
      const wantP = capacity(expected.precision);
      const haveP = capacity(actual.precision);
      const wantS = capacity(expected.scale);
      const haveS = capacity(actual.scale);
      if (haveP < wantP || haveS < wantS) return { result: 'narrower' };
      if (haveP > wantP || haveS > wantS) return { result: 'wider' };
      return { result: 'equal' };
    }
    default:
      return expected.base === actual.base ? { result: 'equal' } : { result: 'mismatch' };
  }
}

/**
 * Nullability is compared asymmetrically, and deliberately so.
 *
 * Only ~70 of ~495 `@Column` decorators in this codebase declare
 * `allowNull: false`, while the migrations declare NOT NULL on far more, so a
 * symmetric check would report well over a hundred failures against a
 * correctly-migrated database and could never be enabled. The two directions
 * also carry different risk:
 *
 *   - code NOT NULL over a nullable column is an error: Sequelize and
 *     TypeScript both treat the value as always present, so a NULL row crashes
 *     whichever query path first touches it.
 *   - code nullable over a NOT NULL column is a warning: reads are always
 *     safe, only inserts can fail.
 *
 * An omitted `allowNull` is Sequelize's implicit `true`, and is treated the
 * same as an explicit one. A primary key is implicitly NOT NULL — except when
 * the attribute also says `allowNull: true`, see below.
 */
export function compareNullability(
  codeAllowNull: boolean | undefined,
  isPrimaryKey: boolean,
  dbIsNullable: boolean,
): 'ok' | 'code-stricter' | 'db-stricter' {
  const codeRequiresValue = codeAllowNull === false || (isPrimaryKey && codeAllowNull !== true);
  if (codeRequiresValue && dbIsNullable) return 'code-stricter';
  if (!codeRequiresValue && !dbIsNullable) return 'db-stricter';
  return 'ok';
}

function tableNameOf(model: { getTableName: () => string | { tableName: string } }): string {
  const name = model.getTableName();
  return typeof name === 'string' ? name : name.tableName;
}

/**
 * Introspects the live schema and compares it against every model registered
 * on the given Sequelize instance. Never throws on drift — returns findings.
 */
export async function validateSequelizeSchema(
  sequelize: Sequelize,
  options: SchemaValidationOptions = {},
): Promise<SchemaValidationReport> {
  const schema = options.schema ?? DEFAULT_SCHEMA;
  const findings: SchemaFinding[] = [];

  // One round trip for the whole schema. `describeTable()` would be one query
  // per table and discards numeric precision/scale and array element types,
  // all of which the capacity comparison needs.
  const rows = await sequelize.query<DbColumn>(
    `SELECT table_name, column_name, data_type, udt_name,
            character_maximum_length, numeric_precision, numeric_scale, is_nullable
     FROM information_schema.columns
     WHERE table_schema = :schema`,
    { type: QueryTypes.SELECT, replacements: { schema } },
  );

  const dbTables = new Map<string, Map<string, DbColumn>>();
  for (const row of rows) {
    let columns = dbTables.get(row.table_name);
    if (!columns) {
      columns = new Map<string, DbColumn>();
      dbTables.set(row.table_name, columns);
    }
    columns.set(row.column_name, row);
  }

  let tablesChecked = 0;
  let columnsChecked = 0;

  for (const model of Object.values(sequelize.models)) {
    const table = tableNameOf(model);
    const dbColumns = dbTables.get(table);

    if (!dbColumns) {
      findings.push({
        kind: 'missing-table',
        severity: 'error',
        table,
        message: `Table "${table}" is declared by model ${model.name} but does not exist in schema "${schema}"`,
      });
      continue;
    }

    tablesChecked++;
    const matchedColumns = new Set<string>();

    for (const [attrName, attr] of Object.entries(model.getAttributes())) {
      const normalized = normalizeType(sequelize, attr.type);

      // VIRTUAL attributes are computed in JS and have no column.
      if (normalized instanceof DataTypes.VIRTUAL) continue;

      const column = attr.field ?? attrName;
      const dbColumn = dbColumns.get(column);
      const expected = canonicalizeCodeType(normalized);

      if (!dbColumn) {
        findings.push({
          kind: 'missing-column',
          severity: 'error',
          table,
          column,
          expected: expected.raw,
          message: `Column "${table}"."${column}" is declared by model ${model.name} but does not exist`,
        });
        continue;
      }

      matchedColumns.add(column);
      columnsChecked++;

      const actual = canonicalizeDbType(dbColumn);
      const comparison = compareTypes(expected, actual);

      switch (comparison.result) {
        case 'mismatch':
          findings.push({
            kind: 'type-mismatch',
            severity: 'error',
            table,
            column,
            expected: expected.raw,
            actual: actual.raw,
            message: `Column "${table}"."${column}" has type ${actual.raw} but the model declares ${expected.raw}`,
          });
          break;
        case 'narrower':
          // The database cannot hold everything the model believes it can, so
          // some insert path will fail at runtime. This is the failure mode the
          // gate exists to catch, hence an error rather than a warning.
          findings.push({
            kind: 'length-narrower',
            severity: 'error',
            table,
            column,
            expected: expected.raw,
            actual: actual.raw,
            message: `Column "${table}"."${column}" is ${actual.raw}, narrower than the declared ${expected.raw}; values the model permits will be rejected`,
          });
          break;
        case 'wider':
          findings.push({
            kind: 'length-wider',
            severity: 'warning',
            table,
            column,
            expected: expected.raw,
            actual: actual.raw,
            message: `Column "${table}"."${column}" is ${actual.raw}, wider than the declared ${expected.raw}`,
          });
          break;
      }

      const nullability = compareNullability(
        attr.allowNull,
        attr.primaryKey === true,
        dbColumn.is_nullable === 'YES',
      );
      if (nullability === 'code-stricter') {
        findings.push({
          kind: 'nullability-code-stricter',
          severity: 'error',
          table,
          column,
          expected: 'NOT NULL',
          actual: 'NULL',
          message: `Column "${table}"."${column}" is nullable but the model declares it NOT NULL; a NULL row will break any code path that reads it`,
        });
      } else if (nullability === 'db-stricter') {
        findings.push({
          kind: 'nullability-db-stricter',
          severity: 'warning',
          table,
          column,
          expected: 'NULL',
          actual: 'NOT NULL',
          message: `Column "${table}"."${column}" is NOT NULL but the model does not declare it NOT NULL; inserts omitting it will fail`,
        });
      }
    }

    for (const column of dbColumns.keys()) {
      if (matchedColumns.has(column)) continue;
      findings.push({
        kind: 'extra-column',
        severity: 'warning',
        table,
        column,
        actual: canonicalizeDbType(dbColumns.get(column)!).raw,
        message: `Column "${table}"."${column}" exists in the database but is not declared by model ${model.name}`,
      });
    }
  }

  return {
    findings,
    errors: findings.filter((f) => f.severity === 'error'),
    warnings: findings.filter((f) => f.severity === 'warning'),
    tablesChecked,
    columnsChecked,
  };
}

/**
 * `normalizeDataType` turns a DataType constructor (`DataType.STRING`) into an
 * instance and applies dialect overrides. It is not on Sequelize's public
 * typings, so fall back to the raw value if it is ever removed.
 */
function normalizeType(sequelize: Sequelize, type: unknown): unknown {
  const normalize = (sequelize as unknown as { normalizeDataType?: (t: unknown) => unknown })
    .normalizeDataType;
  return typeof normalize === 'function' ? normalize.call(sequelize, type) : type;
}

/** Groups findings by table into indented, human-readable lines. */
function formatFindings(findings: SchemaFinding[]): string {
  const byTable = new Map<string, SchemaFinding[]>();
  for (const finding of findings) {
    const list = byTable.get(finding.table) ?? [];
    list.push(finding);
    byTable.set(finding.table, list);
  }

  const lines: string[] = [];
  for (const [table, tableFindings] of byTable) {
    lines.push(`  ${table}:`);
    for (const finding of tableFindings) {
      lines.push(`    [${finding.severity}] ${finding.message}`);
    }
  }
  return lines.join('\n');
}

function formatReport(report: SchemaValidationReport): string {
  return formatFindings([...report.errors, ...report.warnings]);
}

/** e.g. "2 type-mismatch, 1 missing-column" — keeps the thrown message useful alone. */
function countByKind(findings: SchemaFinding[]): string {
  const counts = new Map<SchemaFindingKind, number>();
  for (const finding of findings) {
    counts.set(finding.kind, (counts.get(finding.kind) ?? 0) + 1);
  }
  return [...counts.entries()].map(([kind, count]) => `${count} ${kind}`).join(', ');
}

/**
 * Startup gate. Introspects the schema, logs a summary plus one structured
 * entry per finding, and throws when errors are present.
 *
 * Skipped entirely when `sync`/`alter`/`force` is set: `sequelize.sync()` has
 * just reshaped the database to match the models, so validating afterwards can
 * only produce noise.
 */
export async function assertSequelizeSchemaMatches(
  sequelize: Sequelize,
  databaseConfig: BootstrapConfig['database'],
  logger: Logger<ILogObj>,
): Promise<SchemaValidationReport | null> {
  const log = logger.getSubLogger({ name: 'SchemaValidator' });

  if (!databaseConfig.validateSchema) {
    log.warn('Schema validation is disabled (database.validateSchema=false)');
    return null;
  }

  if (databaseConfig.sync || databaseConfig.alter || databaseConfig.force) {
    log.info(
      'Skipping schema validation: database.sync/alter/force is enabled, so the schema was just synchronized from the models',
    );
    return null;
  }

  const report = await validateSequelizeSchema(sequelize, { schema: databaseConfig.schema });

  const summary =
    `schema validation: ${report.errors.length} errors, ${report.warnings.length} warnings ` +
    `(${report.tablesChecked} tables, ${report.columnsChecked} columns checked)`;

  if (report.findings.length === 0) {
    log.info(summary);
    return report;
  }

  const reportBlock = `${summary}\n${formatReport(report)}`;
  if (report.errors.length > 0) {
    log.error(reportBlock);
  } else {
    log.warn(reportBlock);
  }

  if (report.errors.length > 0) {
    if (databaseConfig.validateSchemaSeverity === 'warn') {
      log.warn(
        `Schema validation found ${report.errors.length} error(s), but database.validateSchemaSeverity=warn, so startup will continue`,
      );
      return report;
    }

    throw new SchemaValidationError(
      `Database schema does not match the models: ${report.errors.length} error(s) ` +
        `(${countByKind(report.errors)}), ${report.warnings.length} warning(s). ` +
        `The full report was logged at error level.`,
      report,
    );
  }

  return report;
}
