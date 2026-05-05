// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Schema parity audit. Boots a single Postgres testcontainer, runs the
 * legacy `sequelize-cli db:migrate` against it (the same migrations
 * `nestjs npm run migrate` defers to), and diffs the resulting schema
 * against what our drizzle entities under `src/database/entities/*` declare.
 *
 *   • tables in LEGACY but missing from drizzle entities  (entity drift)
 *   • tables in drizzle entities but missing from LEGACY  (typed shadow lying)
 *   • per-table column drift in either direction
 *
 * Run:  npm run diff:schema
 *
 * The script is the parity gate for entity↔schema correctness now that
 * `nestjs/migrations/` is gone (legacy migrations are the source of truth;
 * see `src/migrate.ts`).
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { Client } from 'pg';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { schema } from '../src/database/schema';

const MONOREPO_ROOT = join(__dirname, '..', '..');

interface Snapshot {
  tables: Set<string>;
  columns: Map<string, Set<string>>;
}

const ALLOWED_LEGACY_ONLY_TABLES: ReadonlySet<string> = new Set([
  // Legacy ORM tracking table — sequelize-cli internal, not part of the
  // OCPP schema.
  'SequelizeMeta',
  // Postgis spatial-reference catalog. Created by the postgis extension
  // initialization, not by an OCPP migration.
  'spatial_ref_sys',
]);

const ALLOWED_DRIZZLE_ONLY_TABLES: ReadonlySet<string> = new Set([
  // Nestjs-side feature additions that have no legacy counterpart.
  // Each is documented as deliberate per the parity roadmap.
  // Per-token authorization restriction rules (allowed connector types,
  // disallowed EVSE prefixes) — nestjs surfaces these as a typed table
  // rather than the CSV-on-Authorization legacy approach.
  'AuthorizationRestrictions',
  // DB-backed file metadata for FileStorage when LocalFS isn't enough.
  'FileStorageEntries',
  // Per-sample signed-meter-value audit (paired with the
  // SignedMeterValueValidator that legacy has via util/security).
  'MeterValueSignatures',
  // Coarser session-level OCPP log, distinct from per-frame OcppMessages.
  'OcppFirmwareUpdate',
  'OcppLog',
  // Outbound CSMS-initiated CALL tracking — legacy has request-side
  // logging via OCPPMessages but no dedicated tracking table.
  'RemoteCommands',
  // Multi-party RBAC primitive — paired with TenantPartners.
  'TenantUserRoles',
]);

const ALLOWED_LEGACY_ONLY_COLUMNS: ReadonlySet<string> = new Set([
  // Columns legacy carries that we deliberately don't expose in the
  // drizzle entity (e.g. legacy-only audit fields). Add with a citation
  // when surfaced.
]);

const ALLOWED_DRIZZLE_ONLY_COLUMNS: ReadonlySet<string> = new Set([
  // Columns the drizzle entity exposes that legacy doesn't have. Should
  // be empty — typed shadows shouldn't invent columns.
]);

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

async function snapshotLegacy(port: number): Promise<Snapshot> {
  const client = new Client({
    host: 'localhost',
    port,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });
  await client.connect();
  try {
    const tables = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name`,
    );
    const cols = await client.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, column_name`,
    );
    const out: Snapshot = { tables: new Set(), columns: new Map() };
    for (const r of tables.rows) out.tables.add(r.table_name);
    for (const r of cols.rows) {
      if (!out.columns.has(r.table_name)) out.columns.set(r.table_name, new Set());
      out.columns.get(r.table_name)!.add(r.column_name);
    }
    return out;
  } finally {
    await client.end();
  }
}

function snapshotDrizzleEntities(): Snapshot {
  const out: Snapshot = { tables: new Set(), columns: new Map() };
  for (const value of Object.values(schema)) {
    let cfg;
    try {
      cfg = getTableConfig(value);
    } catch {
      continue;
    }
    if (!cfg || !cfg.name) continue;
    out.tables.add(cfg.name);
    const set = new Set<string>();
    for (const col of cfg.columns) set.add(col.name);
    out.columns.set(cfg.name, set);
  }
  return out;
}

