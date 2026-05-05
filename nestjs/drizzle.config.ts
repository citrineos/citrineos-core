// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Config } from 'drizzle-kit';

/**
 * Drizzle-kit config — only used by `npm run drizzle:studio` for the
 * dev-time schema explorer. Migration management lives elsewhere:
 * `npm run migrate` defers to the legacy `sequelize-cli` against
 * `core/migrations/` (single source of truth, see `src/migrate.ts`).
 *
 * `drizzle-kit generate` is intentionally NOT wired — generating drizzle
 * SQL from entity diffs would create migrations that conflict with the
 * legacy ones tracked in `SequelizeMeta`.
 */
export default {
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  dbCredentials: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'postgres',
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
  },
} satisfies Config;
