// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { customType } from 'drizzle-orm/pg-core';

/**
 * PostgreSQL `citext` — case-insensitive text, provided by the `citext` extension.
 *
 * drizzle-orm has no built-in citext column type, so it is declared here as a
 * custom type. Declaring it (rather than approximating it with `varchar`) keeps the
 * TypeScript schema an accurate description of the database: the schema validator
 * compares `citext` to `citext` instead of reporting permanent drift, and
 * `drizzle-kit generate` will emit `citext` if these schema files ever become the
 * source of truth for migrations.
 *
 * Note that the extension itself is not managed by drizzle. Any database with a
 * citext column must have run `CREATE EXTENSION IF NOT EXISTS citext;` first — for
 * CitrineOS that happens in migration `20260113000000-normalize-id-token-case`.
 *
 * The `data`/`driverData` type parameters are required: without them drizzle-zod
 * infers a permissive schema for the column, which would silently weaken the
 * generated entity schemas.
 */
export const citext = customType<{ data: string; driverData: string }>({
  dataType: () => 'citext',
});
