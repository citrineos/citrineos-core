// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { DrizzleNetworkAlertRepository } from '@dal/repositories/drizzle/network-alert.js';
import { DrizzleNetworkAlertConfigRepository } from '@dal/repositories/drizzle/network-alert-config.js';
import { networkAlertRepositoryContract } from '../../utils/network-alert-repository-contract.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

let h: PgHarness;
let drizzlePool: pg.Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  h = await startPgHarness();
  // Own pool: the DefaultDrizzleInstance singleton exposes no way to close it.
  drizzlePool = new pg.Pool({
    host: h.config.database.host,
    port: h.config.database.port,
    database: h.config.database.database,
    user: h.config.database.username,
    password: h.config.database.password,
  });
  // Stopping the container terminates idle connections (Postgres 57P01); unhandled, pg escalates
  // the pool 'error' to an uncaught exception.
  drizzlePool.on('error', () => {});
  db = drizzle(drizzlePool);
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await h?.stop();
}, 90_000);

beforeEach(async () => {
  await resetDb(h);
});

const deps = () => ({ config: h.config, drizzleInstance: db });

describe('DrizzleNetworkAlertRepository', () => {
  networkAlertRepositoryContract(
    () => new DrizzleNetworkAlertRepository(deps()),
    () => new DrizzleNetworkAlertConfigRepository(deps()),
  );
});
