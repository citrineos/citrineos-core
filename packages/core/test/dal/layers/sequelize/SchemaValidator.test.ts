// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { assert, describe, expect, it } from 'vitest';
import { DataTypes, QueryTypes, Sequelize as CoreSequelize } from 'sequelize';
import { Column, DataType, Model, PrimaryKey, Sequelize, Table } from 'sequelize-typescript';
import {
  assertSchemaMatches,
  compareNullability,
  SchemaValidationError,
  validateSchema,
  type SchemaFinding,
} from '@dal/layers/sequelize/SchemaValidator.js';
import { Logger } from 'tslog';

/**
 * The comparison logic is exercised through validateSchema() against a faked
 * information_schema result, so the tests cover the same code path startup does
 * (canonicalization on both sides + comparison) without needing a live Postgres.
 * A testcontainers suite asserting zero errors against a freshly-migrated
 * database is the remaining piece and is noted at the bottom of this file.
 */

interface FakeColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  is_nullable: 'YES' | 'NO';
}

function col(overrides: Partial<FakeColumn> & Pick<FakeColumn, 'column_name'>): FakeColumn {
  return {
    table_name: 'Widgets',
    data_type: 'character varying',
    udt_name: 'varchar',
    character_maximum_length: 255,
    numeric_precision: null,
    numeric_scale: null,
    is_nullable: 'YES',
    ...overrides,
  };
}

/**
 * Builds a Sequelize instance with the given models registered but no
 * connection, and stubs `query()` to return the supplied rows. sequelize-typescript
 * needs no database to build model metadata, which is all the validator reads.
 */
function harness(models: any[], rows: FakeColumn[]) {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    database: 'test',
    username: 'test',
    password: 'test',
    models,
    logging: false,
  });

  const queries: { sql: string; options: any }[] = [];
  (sequelize as any).query = async (sql: string, options: any) => {
    queries.push({ sql, options });
    return rows;
  };

  return { sequelize, queries };
}

async function findingsFor(models: any[], rows: FakeColumn[]): Promise<SchemaFinding[]> {
  const { sequelize } = harness(models, rows);
  const report = await validateSchema(sequelize);
  return report.findings;
}

function kinds(findings: SchemaFinding[]): string[] {
  return findings.map((f) => f.kind);
}

// --- Models used by the tests -------------------------------------------------

@Table({ tableName: 'Widgets', timestamps: false })
class StringWidget extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;
}

@Table({ tableName: 'Widgets', timestamps: false })
class IntegerWidget extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  declare id: number;
}

// --- Introspection query -----------------------------------------------------

describe('validateSchema introspection', () => {
  it('reads the whole schema in a single query, parameterised by schema name', async () => {
    const { sequelize, queries } = harness(
      [StringWidget],
      [col({ column_name: 'id', is_nullable: 'NO' })],
    );
    await validateSchema(sequelize, { schema: 'tenant_a' });

    assert.strictEqual(queries.length, 1, 'expected exactly one introspection query');
    assert.include(queries[0].sql, 'information_schema.columns');
    assert.strictEqual(queries[0].options.type, QueryTypes.SELECT);
    assert.strictEqual(queries[0].options.replacements.schema, 'tenant_a');
  });

  it('defaults to the public schema', async () => {
    const { sequelize, queries } = harness(
      [StringWidget],
      [col({ column_name: 'id', is_nullable: 'NO' })],
    );
    await validateSchema(sequelize);
    assert.strictEqual(queries[0].options.replacements.schema, 'public');
  });
});

// --- Presence ----------------------------------------------------------------

