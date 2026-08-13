// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Integration tests for the startup schema validator, against a real PostgreSQL.
 *
 * Two halves:
 *
 *  1. No false positives. The database is built from the drizzle declarations
 *     themselves (via drizzle-kit's programmatic push), then validated. Any finding
 *     means the validator disagrees with drizzle's own DDL for one of the 52 real
 *     tables — a bug in normalization or index handling, not real drift.
 *
 *  2. Detection. A purpose-built table is created deliberately wrong, one difference
 *     at a time, and each is asserted to produce exactly one finding of the right
 *     kind. A synthetic table keeps these fast and precise.
 *
 * The postgis image is required, not just conventional: ChargingStations.coordinates
 * and Locations.coordinates are `geometry(point)` columns, and the citext extension
 * is needed for Authorizations.idToken.
 */

import { registeredTables, tableMap } from '@dal/layers/drizzle/validation/registry.js';
import {
  validateDrizzleSchema,
  type SchemaFinding,
} from '@dal/layers/drizzle/validation/validateSchema.js';
import { formatDriftReport } from '@dal/layers/drizzle/validation/report.js';
import { citext } from '@dal/layers/drizzle/schema/columnTypes.js';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
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
import { pushSchema } from 'drizzle-kit/api';
import pg from 'pg';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let container: StartedTestContainer;
let pool: pg.Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  container = await new GenericContainer('postgis/postgis:16-3.4-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'citrineos_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
    .start();

  pool = new pg.Pool({
    host: container.getHost(),
    port: container.getMappedPort(5432),
    user: 'test',
    password: 'test',
    database: 'citrineos_test',
  });
  db = drizzle(pool);
}, 180_000);

afterAll(async () => {
  await pool?.end();
  await container?.stop();
});

/** Drops everything and reinstalls the extensions the schema depends on. */
async function resetDatabase(): Promise<void> {
  await db.execute(sql.raw('DROP SCHEMA public CASCADE; CREATE SCHEMA public;'));
  await db.execute(sql.raw('CREATE EXTENSION IF NOT EXISTS citext;'));
  await db.execute(sql.raw('CREATE EXTENSION IF NOT EXISTS postgis;'));
}

// ---------------------------------------------------------------------------
// 1. No false positives across the real schema
// ---------------------------------------------------------------------------

describe('the real drizzle schema validates clean against a database built from it', () => {
  beforeAll(async () => {
    await resetDatabase();

    const push = await pushSchema(
      // The nested barrel must be flattened: drizzle-kit only inspects the top
      // level of what it is given, and reports "no tables" rather than erroring.
      tableMap(),
      db,
      ['public'],
      // Without a table filter, postgis' own spatial_ref_sys table looks like a
      // table to drop alongside 52 tables to create, and drizzle-kit tries to
      // interactively ask whether that is a rename — which throws without a TTY.
      registeredTables().map((t) => t.name),
      ['postgis'],
    );
    await push.apply();
  }, 120_000);

  it('reports no findings', async () => {
    const findings = await validateDrizzleSchema(db);
    expect(findings, formatDriftReport(findings, 'strict')).toEqual([]);
  });

  it('reports no findings with default checking enabled', async () => {
    const findings = await validateDrizzleSchema(db, { checkDefaults: true });
    expect(findings, formatDriftReport(findings, 'strict')).toEqual([]);
  });

  it('validates all 52 tables quickly enough for startup', async () => {
    const startedAt = Date.now();
    await validateDrizzleSchema(db);
    expect(Date.now() - startedAt).toBeLessThan(2_000);
  });
});

// ---------------------------------------------------------------------------
// 2. Detection, one difference at a time
// ---------------------------------------------------------------------------

const probeTable = pgTable(
  'ValidatorProbe',
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
    uniqueIndex('validator_probe_token').on(t.idToken, t.tenantId),
    index('validator_probe_counter').on(t.counter),
  ],
);

