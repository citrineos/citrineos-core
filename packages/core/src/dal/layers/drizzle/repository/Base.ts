// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SystemConfig } from '@citrineos/types';
import { and, count, eq, type Column, type InferSelectModel } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgTable, PgTransaction } from 'drizzle-orm/pg-core';
import EventEmitter from 'events';
import { Logger, type ILogObj } from 'tslog';
import { DefaultDrizzleInstance } from '../util.js';

// Every CitrineOS table shares these two columns — used to implement common
// query patterns (findById, deleteById, etc.) in the base class without casting.
export type CitrineTable = PgTable & {
  id: Column;
  tenantId: Column;
};

/**
 * A database executor: either the pooled connection or an open transaction.
 */
export type DrizzleExecutor = NodePgDatabase | PgTransaction<any, any, any>;

/**
 * Carries the open transaction plus the events produced inside it.
 *
 * Events are buffered rather than emitted inline: a listener must not observe a
 * 'created' for a row that a later statement rolls back. {@link DrizzleRepository.withAtomicWrite}
 * flushes the buffer only after the commit succeeds, and drops it on rollback.
 */
export interface DrizzleWriteContext {
  db: DrizzleExecutor;
  events: Array<{ name: string; payload: unknown }>;
}

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
  config: SystemConfig;
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

  /**
   * Runs `fn` inside a single database transaction, committing when it resolves and
   * rolling back when it throws. Pass the supplied context to the shared write
   * helpers so their statements join the transaction.
   */
  protected async withAtomicWrite<T>(fn: (ctx: DrizzleWriteContext) => Promise<T>): Promise<T> {
    const events: DrizzleWriteContext['events'] = [];

    const result = await this.db.transaction(async (tx) => fn({ db: tx, events }));

    for (const event of events) {
      this.emit(event.name, event.payload);
    }
    return result;
  }

  // Emits immediately outside a transaction; buffers for post-commit inside one.
  private raise(ctx: DrizzleWriteContext | undefined, name: string, payload: unknown) {
    if (ctx) {
      ctx.events.push({ name, payload });
    } else {
      this.emit(name, payload);
    }
  }

  // Returns the tenant isolation predicate for WHERE clauses.
  // Undefined in schema-per-tenant mode because isolation lives at the schema level.
  // Protected, so subclasses can apply it to sibling tables they join against.
  protected tenantFilter(table: CitrineTable, tenantId: number) {
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
  protected async insert(
    tenantId: number,
    values: object,
    ctx?: DrizzleWriteContext,
  ): Promise<TDto> {
    const table = this.getTable(tenantId);

    const rows = (await ((ctx?.db ?? this.db).insert(table as any) as any)
      .values({ ...values, tenantId })
      .returning()) as InferSelectModel<TTable>[];

    const dto = this.toDto(rows[0]);
    this.raise(ctx, 'created', [dto]);
    return dto;
  }

  // values is typed as object for the same reason as insert above.
  async updateById(
    tenantId: number,
    id: number,
    values: object,
    ctx?: DrizzleWriteContext,
  ): Promise<TDto | undefined> {
    const table = this.getTable(tenantId);
    const where = and(eq(table.id, id), this.tenantFilter(table, tenantId));

    const rows = (await ((ctx?.db ?? this.db).update(table as any) as any)
      .set(values)
      .where(where)
      .returning()) as InferSelectModel<TTable>[];

    if (!rows[0]) return undefined;
    const dto = this.toDto(rows[0]);
    this.raise(ctx, 'updated', [dto]);
    return dto;
  }

  async deleteById(
    tenantId: number,
    id: number,
    ctx?: DrizzleWriteContext,
  ): Promise<TDto | undefined> {
    const table = this.getTable(tenantId);
    const where = and(eq(table.id, id), this.tenantFilter(table, tenantId));

    const rows = (await ((ctx?.db ?? this.db).delete(table as any) as any)
      .where(where)
      .returning()) as InferSelectModel<TTable>[];

    if (!rows[0]) return undefined;
    const dto = this.toDto(rows[0]);
    this.raise(ctx, 'deleted', [dto]);
    return dto;
  }
}