describe('table and column presence', () => {
  it('fails when the model table is absent', async () => {
    const findings = await findingsFor(
      [StringWidget],
      [col({ table_name: 'SomethingElse', column_name: 'id' })],
    );
    assert.deepStrictEqual(kinds(findings), ['missing-table']);
    assert.strictEqual(findings[0].severity, 'error');
  });

  it('fails when a declared column is absent', async () => {
    @Table({ tableName: 'Widgets', timestamps: false })
    class TwoColumnWidget extends Model {
      @PrimaryKey
      @Column(DataType.STRING)
      declare id: string;

      @Column(DataType.STRING)
      declare label: string;
    }

    const findings = await findingsFor(
      [TwoColumnWidget],
      [col({ column_name: 'id', is_nullable: 'NO' })],
    );
    assert.deepStrictEqual(kinds(findings), ['missing-column']);
    assert.strictEqual(findings[0].severity, 'error');
    assert.strictEqual(findings[0].column, 'label');
  });

  it('warns, and does not fail, on a column the models do not declare', async () => {
    const findings = await findingsFor(
      [StringWidget],
      [
        col({ column_name: 'id', is_nullable: 'NO' }),
        col({ column_name: 'legacyFlag', udt_name: 'bool', data_type: 'boolean' }),
      ],
    );
    assert.deepStrictEqual(kinds(findings), ['extra-column']);
    assert.strictEqual(findings[0].severity, 'warning');
    assert.strictEqual(findings[0].column, 'legacyFlag');
  });

  it('ignores tables no model declares', async () => {
    const findings = await findingsFor(
      [StringWidget],
      [
        col({ column_name: 'id', is_nullable: 'NO' }),
        col({ table_name: 'SequelizeMeta', column_name: 'name', is_nullable: 'NO' }),
      ],
    );
    assert.deepStrictEqual(findings, []);
  });

  it('honours an explicit column name from the field option', async () => {
    @Table({ tableName: 'Widgets', timestamps: false })
    class AliasedWidget extends Model {
      @PrimaryKey
      @Column({ type: DataType.STRING, field: 'widget_id' })
      declare id: string;
    }

    const findings = await findingsFor(
      [AliasedWidget],
      [col({ column_name: 'widget_id', is_nullable: 'NO' })],
    );
    assert.deepStrictEqual(findings, []);
  });

  it('ignores VIRTUAL attributes, which have no column', async () => {
    @Table({ tableName: 'Widgets', timestamps: false })
    class VirtualWidget extends Model {
      @PrimaryKey
      @Column(DataType.STRING)
      declare id: string;

      @Column(DataType.VIRTUAL)
      declare computed: string;
    }

    const findings = await findingsFor(
      [VirtualWidget],
      [col({ column_name: 'id', is_nullable: 'NO' })],
    );
    assert.deepStrictEqual(findings, []);
  });
});

// --- Type equivalence --------------------------------------------------------