const PROBE = [{ table: probeTable, name: 'ValidatorProbe' }];

const CREATE_TABLE = `CREATE TABLE "ValidatorProbe" (
  "id" serial PRIMARY KEY,
  "tags" varchar(255)[],
  "idToken" citext,
  "label" varchar(255),
  "payload" jsonb,
  "counter" integer,
  "bigCounter" bigint,
  "balance" numeric,
  "enabled" boolean DEFAULT false,
  "note" text,
  "tenantId" integer NOT NULL,
  "createdAt" timestamptz NOT NULL
);`;
const CREATE_UNIQUE_INDEX = `CREATE UNIQUE INDEX "validator_probe_token" ON "ValidatorProbe" ("idToken","tenantId");`;
const CREATE_INDEX = `CREATE INDEX "validator_probe_counter" ON "ValidatorProbe" ("counter");`;
const CORRECT_DDL = [CREATE_TABLE, CREATE_UNIQUE_INDEX, CREATE_INDEX];

/** Replaces one fragment of the correct DDL, asserting the fragment really existed. */
function withEdit(find: string, replace: string): string[] {
  return CORRECT_DDL.map((statement) => {
    if (!statement.includes(find)) return statement;
    return statement.replace(find, replace);
  });
}

async function applyAndValidate(ddl: string[]): Promise<SchemaFinding[]> {
  await resetDatabase();
  for (const statement of ddl) await db.execute(sql.raw(statement));
  return validateDrizzleSchema(db, { tables: PROBE });
}

