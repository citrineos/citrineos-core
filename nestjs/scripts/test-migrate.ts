// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Smoke test for `npm run migrate`. Boots a fresh Postgres testcontainer,
 * runs nestjs's drizzle-kit migrator against it, then asserts the
 * resulting table count matches what the legacy migrations produce.
 *
 * Run:  cd nestjs && npx ts-node -r tsconfig-paths/register --project tsconfig.json scripts/test-migrate.ts
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { Client } from 'pg';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';

const NESTJS_ROOT = join(__dirname, '..');

async function bootPostgres(): Promise<{ container: StartedTestContainer; port: number }> {
  const container = await new GenericContainer('postgis/postgis:16-3.5')
    .withEnvironment({
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_DB: 'postgres',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('ready to accept connections', 2))
    .withStartupTimeout(120_000)
    .start();
  return { container, port: container.getMappedPort(5432) };
}

async function countPublicTables(port: number): Promise<number> {
  const client = new Client({
    host: 'localhost',
    port,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });
  await client.connect();
  try {
    const res = await client.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    return Number(res.rows[0]?.c ?? 0);
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  console.log('▶ Booting Postgres for nestjs migrate smoke test…');
  const { container, port } = await bootPostgres();
  try {
    console.log('▶ Running nestjs `npm run migrate` against fresh DB…');
    execSync('npm run migrate', {
      cwd: NESTJS_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        BOOTSTRAP_CITRINEOS_DATABASE_HOST: 'localhost',
        BOOTSTRAP_CITRINEOS_DATABASE_PORT: String(port),
        BOOTSTRAP_CITRINEOS_DATABASE_USERNAME: 'postgres',
        BOOTSTRAP_CITRINEOS_DATABASE_PASSWORD: 'postgres',
        BOOTSTRAP_CITRINEOS_DATABASE_NAME: 'postgres',
      },
    });

    const count = await countPublicTables(port);
    console.log(`\n✅ Migrate succeeded. Public tables: ${count}`);
    if (count < 50) {
      throw new Error(`Expected ≥50 tables (legacy currently runs to 54); got ${count}`);
    }
  } finally {
    await container.stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
