// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { QueryTypes, Sequelize, type QueryInterface } from 'sequelize';
import {
  DEVICE_MODEL_AND_LOCATION_INDEXES,
  down,
  up,
} from '../../migrations/20260914120000-add-device-model-and-location-indexes.js';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations/', import.meta.url));
const INDEX_NAMES = DEVICE_MODEL_AND_LOCATION_INDEXES.map((index) => index.name);

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

async function indexColumns(): Promise<Record<string, string[]>> {
  const rows = await sequelize.query<{ name: string; columns: string[] }>(
    `SELECT i.relname AS name, array_agg(a.attname::text ORDER BY k.ord) AS columns
       FROM pg_class i
       JOIN pg_index x ON x.indexrelid = i.oid
       CROSS JOIN LATERAL unnest(x.indkey) WITH ORDINALITY AS k(attnum, ord)
       JOIN pg_attribute a ON a.attrelid = x.indrelid AND a.attnum = k.attnum
      WHERE i.relname IN (:names)
      GROUP BY i.relname`,
    { replacements: { names: INDEX_NAMES }, type: QueryTypes.SELECT },
  );
  return Object.fromEntries(rows.map((row) => [row.name, row.columns]));
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

describe('device model and location lookup indexes', () => {
  it('creates each index on the columns its lookup filters by', async () => {
    expect(await indexColumns()).toEqual(
      Object.fromEntries(DEVICE_MODEL_AND_LOCATION_INDEXES.map((i) => [i.name, i.columns])),
    );
  });

  it.each([
    [
      'variable_attributes_tenant_connection_component_variable',
      `SELECT "id" FROM "VariableAttributes" AS "VariableAttribute" WHERE "VariableAttribute"."tenantId" = 1 AND "VariableAttribute"."ocppConnectionName" = 'CS-001' AND "VariableAttribute"."variableId" = 4 AND "VariableAttribute"."componentId" = 1 AND "VariableAttribute"."type" = 'Actual' LIMIT 1`,
    ],
    [
      'variable_statuses_variable_attribute_id_created_at',
      `SELECT "id" FROM "VariableStatuses" AS "VariableStatus" WHERE "VariableStatus"."variableAttributeId" = 4 AND "VariableStatus"."status" = 'Accepted' AND "VariableStatus"."tenantId" = 1 ORDER BY "VariableStatus"."createdAt" DESC LIMIT 1`,
    ],
    [
      'connectors_tenant_id_ocpp_connection_name_connector_id',
      `SELECT "id" FROM "Connectors" AS "Connector" WHERE "Connector"."tenantId" = 1 AND "Connector"."ocppConnectionName" = 'CS-001' AND "Connector"."connectorId" = 1 LIMIT 1`,
    ],
    [
      'evses_tenant_id_ocpp_connection_name_evse_type_id',
      `SELECT "id" FROM "Evses" AS "Evse" WHERE "Evse"."tenantId" = 1 AND "Evse"."ocppConnectionName" = 'CS-001' AND "Evse"."evseTypeId" = 1 LIMIT 1`,
    ],
    [
      'charging_station_sequences_tenant_id_ocpp_connection_name_type',
      `SELECT "id" FROM "ChargingStationSequences" AS "ChargingStationSequence" WHERE "ChargingStationSequence"."tenantId" = 1 AND "ChargingStationSequence"."ocppConnectionName" = 'CS-001' AND "ChargingStationSequence"."type" = 'transactionId' LIMIT 1`,
    ],
  ])('lets the planner answer the repository lookup with %s', async (indexName, sql) => {
    expect(await planFor(sql)).toContain(indexName);
  });

  it('removes exactly its own indexes on down and restores them on a repeated up', async () => {
    await down(queryInterface);

    expect(await indexColumns()).toEqual({});

    await up(queryInterface);
    await up(queryInterface);

    expect(Object.keys(await indexColumns()).sort()).toEqual([...INDEX_NAMES].sort());
  });
});