describe('schema drift detection', () => {
  beforeEach(async () => {
    // Fail loudly if a fragment used by withEdit() ever stops matching.
    expect(CREATE_TABLE).toContain('"note" text');
  });

  it('accepts a correctly created table', async () => {
    const findings = await applyAndValidate(CORRECT_DDL);
    expect(findings, formatDriftReport(findings, 'strict')).toEqual([]);
  });

  it('detects a missing table', async () => {
    const findings = await applyAndValidate([]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'missingTable', table: 'ValidatorProbe' });
  });

  it('detects a missing column', async () => {
    const findings = await applyAndValidate(withEdit('  "note" text,\n', ''));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'missingColumn', column: 'note' });
  });

  it.each([
    ['citext narrowed to varchar', '"idToken" citext', '"idToken" varchar(255)', 'idToken'],
    ['varchar length changed', '"label" varchar(255)', '"label" varchar(500)', 'label'],
    [
      'timestamptz reduced to timestamp',
      '"createdAt" timestamptz',
      '"createdAt" timestamp',
      'createdAt',
    ],
    ['array flattened to scalar', '"tags" varchar(255)[]', '"tags" varchar(255)', 'tags'],
    ['integer widened to bigint', '"counter" integer', '"counter" bigint', 'counter'],
    ['text swapped for varchar', '"note" text', '"note" varchar(255)', 'note'],
  ])('detects a type mismatch: %s', async (_label, find, replace, column) => {
    const findings = await applyAndValidate(withEdit(find, replace));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'columnType', column });
  });

  it('accepts serial declared against an integer + sequence default', async () => {
    // drizzle says `serial`; PostgreSQL reports `integer` with a nextval default.
    const findings = await applyAndValidate(CORRECT_DDL);
    expect(findings.filter((f) => f.column === 'id')).toEqual([]);
  });

  it('detects a NOT NULL column that is nullable in the database', async () => {
    const findings = await applyAndValidate(
      withEdit('"tenantId" integer NOT NULL', '"tenantId" integer'),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'columnNullability', column: 'tenantId' });
  });

  it('detects a nullable column that is NOT NULL in the database', async () => {
    const findings = await applyAndValidate(
      withEdit('"note" text', `"note" text NOT NULL DEFAULT ''`),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'columnNullability', column: 'note' });
  });

  it('tolerates an undeclared nullable column', async () => {
    // drizzle names columns explicitly, so this is invisible to reads and writes.
    const findings = await applyAndValidate(
      withEdit('"note" text,', '"note" text,\n  "legacy" integer,'),
    );
    expect(findings).toEqual([]);
  });

  it('tolerates an undeclared NOT NULL column that has a default', async () => {
    const findings = await applyAndValidate(
      withEdit('"note" text,', '"note" text,\n  "legacy" integer NOT NULL DEFAULT 0,'),
    );
    expect(findings).toEqual([]);
  });

  it('rejects an undeclared NOT NULL column with no default', async () => {
    // This one genuinely breaks every insert, because drizzle omits the column.
    const findings = await applyAndValidate(
      withEdit('"note" text,', '"note" text,\n  "legacy" integer NOT NULL,'),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      kind: 'requiredColumnNotDeclared',
      column: 'legacy',
    });
  });

  it('detects a missing unique index and flags the correctness impact', async () => {
    const findings = await applyAndValidate(CORRECT_DDL.filter((s) => s !== CREATE_UNIQUE_INDEX));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      kind: 'missingIndex',
      index: 'validator_probe_token',
    });
    expect(findings[0].impact).toMatch(/uniqueness is NOT enforced/);
  });

  it('detects a missing non-unique index', async () => {
    const findings = await applyAndValidate(CORRECT_DDL.filter((s) => s !== CREATE_INDEX));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'missingIndex', index: 'validator_probe_counter' });
  });

  it('tolerates an extra index in the database', async () => {
    const findings = await applyAndValidate([
      ...CORRECT_DDL,
      `CREATE INDEX "validator_probe_extra" ON "ValidatorProbe" ("tenantId");`,
    ]);
    expect(findings).toEqual([]);
  });

  it('accepts an index that exists under the right name but the wrong columns', async () => {
    // Documented blind spot: index checking is existence-by-name only, so that the
    // WHERE predicates of partial indexes never have to be normalized.
    const findings = await applyAndValidate([
      ...CORRECT_DDL.filter((s) => s !== CREATE_INDEX),
      `CREATE INDEX "validator_probe_counter" ON "ValidatorProbe" ("tenantId");`,
    ]);
    expect(findings).toEqual([]);
  });

  it('reports several differences at once', async () => {
    const findings = await applyAndValidate([
      withEdit('"label" varchar(255)', '"label" varchar(500)')[0].replace('  "note" text,\n', ''),
      CREATE_UNIQUE_INDEX,
    ]);
    expect(findings.map((f) => f.kind).sort()).toEqual([
      'columnType',
      'missingColumn',
      'missingIndex',
    ]);
  });
});

// ---------------------------------------------------------------------------
// 3. Opt-in default checking
// ---------------------------------------------------------------------------

describe('default checking', () => {
  it('is off by default, so a dropped default is not reported', async () => {
    const findings = await applyAndValidate(
      withEdit('"enabled" boolean DEFAULT false', '"enabled" boolean'),
    );
    expect(findings).toEqual([]);
  });

  it('reports a dropped default when enabled', async () => {
    await resetDatabase();
    for (const statement of withEdit('"enabled" boolean DEFAULT false', '"enabled" boolean')) {
      await db.execute(sql.raw(statement));
    }

    const findings = await validateDrizzleSchema(db, { tables: PROBE, checkDefaults: true });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'columnDefault', column: 'enabled' });
  });

  it('never reports $defaultFn columns, which have no database default', async () => {
    // createdAt is populated in the application, so the database correctly has no
    // default. Comparing on `hasDefault` rather than a SQL default would make this
    // a false positive on every table.
    await resetDatabase();
    for (const statement of CORRECT_DDL) await db.execute(sql.raw(statement));

    const findings = await validateDrizzleSchema(db, { tables: PROBE, checkDefaults: true });
    expect(findings.filter((f) => f.column === 'createdAt')).toEqual([]);
  });
});
