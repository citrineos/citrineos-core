// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { inspect } from 'node:util';
import { assert, describe, expect, it } from 'vitest';
import { type ILogObj, Logger } from 'tslog';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { citext } from '@citrineos/dal';
import {
  assertDrizzleSchemaMatches,
  canonicalizeSqlTypeName,
  SchemaValidationError,
  validateDrizzleSchema,
  type SchemaFinding,
} from '@/util/index.js';

/**
 * The comparison logic is exercised through validateDrizzleSchema() against a faked
 * pg_catalog result, so the tests cover the same code path startup does
 * (canonicalization on both sides + comparison) without needing a live Postgres.
 * A testcontainers suite asserting zero errors against the real 52 tables lives in
 * drizzle-schema-validator-integration.test.ts.
 */

interface FakeColumn {
  table: string;
  name: string;
  sqlType: string;
  notNull: boolean;
  hasDefault: boolean;
  defaultExpression: string | null;
}

interface FakeIndex {
  table: string;
  name: string;
}

function col(overrides: Partial<FakeColumn> = {}): FakeColumn {
  return {
    table: 'Widgets',
    name: 'id',
    sqlType: 'character varying(255)',
    notNull: false,
    hasDefault: false,
    defaultExpression: null,
    ...overrides,
  };
}

/**
 * Stands in for a NodePgDatabase. The validator issues two queries; they are told
 * apart by the catalog they read rather than by call order, so the fake does not
 * silently hand back the wrong rows if that order ever changes.
 */
function fakeDb(columns: FakeColumn[], indexes: FakeIndex[] = []) {
  const db = {
    execute: (query: unknown) => {
      const text = JSON.stringify(query);
      if (text.includes('pg_index')) return Promise.resolve({ rows: indexes });
      if (text.includes('pg_attribute')) return Promise.resolve({ rows: columns });
      throw new Error(`Unrecognized introspection query: ${text.slice(0, 200)}`);
    },
  };
  return db as unknown as NodePgDatabase;
}

