// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig } from '@citrineos/base';
import { and, count, eq, type Column, type InferSelectModel } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgTable } from 'drizzle-orm/pg-core';
import EventEmitter from 'events';
import { type ILogObj, Logger } from 'tslog';
import { DefaultDrizzleInstance } from '../util.js';

// Every CitrineOS table shares these two columns — used to implement common
// query patterns (findById, deleteById, etc.) in the base class without casting.
export type CitrineTable = PgTable & {
  id: Column;
  tenantId: Column;
};

/**
 * Dependencies every Drizzle repository takes, mirroring
 * {@link SequelizeRepositoryDependencies}. A single destructured object — rather
 * than positional parameters — so repositories can be registered with awilix
 * `asClass` under `InjectionMode.PROXY`, which constructs with exactly one
 * argument: the cradle.
 *
 * Every name here must be registered in the container. Destructuring reads the
 * property off the cradle proxy, and an unregistered name throws
 * AwilixResolutionError even where the type marks it optional — optionality only
 * covers direct construction (tests, RepositoryStore).
 */
export interface DrizzleRepositoryDependencies {
  config: BootstrapConfig;
  logger?: Logger<ILogObj>;
  drizzleInstance?: NodePgDatabase;
  useTenantSchema?: boolean;
}

export abstract class DrizzleRepository<TTable extends CitrineTable, TDto> extends EventEmitter {
  protected readonly db: NodePgDatabase;
  protected readonly logger: Logger<ILogObj>;

  // When true, queries target a per-tenant Postgres schema ("tenant_X"."Table")
  // and the tenantId column filter is omitted — the schema is the isolation boundary.
  protected readonly useTenantSchema: boolean;

  constructor({
    config,
    logger,
    drizzleInstance,
    useTenantSchema = false,
  }: DrizzleRepositoryDependencies) {
    super();
    this.db = drizzleInstance ?? DefaultDrizzleInstance.getInstance(config, logger);
    this.logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    this.useTenantSchema = useTenantSchema;
  }

  // Subclasses return either the public-schema table (row-level tenancy) or a
  // schema-qualified table (schema-per-tenant). Every shared method calls this,
  // so tenancy mode is transparent to callers.
  protected abstract getTable(tenantId: number): TTable;

  // Subclasses map raw DB rows to clean DTO objects — no ORM leakage.
  protected abstract toDto(row: InferSelectModel<TTable>): TDto;

  // Returns the tenant isolation predicate for WHERE clauses.
  // Undefined in schema-per-tenant mode because isolation lives at the schema level.
  private tenantFilter(table: TTable, tenantId: number) {
    return this.useTenantSchema ? undefined : eq(table.tenantId, tenantId);
  }

  // ─── Shared read methods ──────────────────────────────────────────────────

  async findById(tenantId: number, id: number): Promise<TDto | undefined> {
    const table = this.getTable(tenantId);
    const filter = this.tenantFilter(table, tenantId);
    const where = filter ? and(eq(table.id, id), filter) : eq(table.id, id);

    // `as any` on table: Drizzle's from() has internal generic constraints
    // (TableLikeHasEmptySelection) that don't resolve for bounded generic PgTables.
    // The public return type is fully typed via TDto.
    const rows = (await this.db
      .select()
      .from(table as any)
      .where(where)
      .limit(1)) as InferSelectModel<TTable>[];

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async findAll(tenantId: number): Promise<TDto[]> {
    const table = this.getTable(tenantId);
    const filter = this.tenantFilter(table, tenantId);

    const rows = (
      filter
        ? await this.db
            .select()
            .from(table as any)
            .where(filter)
        : await this.db.select().from(table as any)
    ) as InferSelectModel<TTable>[];

    return rows.map((row) => this.toDto(row));
  }

  async exists(tenantId: number, id: number): Promise<boolean> {
    const table = this.getTable(tenantId);
    const filter = this.tenantFilter(table, tenantId);
    const where = filter ? and(eq(table.id, id), filter) : eq(table.id, id);

    const rows = await this.db
      .select({ id: table.id as any })
      .from(table as any)
      .where(where)
      .limit(1);

    return rows.length > 0;
  }

  async countAll(tenantId: number): Promise<number> {
    const table = this.getTable(tenantId);
    const filter = this.tenantFilter(table, tenantId);

    const result = filter
      ? await this.db
          .select({ count: count() })
          .from(table as any)
          .where(filter)
      : await this.db.select({ count: count() }).from(table as any);

    return result[0]?.count ?? 0;
  }

  // ─── Shared write methods (all emit events) ───────────────────────────────

  // values is typed as object here because InferInsertModel<TTable> with a generic
  // TTable hits TypeScript inference limits. Subclasses expose typed create methods
  // (e.g. createByStationId) that call this internally with the correct shape.
  protected async insert(tenantId: number, values: object): Promise<TDto> {
    const table = this.getTable(tenantId);

    const rows = (await (this.db.insert(table as any) as any)
      .values({ ...values, tenantId })
      .returning()) as InferSelectModel<TTable>[];

    const dto = this.toDto(rows[0]);
    this.emit('created', [dto]);
    return dto;
  }

  // values is typed as object for the same reason as insert above.
  async updateById(tenantId: number, id: number, values: object): Promise<TDto | undefined> {
    const table = this.getTable(tenantId);
    const filter = this.tenantFilter(table, tenantId);
    const where = filter ? and(eq(table.id, id), filter) : eq(table.id, id);

    const rows = (await (this.db.update(table as any) as any)
      .set(values)
      .where(where)
      .returning()) as InferSelectModel<TTable>[];

    if (!rows[0]) return undefined;
    const dto = this.toDto(rows[0]);
    this.emit('updated', [dto]);
    return dto;
  }

  async deleteById(tenantId: number, id: number): Promise<TDto | undefined> {
    const table = this.getTable(tenantId);
    const filter = this.tenantFilter(table, tenantId);
    const where = filter ? and(eq(table.id, id), filter) : eq(table.id, id);

    const rows = (await (this.db.delete(table as any) as any)
      .where(where)
      .returning()) as InferSelectModel<TTable>[];

    if (!rows[0]) return undefined;
    const dto = this.toDto(rows[0]);
    this.emit('deleted', [dto]);
    return dto;
  }
}
