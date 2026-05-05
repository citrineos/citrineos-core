import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';

/**
 * Provides a transaction-scoped Drizzle instance pinned to a tenant's PostgreSQL schema.
 *
 * Multi-tenancy strategy: each tenant gets its own PostgreSQL schema (tenant_1, tenant_2, …).
 * All tables are identical across schemas — Drizzle's table definitions stay schema-agnostic
 * and we use `SET LOCAL search_path` inside a transaction to route queries to the right schema.
 *
 * Usage in repositories:
 *
 *   async findByStationId(tenantId: number, stationId: string) {
 *     return this.tenantDb.withTenant(tenantId, (db) =>
 *       db.select().from(schema.boots).where(eq(schema.boots.stationId, stationId))
 *     );
 *   }
 *
 * Current state: the `search_path` is set to `public` until per-tenant schema migration is
 * implemented (CREATE SCHEMA tenant_N + table replication). Row-level `tenantId` columns
 * provide isolation in the interim. When schemas are ready, change the search_path line only.
 */
@Injectable()
export class TenantDrizzleService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  /**
   * Executes `fn` inside a transaction whose search_path is pinned to the tenant schema.
   * Falls back to `public` schema until per-tenant schemas are provisioned.
   */
  async withTenant<T>(tenantId: number, fn: (db: DrizzleDb) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      // TODO: Change to `tenant_${tenantId}` once schema provisioning is implemented.
      // Until then, `public` gives the same behaviour as today (row-level tenantId filtering).
      const schemaName = `public`;
      await tx.execute(sql`SET LOCAL search_path = ${sql.raw(schemaName)}, public`);
      return fn(tx as unknown as DrizzleDb);
    });
  }

  /** Raw access to the global pool (for global tables not scoped to a tenant). */
  get global(): DrizzleDb {
    return this.db;
  }
}
