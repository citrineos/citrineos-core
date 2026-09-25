// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DataTypes, QueryTypes } from 'sequelize';
import type { Sequelize } from 'sequelize-typescript';
import type { ILogObj, Logger } from 'tslog';
import type { SystemConfig } from '@citrineos/types';
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
 * Sequelize models declare.
 *
 * Sequelize has no built-in equivalent of Hibernate's `hbm2ddl.auto=validate`,
 * so this assembles the check from the two halves it does expose:
 * `Model.getAttributes()` for the code side and `information_schema.columns`
 * for the database side. Migrations remain the source of truth for the
 * database; this only reports where the two have diverged.
 *
 * Deliberately NOT covered: column defaults, indexes, foreign keys, unique
 * constraints. None of those are reachable from `getAttributes()`. The Drizzle
 * validator does cover indexes, because `getTableConfig()` exposes them.
 *
 * The finding vocabulary, capacity comparison and startup policy live in
 * `schema-validation.ts`, shared with the Drizzle gate; they are re-exported
 * here so existing importers keep working.
 */

export {
  compareNullability,
  compareTypes,
  DEFAULT_SCHEMA,
  SchemaValidationError,
  type SchemaFinding,
  type SchemaFindingKind,
  type SchemaFindingSeverity,
  type SchemaValidationOptions,
  type SchemaValidationReport,
} from './schema-validation.js';

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
    return array(canonicalizeDbType({ ...col, udt_name: udt.slice(1) }));
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
      return array(canonicalizeCodeType(instance.type));
    }
    case 'ENUM': {
      const values: string[] = Array.isArray(options.values) ? options.values : [];
      return simple('enum', `ENUM(${values.join(', ')})`);
    }

    default:
      return simple(key.toLowerCase() || 'unknown', key || 'UNKNOWN');
  }
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
      // information_schema does not expose array element typmods.
      const comparison = compareTypes(expected, actual, { unknownElementCapacity: true });

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

  return buildReport(findings, tablesChecked, columnsChecked);
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

/**
 * Startup gate for the Sequelize models. Introspects the schema, logs one
 * consolidated block, and throws when errors are present.
 *
 * The log/throw policy — including the `database.validateSchema` switch, the
 * `validateSchemaSeverity` escape hatch and the sync/alter/force skip — is
 * shared with the Drizzle gate; see `runSchemaValidationGate`.
 */
export async function assertSequelizeSchemaMatches(
  sequelize: Sequelize,
  config: SystemConfig,
  logger: Logger<ILogObj>,
): Promise<SchemaValidationReport | null> {
  return runSchemaValidationGate({
    config,
    logger,
    loggerName: 'SchemaValidator',
    summaryPrefix: 'schema validation',
    declaredBy: 'the models',
    validate: (schema) => validateSequelizeSchema(sequelize, { schema }),
  });
}
