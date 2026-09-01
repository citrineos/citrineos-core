// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ITenantRepository } from '@dal/repositories/repositories.js';
import type { TenantDto } from '@citrineos/types';
import { eq, isNotNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import EventEmitter from 'events';
import { type ILogObj, Logger } from 'tslog';
import { DefaultDrizzleInstance } from '../../db/drizzle/util.js';
import type { DrizzleRepositoryDependencies } from './Base.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { type TenantEntity, tenantTable } from '../../db/drizzle/schema/Tenant.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
export function toTenantDto(entity: TenantEntity): TenantDto {
  const dto: Explicit<TenantDto> = {
    id: entity.id,
    name: entity.name,
    url: entity.url ?? null,
    countryCode: entity.countryCode ?? null,
    partyId: entity.partyId ?? null,
    serverProfileOCPI: entity.serverProfileOCPI ?? null,
    isUserTenant: entity.isUserTenant,
    maxChargingStations: entity.maxChargingStations ?? null,
    tenantWebsocketServerPath: entity.tenantWebsocketServerPath ?? null,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

// Tenant is a tenancy-root table with no tenantId column, so it does not extend
// DrizzleRepository (whose shared methods filter on / inject tenantId). It talks
// to the DB directly while keeping the same DTO-mapping and event-emitting shape.
export class DrizzleTenantRepository extends EventEmitter implements ITenantRepository {
  protected readonly db: NodePgDatabase;
  protected readonly logger: Logger<ILogObj>;

  // Takes the same dependency object as DrizzleRepository, minus useTenantSchema:
  // the tenancy-root table has no per-tenant schema variant.
  constructor({ config, logger, drizzleInstance }: DrizzleRepositoryDependencies) {
    super();
    this.db = drizzleInstance ?? DefaultDrizzleInstance.getInstance(config, logger);
    this.logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async createTenant(tenant: TenantDto): Promise<TenantDto> {
    const rows = await this.db
      .insert(tenantTable)
      .values({
        name: tenant.name,
        isUserTenant: tenant.isUserTenant ?? false,
        url: tenant.url ?? null,
      })
      .returning();
    const dto = toTenantDto(rows[0]);
    this.emit('created', [dto]);
    return dto;
  }

  async readByKey(_tenantId: number, key: string | number): Promise<TenantDto | undefined> {
    // Tenant is keyed by its own `id`; there is no separate tenantId filter.
    const rows = await this.db
      .select()
      .from(tenantTable)
      .where(eq(tenantTable.id, Number(key)))
      .limit(1);
    return rows[0] ? toTenantDto(rows[0]) : undefined;
  }

  async readByWebsocketServerPath(path: string): Promise<TenantDto | undefined> {
    const rows = await this.db
      .select()
      .from(tenantTable)
      .where(eq(tenantTable.tenantWebsocketServerPath, path))
      .limit(1);
    return rows[0] ? toTenantDto(rows[0]) : undefined;
  }

  async readAllWithWebsocketServerPath(): Promise<TenantDto[]> {
    const rows = await this.db
      .select()
      .from(tenantTable)
      .where(isNotNull(tenantTable.tenantWebsocketServerPath));
    return rows.map(toTenantDto);
  }

  async updateWebsocketServerPath(
    tenantId: number,
    path: string | null,
  ): Promise<TenantDto | undefined> {
    const rows = await this.db
      .update(tenantTable)
      .set({ tenantWebsocketServerPath: path, updatedAt: new Date() })
      .where(eq(tenantTable.id, tenantId))
      .returning();
    if (!rows[0]) {
      return undefined;
    }
    const dto = toTenantDto(rows[0]);
    this.emit('updated', [dto]);
    return dto;
  }
}

export default DrizzleTenantRepository;