describe('type equivalence', () => {
  const cases: {
    name: string;
    type: any;
    db: Partial<FakeColumn>;
  }[] = [
    { name: 'STRING -> varchar(255)', type: DataType.STRING, db: {} },
    {
      name: 'STRING(64) -> varchar(64)',
      type: DataType.STRING(64),
      db: { character_maximum_length: 64 },
    },
    {
      name: 'TEXT -> text',
      type: DataType.TEXT,
      db: { udt_name: 'text', data_type: 'text', character_maximum_length: null },
    },
    {
      name: 'INTEGER -> int4',
      type: DataType.INTEGER,
      db: { udt_name: 'int4', data_type: 'integer', character_maximum_length: null },
    },
    {
      name: 'BIGINT -> int8',
      type: DataType.BIGINT,
      db: { udt_name: 'int8', data_type: 'bigint', character_maximum_length: null },
    },
    {
      name: 'BOOLEAN -> bool',
      type: DataType.BOOLEAN,
      db: { udt_name: 'bool', data_type: 'boolean', character_maximum_length: null },
    },
    {
      name: 'DATE -> timestamptz',
      type: DataType.DATE,
      db: {
        udt_name: 'timestamptz',
        data_type: 'timestamp with time zone',
        character_maximum_length: null,
      },
    },
    {
      name: 'DATEONLY -> date',
      type: DataType.DATEONLY,
      db: { udt_name: 'date', data_type: 'date', character_maximum_length: null },
    },
    {
      name: 'FLOAT -> float8 (bare FLOAT is double precision in Postgres)',
      type: DataType.FLOAT,
      db: { udt_name: 'float8', data_type: 'double precision', character_maximum_length: null },
    },
    {
      name: 'JSON -> json',
      type: DataType.JSON,
      db: { udt_name: 'json', data_type: 'json', character_maximum_length: null },
    },
    {
      name: 'JSONB -> jsonb',
      type: DataType.JSONB,
      db: { udt_name: 'jsonb', data_type: 'jsonb', character_maximum_length: null },
    },
    {
      name: 'UUID -> uuid',
      type: DataType.UUID,
      db: { udt_name: 'uuid', data_type: 'uuid', character_maximum_length: null },
    },
    {
      name: 'BLOB -> bytea',
      type: DataType.BLOB,
      db: { udt_name: 'bytea', data_type: 'bytea', character_maximum_length: null },
    },
    {
      name: 'DECIMAL(10,2) -> numeric(10,2)',
      type: DataType.DECIMAL(10, 2),
      db: {
        udt_name: 'numeric',
        data_type: 'numeric',
        character_maximum_length: null,
        numeric_precision: 10,
        numeric_scale: 2,
      },
    },
    {
      name: 'ARRAY(STRING) -> _varchar',
      type: DataType.ARRAY(DataType.STRING),
      db: { udt_name: '_varchar', data_type: 'ARRAY' },
    },
  ];

  for (const testCase of cases) {
    it(`accepts ${testCase.name}`, async () => {
      @Table({ tableName: 'Widgets', timestamps: false })
      class TypedWidget extends Model {
        @PrimaryKey
        @Column(testCase.type)
        declare id: any;
      }

      const findings = await findingsFor(
        [TypedWidget],
        [col({ column_name: 'id', is_nullable: 'NO', ...testCase.db })],
      );
      assert.deepStrictEqual(findings, [], JSON.stringify(findings));
    });
  }

  it('fails on an unrelated base type', async () => {
    const findings = await findingsFor(
      [IntegerWidget],
      [col({ column_name: 'id', is_nullable: 'NO' })], // varchar in the database
    );
    assert.deepStrictEqual(kinds(findings), ['type-mismatch']);
    assert.strictEqual(findings[0].severity, 'error');
    assert.strictEqual(findings[0].expected, 'INTEGER');
    assert.strictEqual(findings[0].actual, 'VARCHAR(255)');
  });

  it('does not flag capacity on array columns, which Postgres does not report', async () => {
    // Verified against a real Postgres: information_schema.columns reports
    // character_maximum_length as NULL for a VARCHAR(255)[] column. Comparing
    // it would warn on every array column in the codebase.
    @Table({ tableName: 'Widgets', timestamps: false })
    class ArrayWidget extends Model {
      @PrimaryKey
      @Column(DataType.ARRAY(DataType.STRING))
      declare id: string[];
    }

    const findings = await findingsFor(
      [ArrayWidget],
      [
        col({
          column_name: 'id',
          udt_name: '_varchar',
          data_type: 'ARRAY',
          character_maximum_length: null,
          is_nullable: 'NO',
        }),
      ],
    );
    assert.deepStrictEqual(findings, [], JSON.stringify(findings));
  });

  it('still compares element base types, which Postgres does report', async () => {
    @Table({ tableName: 'Widgets', timestamps: false })
    class IntArrayWidget extends Model {
      @PrimaryKey
      @Column(DataType.ARRAY(DataType.INTEGER))
      declare id: number[];
    }

    const findings = await findingsFor(
      [IntArrayWidget],
      [
        col({
          column_name: 'id',
          udt_name: '_int2',
          data_type: 'ARRAY',
          character_maximum_length: null,
          is_nullable: 'NO',
        }),
      ],
    );
    assert.deepStrictEqual(kinds(findings), ['length-narrower']);
  });

  it('fails on a mismatched array element type', async () => {
    @Table({ tableName: 'Widgets', timestamps: false })
    class ArrayWidget extends Model {
      @PrimaryKey
      @Column(DataType.ARRAY(DataType.STRING))
      declare id: string[];
    }

    const findings = await findingsFor(
      [ArrayWidget],
      [col({ column_name: 'id', udt_name: '_int4', data_type: 'ARRAY', is_nullable: 'NO' })],
    );
    assert.deepStrictEqual(kinds(findings), ['type-mismatch']);
  });

  it('treats char and varchar as different types, not a capacity difference', async () => {
    const findings = await findingsFor(
      [StringWidget],
      [col({ column_name: 'id', udt_name: 'bpchar', data_type: 'character', is_nullable: 'NO' })],
    );
    assert.deepStrictEqual(kinds(findings), ['type-mismatch']);
  });
});

