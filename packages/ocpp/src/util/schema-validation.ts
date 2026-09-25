// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SystemConfig } from '@citrineos/types';
import type { ILogObj, Logger } from 'tslog';

export const DEFAULT_SCHEMA = 'public';

/**
 * `error`: some code path is guaranteed to fail at runtime
 * `warning`: degraded but serviceable.
 */
export type SchemaFindingSeverity = 'error' | 'warning';

export type SchemaFindingKind =
  | 'missing-table'
  | 'missing-column'
  | 'extra-column'
  | 'type-mismatch'
  | 'length-narrower'
  | 'length-wider'
  | 'nullability-code-stricter'
  | 'nullability-db-stricter'
  | 'missing-index'
  | 'default-mismatch';

export interface SchemaFinding {
  kind: SchemaFindingKind;
  severity: SchemaFindingSeverity;
  table: string;
  column?: string;
  index?: string;
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
export type TypeFamily = 'character' | 'integer' | 'float' | 'decimal' | 'other';

export interface CanonicalType {
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

export function character(base: string, length: number | null): CanonicalType {
  return {
    family: 'character',
    base,
    length,
    raw: length === null ? base.toUpperCase() : `${base.toUpperCase()}(${length})`,
  };
}

export function decimal(precision: number | null, scale: number | null): CanonicalType {
  return {
    family: 'decimal',
    base: 'decimal',
    precision,
    scale,
    raw: precision === null ? 'NUMERIC' : `NUMERIC(${precision},${scale ?? 0})`,
  };
}

export function simple(base: string, raw: string): CanonicalType {
  return { family: 'other', base, raw };
}

export function array(element: CanonicalType): CanonicalType {
  return { family: 'other', base: 'array', element, raw: `${element.raw}[]` };
}

/** `null` length/precision means unbounded, which outranks every bounded value. */
function capacity(value: number | null | undefined): number {
  return value === null || value === undefined ? Number.POSITIVE_INFINITY : value;
}

export type Comparison =
  | { result: 'equal' }
  | { result: 'narrower' }
  | { result: 'wider' }
  | { result: 'mismatch' };

/**
 * Compares two canonical types. Within a family the answer is a capacity
 * verdict (`narrower` / `wider`); across families, or for unrelated base types,
 * it is a `mismatch`.
 *
 * `unknownElementCapacity` is set by callers whose database-side introspection
 * cannot see an array element's typmod — see the array branch.
 */
export function compareTypes(
  expected: CanonicalType,
  actual: CanonicalType,
  options: { unknownElementCapacity?: boolean } = {},
): Comparison {
  if (expected.base === 'array' || actual.base === 'array') {
    if (expected.base !== actual.base || !expected.element || !actual.element) {
      return { result: 'mismatch' };
    }
    const inner = compareTypes(expected.element, actual.element, options);
    if (inner.result === 'mismatch') return inner;
    // `information_schema.columns` reports character_maximum_length and
    // numeric_precision as NULL for array columns — the element type's typmod
    // is simply not exposed there. Capacity is therefore unknowable for those
    // families and comparing it would flag every VARCHAR(n)[] column as
    // "wider". Element base types stay comparable via udt_name (_int4 vs
    // _int8), so those verdicts are kept. Callers reading `format_type()`
    // instead do see the element typmod, and leave the flag unset.
    if (
      options.unknownElementCapacity &&
      (expected.element.family === 'character' || expected.element.family === 'decimal')
    ) {
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
 *   - code NOT NULL over a nullable column is an error: the ORM and TypeScript
 *     both treat the value as always present, so a NULL row crashes whichever
 *     query path first touches it.
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

/** Splits findings by severity into the report shape callers consume. */
export function buildReport(
  findings: SchemaFinding[],
  tablesChecked: number,
  columnsChecked: number,
): SchemaValidationReport {
  return {
    findings,
    errors: findings.filter((f) => f.severity === 'error'),
    warnings: findings.filter((f) => f.severity === 'warning'),
    tablesChecked,
    columnsChecked,
  };
}

/** Groups findings by table into indented, human-readable lines. */
export function formatFindings(findings: SchemaFinding[]): string {
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

export function formatReport(report: SchemaValidationReport): string {
  return formatFindings([...report.errors, ...report.warnings]);
}

/** e.g. "2 type-mismatch, 1 missing-column" — keeps the thrown message useful alone. */
export function countByKind(findings: SchemaFinding[]): string {
  const counts = new Map<SchemaFindingKind, number>();
  for (const finding of findings) {
    counts.set(finding.kind, (counts.get(finding.kind) ?? 0) + 1);
  }
  return [...counts.entries()].map(([kind, count]) => `${count} ${kind}`).join(', ');
}

export interface SchemaValidationGateOptions {
  config: SystemConfig;
  logger: Logger<ILogObj>;
  /** Sub-logger name, e.g. `SchemaValidator`. */
  loggerName: string;
  /** Prefixes the summary line, e.g. `schema validation`. */
  summaryPrefix: string;
  /** Names what the database is compared against, for the thrown message. */
  declaredBy: string;
  /** Runs the comparison against the configured Postgres schema. */
  validate: (schema: string) => Promise<SchemaValidationReport>;
}

export async function runSchemaValidationGate({
  config,
  logger,
  loggerName,
  summaryPrefix,
  declaredBy,
  validate,
}: SchemaValidationGateOptions): Promise<SchemaValidationReport | null> {
  const log = logger.getSubLogger({ name: loggerName });
  const databaseConfig = config.database;

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

  const report = await validate(databaseConfig.schema ?? DEFAULT_SCHEMA);

  const summary =
    `${summaryPrefix}: ${report.errors.length} errors, ${report.warnings.length} warnings ` +
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
      `Database schema does not match ${declaredBy}: ${report.errors.length} error(s) ` +
        `(${countByKind(report.errors)}), ${report.warnings.length} warning(s). ` +
        `The full report was logged at error level.`,
      report,
    );
  }

  return report;
}
