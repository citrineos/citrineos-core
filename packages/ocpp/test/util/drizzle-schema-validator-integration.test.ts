// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { registeredTables, tableMap } from '@citrineos/dal';
import { validateDrizzleSchema } from '@/util/index.js';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { pushSchema } from 'drizzle-kit/api';
import pg from 'pg';

/**
 * Asserts the Drizzle validator has no false positives against the real schema.
 *
 * The database is built from the drizzle declarations themselves — drizzle-kit's
 * programmatic push emits the DDL — and then validated. Any finding means the
 * validator disagrees with drizzle's own DDL for one of the 52 tables, i.e. a bug
 * in canonicalization or index handling rather than real drift. The drift cases
 * below then confirm each finding kind and severity against live ALTERs.
 *
 * The postgis image is required rather than conventional: ChargingStations and
 * Locations both declare `geometry(point)` coordinates, and Authorizations
 * declares citext.
 */

let pgContainer: StartedTestContainer;
let pool: pg.Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:16-3.4-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'citrineos_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
    .start();

  pool = new pg.Pool({
    host: pgContainer.getHost(),
    port: pgContainer.getMappedPort(5432),
    user: 'test',
    password: 'test',
    database: 'citrineos_test',
  });
  db = drizzle(pool);

  await db.execute(sql.raw('CREATE EXTENSION IF NOT EXISTS citext;'));
  await db.execute(sql.raw('CREATE EXTENSION IF NOT EXISTS postgis;'));

  const push = await pushSchema(
    // The nested schema barrel has to be flattened: drizzle-kit only inspects the
    // top level of what it is given, and reports "no tables" rather than erroring.
    tableMap(),
    db,
    ['public'],
    // Without a table filter, postgis' own spatial_ref_sys looks like a table to
    // drop alongside 52 to create, and drizzle-kit tries to ask interactively
    // whether that is a rename — which throws when there is no TTY.
    registeredTables().map((t) => t.name),
    ['postgis'],
  );
  await push.apply();
}, 180_000);

afterAll(async () => {
  await pool?.end();
  await pgContainer?.stop();
});