// --- Capacity: narrower fails, wider warns -----------------------------------

describe('length and precision', () => {
  it('fails when the database column is narrower than the model declares', async () => {
    const findings = await findingsFor(
      [StringWidget],
      [col({ column_name: 'id', character_maximum_length: 50, is_nullable: 'NO' })],
    );
    assert.deepStrictEqual(kinds(findings), ['length-narrower']);
    assert.strictEqual(findings[0].severity, 'error');
    assert.strictEqual(findings[0].actual, 'VARCHAR(50)');
    assert.strictEqual(findings[0].expected, 'VARCHAR(255)');
  });

  it('warns when the database column is wider', async () => {
    const findings = await findingsFor(
      [StringWidget],
      [col({ column_name: 'id', character_maximum_length: 500, is_nullable: 'NO' })],
    );
    assert.deepStrictEqual(kinds(findings), ['length-wider']);
    assert.strictEqual(findings[0].severity, 'warning');
  });

  it('treats unbounded text in the database as wider than a bounded varchar', async () => {
    const findings = await findingsFor(
      [StringWidget],
      [
        col({
          column_name: 'id',
          udt_name: 'text',
          data_type: 'text',
          character_maximum_length: null,
          is_nullable: 'NO',
        }),
      ],
    );
    assert.deepStrictEqual(kinds(findings), ['length-wider']);
  });

  it('fails when the model declares text but the database is a bounded varchar', async () => {
    @Table({ tableName: 'Widgets', timestamps: false })
    class TextWidget extends Model {
      @PrimaryKey
      @Column(DataType.TEXT)
      declare id: string;
    }

    const findings = await findingsFor(
      [TextWidget],
      [col({ column_name: 'id', character_maximum_length: 255, is_nullable: 'NO' })],
    );
    assert.deepStrictEqual(kinds(findings), ['length-narrower']);
  });

  it('fails on a smaller integer width in the database', async () => {
    const findings = await findingsFor(
      [IntegerWidget],
      [
        col({
          column_name: 'id',
          udt_name: 'int2',
          data_type: 'smallint',
          character_maximum_length: null,
          is_nullable: 'NO',
        }),
      ],
    );
    assert.deepStrictEqual(kinds(findings), ['length-narrower']);
    assert.strictEqual(findings[0].severity, 'error');
  });

  it('warns on a larger integer width in the database', async () => {
    const findings = await findingsFor(
      [IntegerWidget],
      [
        col({
          column_name: 'id',
          udt_name: 'int8',
          data_type: 'bigint',
          character_maximum_length: null,
          is_nullable: 'NO',
        }),
      ],
    );
    assert.deepStrictEqual(kinds(findings), ['length-wider']);
    assert.strictEqual(findings[0].severity, 'warning');
  });

  it('fails on reduced decimal scale even when precision matches', async () => {
    @Table({ tableName: 'Widgets', timestamps: false })
    class MoneyWidget extends Model {
      @PrimaryKey
      @Column(DataType.DECIMAL(10, 4))
      declare id: string;
    }

    const findings = await findingsFor(
      [MoneyWidget],
      [
        col({
          column_name: 'id',
          udt_name: 'numeric',
          data_type: 'numeric',
          character_maximum_length: null,
          numeric_precision: 10,
          numeric_scale: 2,
          is_nullable: 'NO',
        }),
      ],
    );
    assert.deepStrictEqual(kinds(findings), ['length-narrower']);
  });

  it('treats unconstrained numeric in the database as wider', async () => {
    @Table({ tableName: 'Widgets', timestamps: false })
    class MoneyWidget extends Model {
      @PrimaryKey
      @Column(DataType.DECIMAL(10, 2))
      declare id: string;
    }

    const findings = await findingsFor(
      [MoneyWidget],
      [
        col({
          column_name: 'id',
          udt_name: 'numeric',
          data_type: 'numeric',
          character_maximum_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_nullable: 'NO',
        }),
      ],
    );
    assert.deepStrictEqual(kinds(findings), ['length-wider']);
  });
});

