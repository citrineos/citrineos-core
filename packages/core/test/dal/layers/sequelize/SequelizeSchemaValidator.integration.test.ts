// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import { DefaultSequelizeInstance } from '@dal/index.js';
import { validateSequelizeSchema } from '@dal/layers/sequelize/SequelizeSchemaValidator.js';

// ---------------------------------------------------------------------------
// Acceptance coverage for the startup schema gate, against every real model.
//
// The schema here is produced by `sequelize.sync()`, so its column types are by
// construction exactly what the models declare. That makes this a test of the
// validator's type canonicalization rather than of the migrations: a type
// finding means the validator and Postgres disagree about a column type this
// codebase actually uses, which would be a false positive at startup.
//
// Nullability is the one place where sync() is not a mirror of the models: it
// derives NOT NULL from `primaryKey`, which the validator deliberately does not
// when the attribute also says allowNull:true. See the exemption on the warnings
// test below.
//
// Still not covered: whether `apps/ocpp-server/migrations` produces the same
// shape as the models. That needs `sequelize-cli db:migrate` against the
// container instead of sync(), and is the check that will surface real drift.
// ---------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;

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

  const dbConfig = {
    database: {
      host: pgContainer.getHost(),
      port: pgContainer.getMappedPort(5432),
      database: 'citrineos_test',
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      schema: 'public',
      sync: false,
      alter: false,
      force: false,
      maxRetries: 1,
      retryDelay: 100,
    },
  } as unknown as BootstrapConfig;

  sequelizeInstance = DefaultSequelizeInstance.getInstance(dbConfig);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance.close();
  await pgContainer.stop();
});

describe('SequelizeSchemaValidatorIntegration', () => {
  describe('validateSequelizeSchema against a synchronized schema', () => {
    it('reports no errors', async () => {
      const report = await validateSequelizeSchema(sequelizeInstance, { schema: 'public' });
      // Printed rather than summarized: if this fails, the finding messages name
      // the exact table, column, expected type and actual type.
      expect(report.errors, JSON.stringify(report.errors, null, 2)).toEqual([]);
      expect(report.tablesChecked).toBeGreaterThan(0);
      expect(report.columnsChecked).toBeGreaterThan(0);
    });

    const nullablePrimaryKeyColumns = (): Set<string> => {
      const exempt = new Set<string>();
      for (const model of Object.values(sequelizeInstance.models)) {
        const tableName = model.getTableName();
        const table = typeof tableName === 'string' ? tableName : tableName.tableName;
        for (const [attrName, attr] of Object.entries(model.getAttributes())) {
          if (attr.primaryKey === true && attr.allowNull === true) {
            exempt.add(`${table}.${attr.field ?? attrName}`);
          }
        }
      }
      return exempt;
    };

    it('reports no warnings beyond the primary keys Sequelize marks nullable', async () => {
      const report = await validateSequelizeSchema(sequelizeInstance, { schema: 'public' });
      const exempt = nullablePrimaryKeyColumns();
      const unexpected = report.warnings.filter(
        (f) => !(f.kind === 'nullability-db-stricter' && exempt.has(`${f.table}.${f.column}`)),
      );

      expect(unexpected, JSON.stringify(unexpected, null, 2)).toEqual([]);
      expect(exempt.size).toBeGreaterThan(0);
    });
  });

  describe('validateSequelizeSchema detects drift', () => {
    it('flags a column the models declare but the database has dropped', async () => {
      await sequelizeInstance.query('ALTER TABLE "Boots" DROP COLUMN "heartbeatInterval"');
      try {
        const report = await validateSequelizeSchema(sequelizeInstance, { schema: 'public' });
        const finding = report.errors.find(
          (f) => f.table === 'Boots' && f.column === 'heartbeatInterval',
        );
        expect(finding?.kind).toBe('missing-column');
      } finally {
        await sequelizeInstance.query('ALTER TABLE "Boots" ADD COLUMN "heartbeatInterval" INTEGER');
      }
    });

    it('flags a column narrowed below what the models declare', async () => {
      await sequelizeInstance.query('ALTER TABLE "Boots" ALTER COLUMN "status" TYPE varchar(5)');
      try {
        const report = await validateSequelizeSchema(sequelizeInstance, { schema: 'public' });
        const finding = report.errors.find((f) => f.table === 'Boots' && f.column === 'status');
        expect(finding?.kind).toBe('length-narrower');
      } finally {
        await sequelizeInstance.query(
          'ALTER TABLE "Boots" ALTER COLUMN "status" TYPE varchar(255)',
        );
      }
    });

    it('flags a NOT NULL dropped under an allowNull:false column', async () => {
      await sequelizeInstance.query('ALTER TABLE "Boots" ALTER COLUMN "tenantId" DROP NOT NULL');
      try {
        const report = await validateSequelizeSchema(sequelizeInstance, { schema: 'public' });
        const finding = report.errors.find((f) => f.table === 'Boots' && f.column === 'tenantId');
        expect(finding?.kind).toBe('nullability-code-stricter');
      } finally {
        await sequelizeInstance.query('ALTER TABLE "Boots" ALTER COLUMN "tenantId" SET NOT NULL');
      }
    });

    it('only warns about a column the database has but no model declares', async () => {
      await sequelizeInstance.query('ALTER TABLE "Boots" ADD COLUMN "legacyColumn" INTEGER');
      try {
        const report = await validateSequelizeSchema(sequelizeInstance, { schema: 'public' });
        expect(report.errors).toEqual([]);
        const finding = report.warnings.find(
          (f) => f.table === 'Boots' && f.column === 'legacyColumn',
        );
        expect(finding?.kind).toBe('extra-column');
      } finally {
        await sequelizeInstance.query('ALTER TABLE "Boots" DROP COLUMN "legacyColumn"');
      }
    });
  });
});