describe('DrizzleSchemaValidatorIntegration', () => {
  describe('validateDrizzleSchema against a schema built from the declarations', () => {
    it('reports no errors', async () => {
      const report = await validateDrizzleSchema(db, { schema: 'public' });
      // Printed rather than summarized: if this fails, the finding messages name
      // the exact table, column, expected type and actual type.
      expect(report.errors, JSON.stringify(report.errors, null, 2)).toEqual([]);
    });

    it('reports no warnings either', async () => {
      const report = await validateDrizzleSchema(db, { schema: 'public' });
      expect(report.warnings, JSON.stringify(report.warnings, null, 2)).toEqual([]);
    });

    it('checks every registered table', async () => {
      const report = await validateDrizzleSchema(db, { schema: 'public' });
      expect(report.tablesChecked).toBe(registeredTables().length);
      expect(report.columnsChecked).toBeGreaterThan(0);
    });

    it('reports nothing with default checking enabled', async () => {
      const report = await validateDrizzleSchema(db, { schema: 'public', checkDefaults: true });
      expect(report.findings, JSON.stringify(report.findings, null, 2)).toEqual([]);
    });

    it('completes fast enough to sit in the startup path', async () => {
      const startedAt = Date.now();
      await validateDrizzleSchema(db, { schema: 'public' });
      expect(Date.now() - startedAt).toBeLessThan(2_000);
    });
  });

  describe('validateDrizzleSchema detects drift', () => {
    it('flags a column the declarations name but the database has dropped', async () => {
      await db.execute(sql.raw('ALTER TABLE "Boots" DROP COLUMN "heartbeatInterval"'));
      try {
        const report = await validateDrizzleSchema(db, { schema: 'public' });
        const finding = report.errors.find(
          (f) => f.table === 'Boots' && f.column === 'heartbeatInterval',
        );
        expect(finding?.kind).toBe('missing-column');
      } finally {
        await db.execute(sql.raw('ALTER TABLE "Boots" ADD COLUMN "heartbeatInterval" integer'));
      }
    });

    it('flags a column narrowed below what the declarations permit', async () => {
      await db.execute(sql.raw('ALTER TABLE "Boots" ALTER COLUMN "status" TYPE varchar(5)'));
      try {
        const report = await validateDrizzleSchema(db, { schema: 'public' });
        const finding = report.errors.find((f) => f.table === 'Boots' && f.column === 'status');
        expect(finding?.kind).toBe('length-narrower');
      } finally {
        await db.execute(sql.raw('ALTER TABLE "Boots" ALTER COLUMN "status" TYPE varchar(255)'));
      }
    });

    it('only warns about a column wider than the declarations', async () => {
      await db.execute(sql.raw('ALTER TABLE "Boots" ALTER COLUMN "status" TYPE varchar(500)'));
      try {
        const report = await validateDrizzleSchema(db, { schema: 'public' });
        expect(report.errors).toEqual([]);
        const finding = report.warnings.find((f) => f.table === 'Boots' && f.column === 'status');
        expect(finding?.kind).toBe('length-wider');
      } finally {
        await db.execute(sql.raw('ALTER TABLE "Boots" ALTER COLUMN "status" TYPE varchar(255)'));
      }
    });

    it('flags citext narrowed to varchar', async () => {
      // The case Authorizations.idToken exists to protect: a varchar column would
      // silently make idToken lookups case-sensitive.
      await db.execute(
        sql.raw('ALTER TABLE "Authorizations" ALTER COLUMN "idToken" TYPE varchar(255)'),
      );
      try {
        const report = await validateDrizzleSchema(db, { schema: 'public' });
        const finding = report.errors.find(
          (f) => f.table === 'Authorizations' && f.column === 'idToken',
        );
        expect(finding?.kind).toBe('length-narrower');
      } finally {
        await db.execute(
          sql.raw('ALTER TABLE "Authorizations" ALTER COLUMN "idToken" TYPE citext'),
        );
      }
    });

    it('flags a NOT NULL dropped under a notNull declaration', async () => {
      await db.execute(sql.raw('ALTER TABLE "Boots" ALTER COLUMN "tenantId" DROP NOT NULL'));
      try {
        const report = await validateDrizzleSchema(db, { schema: 'public' });
        const finding = report.errors.find((f) => f.table === 'Boots' && f.column === 'tenantId');
        expect(finding?.kind).toBe('nullability-code-stricter');
      } finally {
        await db.execute(sql.raw('ALTER TABLE "Boots" ALTER COLUMN "tenantId" SET NOT NULL'));
      }
    });

    it('only warns about a column the database has but the declarations do not', async () => {
      await db.execute(sql.raw('ALTER TABLE "Boots" ADD COLUMN "legacyColumn" integer'));
      try {
        const report = await validateDrizzleSchema(db, { schema: 'public' });
        expect(report.errors).toEqual([]);
        const finding = report.warnings.find(
          (f) => f.table === 'Boots' && f.column === 'legacyColumn',
        );
        expect(finding?.kind).toBe('extra-column');
      } finally {
        await db.execute(sql.raw('ALTER TABLE "Boots" DROP COLUMN "legacyColumn"'));
      }
    });

    it('errors on an undeclared NOT NULL column with no default', async () => {
      // drizzle omits undeclared columns from INSERT, so this breaks every write.
      await db.execute(
        sql.raw('ALTER TABLE "Boots" ADD COLUMN "requiredLegacy" integer NOT NULL DEFAULT 0'),
      );
      await db.execute(sql.raw('ALTER TABLE "Boots" ALTER COLUMN "requiredLegacy" DROP DEFAULT'));
      try {
        const report = await validateDrizzleSchema(db, { schema: 'public' });
        const finding = report.errors.find(
          (f) => f.table === 'Boots' && f.column === 'requiredLegacy',
        );
        expect(finding?.kind).toBe('extra-column');
        expect(finding?.message).toMatch(/every INSERT/);
      } finally {
        await db.execute(sql.raw('ALTER TABLE "Boots" DROP COLUMN "requiredLegacy"'));
      }
    });

    it('errors on a dropped unique index', async () => {
      const report = await validateDrizzleSchema(db, { schema: 'public' });
      expect(report.findings).toEqual([]);

      await db.execute(sql.raw('DROP INDEX "authorizations_id_token_type"'));
      try {
        const drifted = await validateDrizzleSchema(db, { schema: 'public' });
        const finding = drifted.errors.find(
          (f) => f.table === 'Authorizations' && f.index === 'authorizations_id_token_type',
        );
        expect(finding?.kind).toBe('missing-index');
        expect(finding?.message).toMatch(/uniqueness is NOT enforced/);
      } finally {
        await db.execute(
          sql.raw(
            'CREATE UNIQUE INDEX "authorizations_id_token_type" ON "Authorizations" ("idToken","idTokenType","tenantId")',
          ),
        );
      }
    });

    it('only warns about a dropped non-unique index', async () => {
      await db.execute(sql.raw('DROP INDEX "variable_attributes_ocpp_connection_name"'));
      try {
        const report = await validateDrizzleSchema(db, { schema: 'public' });
        expect(report.errors).toEqual([]);
        const finding = report.warnings.find(
          (f) => f.index === 'variable_attributes_ocpp_connection_name',
        );
        expect(finding?.kind).toBe('missing-index');
      } finally {
        await db.execute(
          sql.raw(
            'CREATE INDEX "variable_attributes_ocpp_connection_name" ON "VariableAttributes" ("ocppConnectionName")',
          ),
        );
      }
    });

    it('flags a dropped table', async () => {
      await db.execute(sql.raw('DROP TABLE "ChargingStationSequences"'));
      try {
        const report = await validateDrizzleSchema(db, { schema: 'public' });
        const finding = report.errors.find((f) => f.table === 'ChargingStationSequences');
        expect(finding?.kind).toBe('missing-table');
        // Reported once for the table, not once per declared column.
        expect(report.errors.filter((f) => f.table === 'ChargingStationSequences')).toHaveLength(1);
      } finally {
        const push = await pushSchema(
          tableMap(),
          db,
          ['public'],
          registeredTables().map((t) => t.name),
          ['postgis'],
        );
        await push.apply();
      }
    });

    it('ignores tables the database has but drizzle has not adopted', async () => {
      // During the migration to Drizzle most tables are in this state, so this has
      // to stay silent or the gate is unusable.
      await db.execute(sql.raw('CREATE TABLE "NotADrizzleTable" ("id" serial PRIMARY KEY)'));
      try {
        const report = await validateDrizzleSchema(db, { schema: 'public' });
        expect(report.findings, JSON.stringify(report.findings, null, 2)).toEqual([]);
      } finally {
        await db.execute(sql.raw('DROP TABLE "NotADrizzleTable"'));
      }
    });
  });
});