// --- Nullability -------------------------------------------------------------

describe('compareNullability', () => {
  it('errors when the model requires a value the database allows to be null', () => {
    assert.strictEqual(compareNullability(false, false, true), 'code-stricter');
  });

  it('warns when the database requires a value the model treats as optional', () => {
    assert.strictEqual(compareNullability(true, false, false), 'db-stricter');
  });

  it('treats an omitted allowNull as Sequelize does, i.e. nullable', () => {
    assert.strictEqual(compareNullability(undefined, false, false), 'db-stricter');
    assert.strictEqual(compareNullability(undefined, false, true), 'ok');
  });

  it('treats a primary key as implicitly NOT NULL', () => {
    assert.strictEqual(compareNullability(undefined, true, false), 'ok');
    assert.strictEqual(compareNullability(undefined, true, true), 'code-stricter');
  });

  it('passes when both sides agree', () => {
    assert.strictEqual(compareNullability(false, false, false), 'ok');
    assert.strictEqual(compareNullability(true, false, true), 'ok');
  });
});

describe('nullability through validateSchema', () => {
  it('fails when a NOT NULL column in the model is nullable in the database', async () => {
    @Table({ tableName: 'Widgets', timestamps: false })
    class RequiredWidget extends Model {
      @PrimaryKey
      @Column(DataType.STRING)
      declare id: string;

      @Column({ type: DataType.STRING, allowNull: false })
      declare label: string;
    }

    const findings = await findingsFor(
      [RequiredWidget],
      [
        col({ column_name: 'id', is_nullable: 'NO' }),
        col({ column_name: 'label', is_nullable: 'YES' }),
      ],
    );
    assert.deepStrictEqual(kinds(findings), ['nullability-code-stricter']);
    assert.strictEqual(findings[0].severity, 'error');
    assert.strictEqual(findings[0].column, 'label');
  });

  it('only warns when the database is NOT NULL and the model is silent', async () => {
    @Table({ tableName: 'Widgets', timestamps: false })
    class SilentWidget extends Model {
      @PrimaryKey
      @Column(DataType.STRING)
      declare id: string;

      @Column(DataType.STRING)
      declare label: string;
    }

    const findings = await findingsFor(
      [SilentWidget],
      [
        col({ column_name: 'id', is_nullable: 'NO' }),
        col({ column_name: 'label', is_nullable: 'NO' }),
      ],
    );
    assert.deepStrictEqual(kinds(findings), ['nullability-db-stricter']);
    assert.strictEqual(findings[0].severity, 'warning');
  });
});

// --- Associations ------------------------------------------------------------

describe('associations', () => {
  it('produces no findings for association properties, only for real columns', async () => {
    @Table({ tableName: 'Owners', timestamps: false })
    class Owner extends Model {
      @PrimaryKey
      @Column(DataType.INTEGER)
      declare id: number;
    }

    @Table({ tableName: 'Widgets', timestamps: false })
    class OwnedWidget extends Model {
      @PrimaryKey
      @Column(DataType.STRING)
      declare id: string;

      @Column(DataType.INTEGER)
      declare ownerId: number;
    }

    const intCol = { data_type: 'integer', udt_name: 'int4', character_maximum_length: null };
    const findings = await findingsFor(
      [Owner, OwnedWidget],
      [
        col({ table_name: 'Owners', column_name: 'id', is_nullable: 'NO', ...intCol }),
        col({ column_name: 'id', is_nullable: 'NO' }),
        col({ column_name: 'ownerId', is_nullable: 'YES', ...intCol }),
      ],
    );
    assert.deepStrictEqual(findings, [], JSON.stringify(findings));
  });
});

