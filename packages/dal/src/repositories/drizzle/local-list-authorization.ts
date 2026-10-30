// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { LocalListAuthorizationDto } from '@citrineos/types';
import { and, inArray } from 'drizzle-orm';
import {
  type LocalListAuthorizationEntity,
  type LocalListAuthorizationEntityInsert,
  localListAuthorizationTable,
  tenantLocalListAuthorizationTable,
} from '../../db/drizzle/schema/local-list-authorization.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository, type DrizzleWriteContext } from './base.js';

export type LocalListAuthorizationInput = Omit<LocalListAuthorizationEntityInsert, 'tenantId'>;

export const TOMBSTONE_STATUS = 'Invalid';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external LocalListAuthorizationDto contract.
export function toLocalListAuthorizationDto(
  entity: LocalListAuthorizationEntity,
): LocalListAuthorizationDto {
  const dto: Explicit<LocalListAuthorizationDto> = {
    id: entity.id,
    allowedConnectorTypes: entity.allowedConnectorTypes ?? undefined,
    disallowedEvseIdPrefixes: entity.disallowedEvseIdPrefixes ?? undefined,
    idToken: entity.idToken ?? '',
    idTokenType: entity.idTokenType,
    additionalInfo: entity.additionalInfo,
    status: entity.status ?? '',
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    cacheExpiryDateTime: entity.cacheExpiryDateTime
      ? entity.cacheExpiryDateTime.toISOString()
      : null,
    chargingPriority: entity.chargingPriority,
    language1: entity.language1,
    language2: entity.language2,
    personalMessage: entity.personalMessage,
    groupAuthorizationId: entity.groupAuthorizationId,
    // Relation, not a scalar column.
    groupAuthorization: undefined,
    authorizationId: entity.authorizationId ?? undefined,
    // Relation, not a scalar column.
    authorization: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleLocalListAuthorizationRepository extends DrizzleRepository<
  typeof localListAuthorizationTable,
  LocalListAuthorizationDto
> {
  protected getTable(tenantId: number): typeof localListAuthorizationTable {
    return this.useTenantSchema
      ? tenantLocalListAuthorizationTable(tenantId)
      : localListAuthorizationTable;
  }

  protected toDto(row: LocalListAuthorizationEntity): LocalListAuthorizationDto {
    return toLocalListAuthorizationDto(row);
  }

  async createLocalListAuthorization(
    tenantId: number,
    values: LocalListAuthorizationInput,
    ctx?: DrizzleWriteContext,
  ): Promise<LocalListAuthorizationDto> {
    return this.insert(tenantId, values, ctx);
  }

  async readByIds(
    tenantId: number,
    ids: number[],
    ctx?: DrizzleWriteContext,
  ): Promise<LocalListAuthorizationDto[]> {
    if (ids.length === 0) {
      return [];
    }
    const table = this.getTable(tenantId);
    const rows = (await (ctx?.db ?? this.db)
      .select()
      .from(table)
      .where(and(inArray(table.id, ids), this.tenantFilter(table, tenantId)))
      .orderBy(table.id)) as LocalListAuthorizationEntity[];
    return rows.map((row) => toLocalListAuthorizationDto(row));
  }
}
