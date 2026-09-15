// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { QueryTypes, Sequelize, type QueryInterface } from 'sequelize';
import {
  DUPLICATE_PREFIX_INDEXES,
  down,
  up,
} from '../../migrations/20260914130000-drop-duplicate-prefix-indexes.js';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations/', import.meta.url));
const INDEX_NAMES = DUPLICATE_PREFIX_INDEXES.map((index) => index.name);

let pgContainer: StartedTestContainer;
let sequelize: Sequelize;
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

  sequelize = new Sequelize('citrineos_test', 'test', 'test', {
    host: pgContainer.getHost(),
    port: pgContainer.getMappedPort(5432),
    dialect: 'postgres',
    logging: false,
  });
  queryInterface = sequelize.getQueryInterface();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.ts'))
    .sort();
  for (const file of files) {
    const migration = await import(`${MIGRATIONS_DIR}${file}`);
    await (migration.default ?? migration).up(queryInterface, Sequelize);
  }
}, 180_000);

afterAll(async () => {
  await sequelize?.close();
  await pgContainer?.stop();
});

async function indexColumnsOn(table: string): Promise<string[][]> {
  const rows = await sequelize.query<{ columns: string[] }>(
    `SELECT array_agg(a.attname::text ORDER BY k.ord) AS columns
       FROM pg_index x
       JOIN pg_class c ON c.oid = x.indrelid
       CROSS JOIN LATERAL unnest(x.indkey) WITH ORDINALITY AS k(attnum, ord)
       JOIN pg_attribute a ON a.attrelid = x.indrelid AND a.attnum = k.attnum
      WHERE c.oid = quote_ident(:table)::regclass
         OR c.oid IN (SELECT inhrelid FROM pg_inherits WHERE inhparent = quote_ident(:table)::regclass)
      GROUP BY x.indexrelid`,
    { replacements: { table }, type: QueryTypes.SELECT },
  );
  return rows.map((row) => row.columns);
}

async function existingIndexNames(): Promise<string[]> {
  const rows = await sequelize.query<{ indexname: string }>(
    'SELECT indexname FROM pg_indexes WHERE indexname IN (:names) ORDER BY indexname',
    { replacements: { names: INDEX_NAMES }, type: QueryTypes.SELECT },
  );
  return rows.map((row) => row.indexname);
}

async function planFor(sql: string): Promise<string> {
  return sequelize.transaction(async (transaction) => {
    await sequelize.query('SET LOCAL enable_seqscan = off', { transaction });
    const rows = await sequelize.query<{ 'QUERY PLAN': string }>(`EXPLAIN (COSTS OFF) ${sql}`, {
      type: QueryTypes.SELECT,
      transaction,
    });
    return rows.map((row) => row['QUERY PLAN']).join('\n');
  });
}

describe('duplicate prefix indexes', () => {
  it.each(DUPLICATE_PREFIX_INDEXES.map((index) => [index.table, index.columns[0]]))(
    'leaves %s with a composite index leading with %s and no single-column copy of it',
    async (table, column) => {
      const indexes = await indexColumnsOn(table);

      expect(indexes).not.toContainEqual([column]);
      expect(indexes.some((columns) => columns.length > 1 && columns[0] === column)).toBe(true);
    },
  );

  it.each([
    `SELECT "id" FROM "MeterValues" AS "MeterValue" WHERE "MeterValue"."transactionDatabaseId" = 1`,
    `SELECT "id" FROM "MeterValues" AS "MeterValue" WHERE "MeterValue"."transactionEventId" = 1`,
    `SELECT "id" FROM "TransactionEvents" AS "TransactionEvent" WHERE "TransactionEvent"."transactionDatabaseId" = 1`,
    `SELECT "id" FROM "EventData" AS "EventData" WHERE "EventData"."ocppConnectionName" = 'CS-001'`,
  ])('still answers %s from an index', async (sql) => {
    const plan = await planFor(sql);

    expect(plan).toMatch(/Index/);
    expect(plan).not.toContain('Seq Scan');
  });

  it('restores the dropped indexes on down and drops them again on a repeated up', async () => {
    await down(queryInterface);

    expect(await existingIndexNames()).toEqual([...INDEX_NAMES].sort());

    await up(queryInterface);
    await up(queryInterface);

    expect(await existingIndexNames()).toEqual([]);
  });
});