// --- The startup gate --------------------------------------------------------

describe('assertSchemaMatches', () => {
  const logger = new Logger({ type: 'hidden' });

  const baseConfig = {
    schema: 'public',
    validateSchema: true,
    validateSchemaSeverity: 'error' as const,
    sync: false,
    alter: false,
    force: false,
  };

  function gateHarness(rows: FakeColumn[]) {
    return harness([IntegerWidget], rows).sequelize;
  }

  const goodRows = [
    col({
      column_name: 'id',
      udt_name: 'int4',
      data_type: 'integer',
      character_maximum_length: null,
      is_nullable: 'NO',
    }),
  ];
  const driftedRows = [col({ column_name: 'id', is_nullable: 'NO' })]; // varchar, model says INTEGER

  it('resolves when the schema matches', async () => {
    const report = await assertSchemaMatches(
      gateHarness(goodRows),
      baseConfig as any,
      logger as any,
    );
    assert.strictEqual(report?.errors.length, 0);
    assert.strictEqual(report?.tablesChecked, 1);
    assert.strictEqual(report?.columnsChecked, 1);
  });

  it('throws on drift so startup aborts', async () => {
    await expect(
      assertSchemaMatches(gateHarness(driftedRows), baseConfig as any, logger as any),
    ).rejects.toThrow(SchemaValidationError);
  });

  it('includes the offending column in the thrown message', async () => {
    const error = await assertSchemaMatches(
      gateHarness(driftedRows),
      baseConfig as any,
      logger as any,
    ).catch((e) => e as SchemaValidationError);
    assert.instanceOf(error, SchemaValidationError);
    assert.include((error as SchemaValidationError).message, '"Widgets"."id"');
    assert.strictEqual((error as SchemaValidationError).report.errors.length, 1);
  });

  it('reports without throwing when severity is warn', async () => {
    const report = await assertSchemaMatches(
      gateHarness(driftedRows),
      { ...baseConfig, validateSchemaSeverity: 'warn' } as any,
      logger as any,
    );
    assert.strictEqual(report?.errors.length, 1);
  });

  it('skips entirely when validation is disabled', async () => {
    const report = await assertSchemaMatches(
      gateHarness(driftedRows),
      { ...baseConfig, validateSchema: false } as any,
      logger as any,
    );
    assert.strictEqual(report, null);
  });

  for (const flag of ['sync', 'alter', 'force'] as const) {
    it(`skips when database.${flag} is set, since sync has just reshaped the schema`, async () => {
      const report = await assertSchemaMatches(
        gateHarness(driftedRows),
        { ...baseConfig, [flag]: true } as any,
        logger as any,
      );
      assert.strictEqual(report, null);
    });
  }
});

// --- Guards on the Sequelize internals this relies on ------------------------

describe('assumptions about Sequelize', () => {
  it('does not default allowNull, so an omitted value stays distinguishable', () => {
    // The three-way nullability check depends on this. If a Sequelize upgrade
    // starts defaulting allowNull to true, the 'omitted' and 'explicit true'
    // cases collapse and compareNullability's contract needs revisiting.
    const attributes = StringWidget.getAttributes() as Record<string, { allowNull?: boolean }>;
    assert.strictEqual(attributes.id.allowNull, undefined);
  });

  it('exposes normalizeDataType, which turns DataType constructors into instances', () => {
    const sequelize = new CoreSequelize({ dialect: 'postgres', logging: false });
    const normalize = (sequelize as any).normalizeDataType;
    assert.isFunction(normalize);
    assert.instanceOf(normalize.call(sequelize, DataTypes.VIRTUAL), DataTypes.VIRTUAL);
  });
});

/*
 * Not covered here, and called out in the plan as the acceptance test:
 * a testcontainers-backed suite that runs `db:migrate` against a fresh Postgres
 * and asserts validateSchema() returns zero errors against the real 52 models.
 * That needs Docker, so it belongs beside the other *.integration.test.ts
 * suites rather than in this unit file.
 */