function sortedDiff<T extends string>(a: Set<T>, b: Set<T>): T[] {
  const out: T[] = [];
  for (const v of a) if (!b.has(v)) out.push(v);
  return out.sort() as T[];
}

async function main(): Promise<void> {
  console.log('▶ Booting Postgres for legacy schema…');
  const { container, port } = await bootPostgres();
  let legacy: Snapshot;
  try {
    console.log('▶ Running legacy sequelize migrations…');
    execSync('npm run migrate', {
      cwd: MONOREPO_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        BOOTSTRAP_CITRINEOS_DATABASE_HOST: 'localhost',
        BOOTSTRAP_CITRINEOS_DATABASE_PORT: String(port),
        BOOTSTRAP_CITRINEOS_DATABASE_USERNAME: 'postgres',
        BOOTSTRAP_CITRINEOS_DATABASE_PASSWORD: 'postgres',
        BOOTSTRAP_CITRINEOS_DATABASE_NAME: 'postgres',
        BOOTSTRAP_CITRINEOS_DATABASE_DIALECT: 'postgres',
      },
    });
    legacy = await snapshotLegacy(port);
  } finally {
    await container.stop();
  }

  const drizzle = snapshotDrizzleEntities();

  const missingTables = sortedDiff(legacy.tables, drizzle.tables);
  const extraTables = sortedDiff(drizzle.tables, legacy.tables);
  const unexpectedMissingTables = missingTables.filter((t) => !ALLOWED_LEGACY_ONLY_TABLES.has(t));
  const unexpectedExtraTables = extraTables.filter((t) => !ALLOWED_DRIZZLE_ONLY_TABLES.has(t));
  const allowedMissing = missingTables.filter((t) => ALLOWED_LEGACY_ONLY_TABLES.has(t));

  console.log('\n══════════════════════════════════════════════════');
  console.log(`Legacy tables (post-migrate): ${legacy.tables.size}`);
  console.log(`Drizzle entity tables:        ${drizzle.tables.size}`);
  console.log('══════════════════════════════════════════════════\n');

  console.log(
    `▶ ${unexpectedMissingTables.length} unexpected legacy table(s) missing from drizzle entities:`,
  );
  for (const t of unexpectedMissingTables) console.log(`  − ${t}`);
  if (allowedMissing.length > 0) {
    console.log(`   (allowlisted: ${allowedMissing.join(', ')})`);
  }

  console.log(
    `\n▶ ${unexpectedExtraTables.length} unexpected drizzle entity table(s) not in legacy:`,
  );
  for (const t of unexpectedExtraTables) console.log(`  + ${t}`);

  // Per-table column diff (only for tables present in both).
  const both = [...legacy.tables].filter((t) => drizzle.tables.has(t)).sort();
  console.log(`\n▶ Per-table column drift:`);
  let unexpectedColumnDriftCount = 0;
  for (const t of both) {
    const lcols = legacy.columns.get(t) ?? new Set<string>();
    const dcols = drizzle.columns.get(t) ?? new Set<string>();
    const missingCols = sortedDiff(lcols, dcols);
    const extraCols = sortedDiff(dcols, lcols);
    const unexpectedMissing = missingCols.filter(
      (c) => !ALLOWED_LEGACY_ONLY_COLUMNS.has(`${t}.${c}`),
    );
    const unexpectedExtra = extraCols.filter((c) => !ALLOWED_DRIZZLE_ONLY_COLUMNS.has(`${t}.${c}`));
    unexpectedColumnDriftCount += unexpectedMissing.length + unexpectedExtra.length;
    if (unexpectedMissing.length === 0 && unexpectedExtra.length === 0) continue;
    console.log(`  • ${t}`);
    for (const c of unexpectedMissing) console.log(`      − ${c} (legacy has, entity missing)`);
    for (const c of unexpectedExtra) console.log(`      + ${c} (entity has, legacy missing)`);
  }
  if (unexpectedColumnDriftCount === 0) {
    console.log('  ✅ No unexpected column drift');
  }

  const failed =
    unexpectedMissingTables.length > 0 ||
    unexpectedExtraTables.length > 0 ||
    unexpectedColumnDriftCount > 0;
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
