// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { QueryTypes, type QueryInterface } from 'sequelize';
import { type BootstrapConfig, DEFAULT_TENANT_ID } from '@citrineos/base';
import { Authorization, DefaultSequelizeInstance, Tenant } from '@dal/index.js';
import migration from '../../migrations/20260821120000-authorization-unique-constraint-nulls-not-distinct.js';

/**
 * Uniqueness on Authorizations was a unique INDEX over (tenantId, idToken, idTokenType). Postgres
 * treats NULLs in a unique index as distinct, and idTokenType is nullable, so the index permitted
 * unlimited copies of a token enrolled without a type. OCPP 1.6 resolves an idTag against every row
 * carrying that string and refuses once more than one is returned, so a duplicate deauthorises the
 * token permanently.
 *
 * The tests start from the pre-migration shape a deployed database is actually in, so the defect is
 * demonstrated on the same schema the migration then repairs.
 */
const TOKEN = 'DEPOT-TOKEN-1';
const OTHER_TENANT_ID = DEFAULT_TENANT_ID + 1;

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let queryInterface: QueryInterface;

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

  sequelizeInstance = DefaultSequelizeInstance.getInstance({
    database: {
      host: pgContainer.getHost(),
      port: pgContainer.getMappedPort(5432),
      database: 'citrineos_test',
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      sync: false,
      alter: false,
      force: false,
      maxRetries: 1,
      retryDelay: 100,
    },
  } as unknown as BootstrapConfig);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });
  queryInterface = sequelizeInstance.getQueryInterface();
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

/** Puts the table back into the shape 20260413000000 left it in: a unique index, not a constraint. */
async function restorePreMigrationShape() {
  await sequelizeInstance.query(
    'ALTER TABLE "Authorizations" DROP CONSTRAINT IF EXISTS "idToken_type"',
  );
  await sequelizeInstance.query(
    'ALTER TABLE "Authorizations" DROP CONSTRAINT IF EXISTS "Authorizations_idToken_idTokenType_tenantId_key"',
  );
  await sequelizeInstance.query('DROP INDEX IF EXISTS "idToken_type"');
  await sequelizeInstance.query(
    'CREATE UNIQUE INDEX "idToken_type" ON "Authorizations" ("tenantId", "idToken", "idTokenType")',
  );
}

function enrol(idToken: string, idTokenType: string | null, tenantId = DEFAULT_TENANT_ID) {
  return Authorization.create({
    idToken,
    idTokenType,
    status: 'Accepted',
    tenantId,
  } as never);
}

async function uniqueConstraintNames(): Promise<string[]> {
  const rows = await sequelizeInstance.query<{ constraint_name: string }>(
    `SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'Authorizations'
        AND constraint_type = 'UNIQUE'`,
    { type: QueryTypes.SELECT },
  );
  return rows.map((row) => row.constraint_name);
}

describe('Authorizations uniqueness across a nullable idTokenType', () => {
  beforeEach(async () => {
    await Authorization.destroy({ where: {}, truncate: true, cascade: true });
    await Tenant.destroy({ where: {}, truncate: true, cascade: true });
    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    await Tenant.create({ id: OTHER_TENANT_ID, name: 'B' } as never);
    await restorePreMigrationShape();
  });

  it('is not enforced by the pre-migration index when idTokenType is null', async () => {
    await enrol(TOKEN, null);

    await expect(enrol(TOKEN, null)).resolves.toBeDefined();

    const rows = await Authorization.findAll({ where: { idToken: TOKEN } });
    expect(rows).toHaveLength(2);
  });

  it('rejects the duplicate once migrated', async () => {
    await migration.up(queryInterface);
    await enrol(TOKEN, null);

    await expect(enrol(TOKEN, null)).rejects.toThrow();
  });

  it('still allows one token under two different types', async () => {
    // 2.0.1 resolves on the pair, so this remains a legitimate pair of rows.
    await migration.up(queryInterface);

    await enrol(TOKEN, 'MacAddress');

    await expect(enrol(TOKEN, 'Central')).resolves.toBeDefined();
  });

  it('still allows the same untyped token in two tenants', async () => {
    await migration.up(queryInterface);

    await enrol(TOKEN, null, DEFAULT_TENANT_ID);

    await expect(enrol(TOKEN, null, OTHER_TENANT_ID)).resolves.toBeDefined();
  });

  it('leaves uniqueness as a named constraint, which is what on_conflict resolves against', async () => {
    // Hasura resolves `on_conflict` against unique constraints; a unique index of the same name is
    // not one, so an upsert naming it fails at runtime.
    await migration.up(queryInterface);

    expect(await uniqueConstraintNames()).toContain('idToken_type');
  });

  it('refuses to migrate over existing duplicates, naming them', async () => {
    await enrol(TOKEN, null);
    await enrol(TOKEN, null);

    await expect(migration.up(queryInterface)).rejects.toThrow(/idTokenType: NULL, count: 2/);
  });

  it('restores the unique index on down', async () => {
    await migration.up(queryInterface);

    await migration.down(queryInterface);

    expect(await uniqueConstraintNames()).not.toContain('idToken_type');
    const [indexes] = await sequelizeInstance.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'Authorizations' AND indexname = 'idToken_type'`,
    );
    expect(indexes).toHaveLength(1);
  });
});
