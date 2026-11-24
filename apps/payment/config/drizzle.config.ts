// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'drizzle-kit';

/**
 * For `pnpm db:generate`, which writes a migration for a change to src/db/schema.ts. It reads the
 * compiled schema, so build first. Only this app's tables are in it: Core's own migrations create
 * Core's tables.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './dist/db/schema.js',
  out: './db/migrations',
});
