// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { PaymentDatabase } from './database.js';

/**
 * This app's migrations: plain SQL that drizzle-kit generates from src/db/schema.ts, next to this
 * package's dist/. Any runner that applies SQL files in order can apply them; this app uses
 * Drizzle's.
 */
export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../db/migrations', import.meta.url));

/**
 * Where Drizzle records the migrations it applied: a table of this app's own, so it never mixes
 * with Core's migration history.
 */
export const MIGRATIONS_TABLE = { schema: 'public', table: 'PaymentMigrations' } as const;

/**
 * Applies this app's migrations that have not run yet. Core's migrations have to have run first:
 * the payment tables reference Core's.
 */
export async function migratePaymentTables(db: PaymentDatabase): Promise<void> {
  await migrate(db, {
    migrationsFolder: MIGRATIONS_FOLDER,
    migrationsSchema: MIGRATIONS_TABLE.schema,
    migrationsTable: MIGRATIONS_TABLE.table,
  });
}
