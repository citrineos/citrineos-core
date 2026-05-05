// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * NestJS migration runner. Runs drizzle-kit-format `.sql` migrations
 * from `nestjs/migrations/`, tracked in `__drizzle_migrations`.
 *
 * The SQL content is ported 1:1 from the legacy `core/migrations/*.ts`
 * sequelize migrations — same shape, same names, same effects. The
 * port lives at `scripts/port-legacy-migrations.ts`. Complex bodies that
 * iterated over `information_schema` (e.g. `add-charging-station-pk-id`)
 * are wrapped in PL/pgSQL `DO $$ ... $$` blocks so the loop logic stays
 * inside the database.
 *
 * `npm run diff:schema` is the gate: it boots Postgres, runs these
 * migrations, then diffs the resulting schema against the drizzle entity
 * metadata. CI fails on any unexpected drift.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { join } from 'path';
import { buildConfig } from '@modules/config/app-config.module';

async function main() {
  const config = buildConfig();
  const migrationsFolder = config.database.migrationsFolder ?? join(__dirname, '..', 'migrations');

  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: config.database.name,
  });

  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder });
    console.log('Migrations applied successfully');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
