// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { getDatabaseConfigForEnv } from '../config/loader.js';
import { connectDatabase } from './database.js';
import { MIGRATIONS_FOLDER, migratePaymentTables } from './migrate.js';

/**
 * `pnpm db:migrate`: applies this app's pending migrations to the database the server would use
 * (the DB_* variables, for APP_ENV).
 */
async function main(): Promise<void> {
  const connection = await connectDatabase({
    database: getDatabaseConfigForEnv(process.env.APP_ENV),
  });
  try {
    await migratePaymentTables(connection.db);
    console.log(`Payment migrations applied from ${MIGRATIONS_FOLDER}`);
  } finally {
    await connection.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
