// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { is } from 'drizzle-orm';
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';
import * as schemaModules from './schema/index.js';

export interface RegisteredTable {
  table: PgTable;
  /** Physical table name in PostgreSQL, e.g. `Authorizations`. */
  name: string;
}

function isPgTable(value: unknown): value is PgTable {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) !== null &&
    is(value, PgTable)
  );
}

/**
 * Every `pgTable` exported from `schema/index.js` — the drizzle counterpart of
 * `sequelize.models`, and the definition of what drizzle owns. Adding a schema file
 * to that barrel is what opts its table into startup validation.
 *
 * The `tenantXTable(tenantId)` helpers are functions rather than table values, so
 * schema-per-tenant tables are excluded structurally rather than by name. The
 * explicit non-`public` schema check is defense in depth, in case a schema-qualified
 * table is ever exported directly.
 *
 * @param modules Injectable for tests; defaults to the real schema barrel.
 *                Accepts the barrel directly — no flattening helper needed.
 */
export function registeredTables(
  modules: Record<string, unknown> = schemaModules,
): RegisteredTable[] {
  const tables: RegisteredTable[] = [];
  const seen = new Set<string>();

  const collect = (container: Record<string, unknown>, depth: number): void => {
    for (const value of Object.values(container)) {
      if (isPgTable(value)) {
        const config = getTableConfig(value);
        if (config.schema && config.schema !== 'public') continue;
        if (seen.has(config.name)) continue;

        seen.add(config.name);
        tables.push({ table: value, name: config.name });
      } else if (depth > 0 && value !== null && typeof value === 'object') {
        collect(value as Record<string, unknown>, depth - 1);
      }
    }
  };

  collect(modules, 1);

  return tables.sort((a, b) => a.name.localeCompare(b.name));
}

export function registeredTableNames(modules?: Record<string, unknown>): string[] {
  return registeredTables(modules).map((t) => t.name);
}