// A table covering every shape the validator has to reason about: a serial PK, an
// array, a custom type, a NOT NULL column, an app-side default and a DB default,
// plus one unique and one non-unique index.
const widgets = pgTable(
  'Widgets',
  {
    id: serial('id').primaryKey(),
    tags: varchar('tags', { length: 255 }).array(),
    idToken: citext('idToken'),
    label: varchar('label', { length: 255 }),
    payload: jsonb('payload'),
    counter: integer('counter'),
    bigCounter: bigint('bigCounter', { mode: 'number' }),
    balance: numeric('balance'),
    enabled: boolean('enabled').default(false),
    note: text('note'),
    tenantId: integer('tenantId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('widgets_token').on(t.idToken, t.tenantId),
    index('widgets_counter').on(t.counter),
  ],
);

const WIDGETS = [{ table: widgets, name: 'Widgets' }];

/** The database rows that correspond exactly to the declarations above. */
const matchingColumns: FakeColumn[] = [
  col({ name: 'id', sqlType: 'integer', notNull: true, hasDefault: true }),
  col({ name: 'tags', sqlType: 'character varying(255)[]' }),
  col({ name: 'idToken', sqlType: 'citext' }),
  col({ name: 'label', sqlType: 'character varying(255)' }),
  col({ name: 'payload', sqlType: 'jsonb' }),
  col({ name: 'counter', sqlType: 'integer' }),
  col({ name: 'bigCounter', sqlType: 'bigint' }),
  col({ name: 'balance', sqlType: 'numeric' }),
  col({ name: 'enabled', sqlType: 'boolean', hasDefault: true, defaultExpression: 'false' }),
  col({ name: 'note', sqlType: 'text' }),
  col({ name: 'tenantId', sqlType: 'integer', notNull: true }),
  col({ name: 'createdAt', sqlType: 'timestamp with time zone', notNull: true }),
];

const matchingIndexes: FakeIndex[] = [
  { table: 'Widgets', name: 'widgets_token' },
  { table: 'Widgets', name: 'widgets_counter' },
];

/** Replaces one column in the matching set. */
function withColumn(name: string, overrides: Partial<FakeColumn>): FakeColumn[] {
  const index = matchingColumns.findIndex((c) => c.name === name);
  assert.isAtLeast(index, 0, `no such column in the fixture: ${name}`);
  const next = [...matchingColumns];
  next[index] = { ...next[index], ...overrides };
  return next;
}

async function validate(columns: FakeColumn[], indexes: FakeIndex[] = matchingIndexes) {
  return validateDrizzleSchema(fakeDb(columns, indexes), { tables: WIDGETS });
}

function findingFor(findings: SchemaFinding[], column: string): SchemaFinding | undefined {
  return findings.find((f) => f.column === column);
}

describe('DrizzleSchemaValidator', () => {
  // --- Type canonicalization ---------------------------------------------------

  describe('canonicalizeSqlTypeName', () => {
    it.each([
      // drizzle's spelling and PostgreSQL's format_type() spelling must agree.
      ['varchar(255)', 'character varying(255)'],
      ['timestamp with time zone', 'timestamptz'],
      ['boolean', 'bool'],
      ['integer', 'int4'],
      ['bigint', 'int8'],
      ['numeric', 'numeric'],
      ['citext', 'citext'],
      ['text', 'text'],
      ['jsonb', 'jsonb'],
      ['varchar(255)[]', 'character varying(255)[]'],
      // serial is integer plus a sequence default; format_type() reports the integer.
      ['serial', 'integer'],
      ['bigserial', 'bigint'],
      ['smallserial', 'smallint'],
      // PostGIS: drizzle emits geometry(point), PostgreSQL reports geometry(Point).
      ['geometry(point)', 'geometry(Point)'],
    ])('treats %s and %s as the same type', (a, b) => {
      assert.deepStrictEqual(canonicalizeSqlTypeName(a), canonicalizeSqlTypeName(b));
    });

    it.each([
      ['varchar(255)', 'varchar(500)', 'capacity'],
      ['timestamptz', 'timestamp', 'time zone'],
      ['varchar(255)', 'varchar(255)[]', 'array-ness'],
      ['citext', 'char(255)', 'blank padding'],
      ['numeric(10,2)', 'numeric(8,2)', 'precision'],
      ['geometry(point)', 'geometry(Point,4326)', 'SRID'],
      ['integer', 'jsonb', 'family'],
    ])('does not conflate %s with %s (differs by %s)', (a, b) => {
      assert.notDeepEqual(canonicalizeSqlTypeName(a), canonicalizeSqlTypeName(b));
    });

    it('records character capacity so it can be compared', () => {
      const t = canonicalizeSqlTypeName('character varying(255)');
      assert.strictEqual(t.family, 'character');
      assert.strictEqual(t.length, 255);
      assert.strictEqual(t.raw, 'VARCHAR(255)');
    });

    it('treats text and citext as unbounded character types', () => {
      assert.strictEqual(canonicalizeSqlTypeName('text').length, null);
      assert.strictEqual(canonicalizeSqlTypeName('citext').length, null);
    });

    it('keeps an unrecognized type comparable on its full name', () => {
      // Nothing is silently treated as equal just because the parser has not been
      // taught about it.
      const t = canonicalizeSqlTypeName('some_enum_type');
      assert.strictEqual(t.family, 'other');
      assert.strictEqual(t.base, 'some_enum_type');
    });
  });

  // --- Comparison through the validator ---------------------------------------

  describe('a schema that matches the declarations', () => {
    it('reports nothing', async () => {
      const report = await validate(matchingColumns);
      assert.deepStrictEqual(report.findings, [], JSON.stringify(report.findings, null, 2));
    });

    it('counts what it checked', async () => {
      const report = await validate(matchingColumns);
      assert.strictEqual(report.tablesChecked, 1);
      assert.strictEqual(report.columnsChecked, matchingColumns.length);
    });

    it('accepts a serial declaration against integer + a sequence default', async () => {
      const report = await validate(matchingColumns);
      assert.isUndefined(findingFor(report.findings, 'id'));
    });

    it('accepts an app-side $defaultFn column with no database default', async () => {
      const report = await validate(matchingColumns);
      assert.isUndefined(findingFor(report.findings, 'createdAt'));
    });
  });

  describe('missing declarations', () => {
    it('reports a missing table once, not once per column', async () => {
      const report = await validate([]);
      assert.strictEqual(report.findings.length, 1);
      assert.strictEqual(report.findings[0].kind, 'missing-table');
      assert.strictEqual(report.findings[0].severity, 'error');
      assert.strictEqual(report.tablesChecked, 0);
    });

    it('reports a declared column the database does not have', async () => {
      const report = await validate(matchingColumns.filter((c) => c.name !== 'note'));
      assert.strictEqual(report.errors.length, 1);
      assert.strictEqual(report.errors[0].kind, 'missing-column');
      assert.strictEqual(report.errors[0].column, 'note');
    });
  });

  describe('type differences', () => {
    it('reports an unrelated type as a mismatch', async () => {
      const report = await validate(withColumn('payload', { sqlType: 'text' }));
      const finding = findingFor(report.errors, 'payload');
      assert.strictEqual(finding?.kind, 'type-mismatch');
      assert.strictEqual(finding?.expected, 'JSONB');
    });

    it('errors when the database column is narrower than declared', async () => {
      // Values the schema permits would be rejected at runtime.
      const report = await validate(withColumn('label', { sqlType: 'character varying(50)' }));
      const finding = findingFor(report.errors, 'label');
      assert.strictEqual(finding?.kind, 'length-narrower');
      assert.strictEqual(finding?.severity, 'error');
    });

    it('only warns when the database column is wider than declared', async () => {
      const report = await validate(withColumn('label', { sqlType: 'character varying(500)' }));
      const finding = findingFor(report.warnings, 'label');
      assert.strictEqual(finding?.kind, 'length-wider');
      assert.strictEqual(finding?.severity, 'warning');
      assert.deepStrictEqual(report.errors, []);
    });

    it('errors on a narrower integer and warns on a wider one', async () => {
      const narrower = await validate(withColumn('bigCounter', { sqlType: 'integer' }));
      assert.strictEqual(findingFor(narrower.errors, 'bigCounter')?.kind, 'length-narrower');

      const wider = await validate(withColumn('counter', { sqlType: 'bigint' }));
      assert.strictEqual(findingFor(wider.warnings, 'counter')?.kind, 'length-wider');
      assert.deepStrictEqual(wider.errors, []);
    });

    it('compares array element capacity, which format_type() exposes', async () => {
      // The Sequelize validator cannot do this: information_schema reports NULL
      // for an array element's typmod.
      const report = await validate(withColumn('tags', { sqlType: 'character varying(50)[]' }));
      assert.strictEqual(findingFor(report.errors, 'tags')?.kind, 'length-narrower');
    });

    it('reports citext narrowed to varchar', async () => {
      const report = await validate(withColumn('idToken', { sqlType: 'character varying(255)' }));
      assert.strictEqual(findingFor(report.errors, 'idToken')?.kind, 'length-narrower');
    });
  });

  describe('nullability, compared asymmetrically', () => {
    it('errors when the declaration is NOT NULL over a nullable column', async () => {
      // The entity type promises a value the database does not guarantee.
      const report = await validate(withColumn('tenantId', { notNull: false }));
      const finding = findingFor(report.errors, 'tenantId');
      assert.strictEqual(finding?.kind, 'nullability-code-stricter');
      assert.strictEqual(finding?.severity, 'error');
    });

    it('only warns when the database is NOT NULL and the declaration is not', async () => {
      // Reads stay safe; only inserts omitting the column can fail.
      const report = await validate(withColumn('note', { notNull: true }));
      const finding = findingFor(report.warnings, 'note');
      assert.strictEqual(finding?.kind, 'nullability-db-stricter');
      assert.deepStrictEqual(report.errors, []);
    });
  });

  describe('columns the database has but the declarations do not', () => {
    it('only warns for a nullable one', async () => {
      // drizzle names every column explicitly, so it is invisible to reads and writes.
      const report = await validate([
        ...matchingColumns,
        col({ name: 'legacy', sqlType: 'integer' }),
      ]);
      const finding = findingFor(report.warnings, 'legacy');
      assert.strictEqual(finding?.kind, 'extra-column');
      assert.deepStrictEqual(report.errors, []);
    });

    it('only warns for a NOT NULL one that has a default', async () => {
      const report = await validate([
        ...matchingColumns,
        col({ name: 'legacy', sqlType: 'integer', notNull: true, hasDefault: true }),
      ]);
      assert.strictEqual(findingFor(report.warnings, 'legacy')?.kind, 'extra-column');
      assert.deepStrictEqual(report.errors, []);
    });

    it('errors for a NOT NULL one with no default, which breaks every insert', async () => {
      const report = await validate([
        ...matchingColumns,
        col({ name: 'legacy', sqlType: 'integer', notNull: true, hasDefault: false }),
      ]);
      const finding = findingFor(report.errors, 'legacy');
      assert.strictEqual(finding?.kind, 'extra-column');
      assert.strictEqual(finding?.severity, 'error');
      assert.include(finding?.message ?? '', 'every INSERT');
    });
  });

  describe('indexes', () => {
    it('errors on a missing unique index, since uniqueness is unenforced', async () => {
      const report = await validate(
        matchingColumns,
        matchingIndexes.filter((i) => i.name !== 'widgets_token'),
      );
      assert.strictEqual(report.errors.length, 1);
      assert.strictEqual(report.errors[0].kind, 'missing-index');
      assert.strictEqual(report.errors[0].index, 'widgets_token');
      assert.include(report.errors[0].message, 'uniqueness is NOT enforced');
    });

    it('only warns on a missing non-unique index, which costs performance', async () => {
      const report = await validate(
        matchingColumns,
        matchingIndexes.filter((i) => i.name !== 'widgets_counter'),
      );
      assert.deepStrictEqual(report.errors, []);
      assert.strictEqual(report.warnings[0].kind, 'missing-index');
      assert.strictEqual(report.warnings[0].index, 'widgets_counter');
    });

    it('tolerates an index the database has but the declarations do not', async () => {
      const report = await validate(matchingColumns, [
        ...matchingIndexes,
        { table: 'Widgets', name: 'widgets_extra' },
      ]);
      assert.deepStrictEqual(report.findings, []);
    });
  });

  describe('column defaults, which are opt-in', () => {
    const withoutDbDefault = withColumn('enabled', { hasDefault: false, defaultExpression: null });

    it('are not compared by default', async () => {
      const report = await validate(withoutDbDefault);
      assert.deepStrictEqual(report.findings, []);
    });

    it('warn about a dropped default when enabled', async () => {
      const report = await validateDrizzleSchema(fakeDb(withoutDbDefault, matchingIndexes), {
        tables: WIDGETS,
        checkDefaults: true,
      });
      const finding = findingFor(report.warnings, 'enabled');
      assert.strictEqual(finding?.kind, 'default-mismatch');
      assert.strictEqual(finding?.severity, 'warning');
    });

    it('never fire on serial or $defaultFn columns', async () => {
      // id's default comes from its sequence and createdAt's from the application;
      // comparing on hasDefault alone would flag both on every table.
      const report = await validateDrizzleSchema(fakeDb(matchingColumns, matchingIndexes), {
        tables: WIDGETS,
        checkDefaults: true,
      });
      assert.deepStrictEqual(report.findings, []);
    });
  });

  describe('introspection', () => {
    it('honours the configured Postgres schema', async () => {
      const queries: string[] = [];
      const db = {
        execute: (query: unknown) => {
          queries.push(JSON.stringify(query));
          return Promise.resolve({ rows: [] });
        },
      } as unknown as NodePgDatabase;

      await validateDrizzleSchema(db, { tables: WIDGETS, schema: 'tenant_a' });
      assert.isTrue(
        queries.every((q) => q.includes('tenant_a')),
        'both catalog queries should be scoped to the configured schema',
      );
    });

    it('binds the table filter as one array parameter', async () => {
      // Regression: drizzle's sql template spreads a plain array into one bind
      // parameter per element, which makes `= ANY($n)` a malformed array literal.
      const captured: unknown[] = [];
      const db = {
        execute: (query: unknown) => {
          captured.push(query);
          return Promise.resolve({ rows: [] });
        },
      } as unknown as NodePgDatabase;

      await validateDrizzleSchema(db, { tables: WIDGETS });
      const serialized = JSON.stringify(captured);
      assert.include(serialized, '::text[]');
    });
  });

  // --- The startup gate --------------------------------------------------------

  describe('assertDrizzleSchemaMatches', () => {
    const logger = new Logger({ type: 'hidden' });

    const baseConfig = () =>
      ({
        database: {
          schema: 'public',
          validateSchema: true,
          validateSchemaSeverity: 'error' as const,
          sync: false,
          alter: false,
          force: false,
        },
      }) as any;

    /** Captures what actually reaches the logger, at which level. */
    function capturingLogger() {
      const calls: { level: 'error' | 'warn' | 'info'; message: string }[] = [];
      const sub = {
        error: (message: string) => calls.push({ level: 'error', message }),
        warn: (message: string) => calls.push({ level: 'warn', message }),
        info: (message: string) => calls.push({ level: 'info', message }),
      };
      return { calls, logger: { getSubLogger: () => sub, ...sub } };
    }

    const drifted = withColumn('label', { sqlType: 'character varying(50)' });

    function gate(columns: FakeColumn[], config = baseConfig(), log: unknown = logger) {
      return assertDrizzleSchemaMatches(
        fakeDb(columns, matchingIndexes),
        config,
        log as Logger<ILogObj>,
        { tables: WIDGETS },
      );
    }

    it('resolves when the schema matches', async () => {
      const report = await gate(matchingColumns);
      assert.strictEqual(report?.errors.length, 0);
      assert.strictEqual(report?.tablesChecked, 1);
    });

    it('throws on drift so startup aborts', async () => {
      await expect(gate(drifted)).rejects.toThrow(SchemaValidationError);
    });

    it('carries the full report on the thrown error', async () => {
      const error = (await gate(drifted).catch((e) => e)) as SchemaValidationError;
      assert.instanceOf(error, SchemaValidationError);
      assert.strictEqual(error.report.errors[0].table, 'Widgets');
      assert.strictEqual(error.report.errors[0].column, 'label');
    });

    it('keeps the report out of serialized log output', async () => {
      const error = (await gate(drifted).catch((e) => e)) as SchemaValidationError;
      assert.notInclude(inspect(error), '[Object]');
      // getOwnPropertyNames, not keys: tslog ignores enumerability.
      assert.notInclude(Object.getOwnPropertyNames(error), 'report');
      assert.notInclude(JSON.stringify(error), 'findings');
      assert.strictEqual(error.report.errors.length, 1);
    });

    it('names the drizzle declarations in the thrown message', async () => {
      // Both gates can throw the same error class; the message has to say which ran.
      const error = (await gate(drifted).catch((e) => e)) as SchemaValidationError;
      assert.include(error.message, 'the drizzle schema declarations');
      assert.include(error.message, '1 error(s)');
      assert.include(error.message, '1 length-narrower');
      assert.notInclude(error.message, '"Widgets"."label"');
    });

    describe('log output', () => {
      it('emits one consolidated block distinguishable from the sequelize gate', async () => {
        const { calls, logger: capture } = capturingLogger();
        await gate(drifted, baseConfig(), capture).catch(() => undefined);

        assert.strictEqual(calls.length, 1, JSON.stringify(calls, null, 2));
        assert.strictEqual(calls[0].level, 'error');
        assert.include(calls[0].message, 'drizzle schema validation:');
        assert.include(calls[0].message, '"Widgets"."label"');
      });

      it('emits only the summary when there is nothing to report', async () => {
        const { calls, logger: capture } = capturingLogger();
        await gate(matchingColumns, baseConfig(), capture);

        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0].level, 'info');
        assert.strictEqual(
          calls[0].message,
          `drizzle schema validation: 0 errors, 0 warnings (1 tables, ${matchingColumns.length} columns checked)`,
        );
      });

      it('warns rather than errors when only warnings are present', async () => {
        const { calls, logger: capture } = capturingLogger();
        const report = await gate(
          withColumn('label', { sqlType: 'character varying(500)' }),
          baseConfig(),
          capture,
        );

        assert.strictEqual(report?.errors.length, 0);
        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0].level, 'warn');
      });

      it('adds one line, not a second block, when severity is warn', async () => {
        const { calls, logger: capture } = capturingLogger();
        const config = baseConfig();
        config.database.validateSchemaSeverity = 'warn';

        await gate(drifted, config, capture);

        assert.strictEqual(calls.length, 2);
        assert.strictEqual(calls[0].level, 'error');
        assert.strictEqual(calls[1].level, 'warn');
        assert.include(calls[1].message, 'startup will continue');
      });
    });

    it('reports without throwing when severity is warn', async () => {
      const config = baseConfig();
      config.database.validateSchemaSeverity = 'warn';
      const report = await gate(drifted, config);
      assert.strictEqual(report?.errors.length, 1);
    });

    it('skips entirely when validation is disabled', async () => {
      const config = baseConfig();
      config.database.validateSchema = false;
      assert.strictEqual(await gate(drifted, config), null);
    });

    for (const flag of ['sync', 'alter', 'force'] as const) {
      it(`skips when database.${flag} is set, since sync has just reshaped the schema`, async () => {
        const config = baseConfig();
        config.database[flag] = true;
        assert.strictEqual(await gate(drifted, config), null);
      });
    }
  });

  // --- Guards on the drizzle internals this relies on --------------------------

  describe('assumptions about drizzle', () => {
    it('exposes notNull, primary and defaults on a column', async () => {
      const { getTableConfig } = await import('drizzle-orm/pg-core');
      const columns = getTableConfig(widgets).columns;
      const byName = new Map(columns.map((c) => [c.name, c]));

      assert.isTrue(byName.get('tenantId')!.notNull);
      assert.isTrue(byName.get('id')!.primary);
      // A `.default()` value is readable, and a `$defaultFn` is distinguishable
      // from it — the whole opt-in default check depends on telling them apart.
      assert.strictEqual(byName.get('enabled')!.default, false);
      assert.isUndefined(byName.get('createdAt')!.default);
      assert.isFunction(byName.get('createdAt')!.defaultFn);
    });

    it('exposes index names and uniqueness', async () => {
      const { getTableConfig } = await import('drizzle-orm/pg-core');
      const indexes = getTableConfig(widgets).indexes;
      const byName = new Map(indexes.map((i) => [i.config.name, i.config]));

      assert.isTrue(byName.get('widgets_token')!.unique);
      assert.isFalse(byName.get('widgets_counter')!.unique);
    });

    it('still spreads a plain array into separate bind parameters', async () => {
      // The reason introspect() wraps the table filter in sql.param(). If drizzle
      // ever changes this, the cast can be simplified.
      const query = sql`x = ANY(${['a', 'b']})`;
      assert.include(JSON.stringify(query), '"a"');
      assert.include(JSON.stringify(query), '"b"');
    });
  });
});
