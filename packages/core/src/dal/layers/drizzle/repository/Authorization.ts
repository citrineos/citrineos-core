// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  AuthorizationDto,
  AuthorizationStatusEnumType,
  AuthorizationWhitelistEnumType,
  IdTokenEnumType,
} from '@citrineos/types';
import {
  type AuthorizationEntity,
  authorizationTable,
  tenantAuthorizationTable,
} from '../schema/Authorization.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';
import type { AuthorizationQuerystring, IAuthorizationRepository } from '@/dal/index.js';
import { and, eq, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { type TariffEntity, tariffTable } from '../schema/Tariff.js';
import { toTariffDto } from './Tariff.js';

// Self-join target for the group Authorization a token belongs to.
const groupAuthorizationTable = alias(authorizationTable, 'groupAuthorization');

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external AuthorizationDto contract.
export function toAuthorizationDto(entity: AuthorizationEntity): AuthorizationDto {
  const dto: Explicit<AuthorizationDto> = {
    id: entity.id,
    allowedConnectorTypes: entity.allowedConnectorTypes ?? undefined,
    disallowedEvseIdPrefixes: entity.disallowedEvseIdPrefixes ?? undefined,
    idToken: entity.idToken ?? '',
    idTokenType: entity.idTokenType as IdTokenEnumType | null,
    additionalInfo: entity.additionalInfo,
    status: entity.status as AuthorizationStatusEnumType,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    cacheExpiryDateTime: entity.cacheExpiryDateTime
      ? entity.cacheExpiryDateTime.toISOString()
      : null,
    chargingPriority: entity.chargingPriority,
    language1: entity.language1,
    language2: entity.language2,
    personalMessage: entity.personalMessage,
    // customData is not persisted as a column.
    customData: undefined,
    concurrentTransaction: entity.concurrentTransaction ?? undefined,
    isPrepaid: entity.isPrepaid ?? undefined,
    // Sequelize DECIMAL → numeric returns string; DTO contract is number.
    prepaidBalance: entity.prepaidBalance != null ? Number(entity.prepaidBalance) : null,
    realTimeAuth: entity.realTimeAuth as AuthorizationWhitelistEnumType | null,
    realTimeAuthLastAttempt: entity.realTimeAuthLastAttempt,
    realTimeAuthTimeout: entity.realTimeAuthTimeout,
    realTimeAuthUrl: entity.realTimeAuthUrl ?? undefined,
    tenantPartnerId: entity.tenantPartnerId,
    // Relation, not a scalar column.
    tenantPartner: undefined,
    groupAuthorizationId: entity.groupAuthorizationId,
    tariffId: entity.tariffId,
    // Relation, not a scalar column.
    groupAuthorization: undefined,
    tenantId: entity.tenantId,
    // Relation, not a scalar column.
    tenant: undefined,
    // Relation, not a scalar column.
    tariff: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleAuthorizationRepository
  extends DrizzleRepository<typeof authorizationTable, AuthorizationDto>
  implements IAuthorizationRepository
{
  protected getTable(tenantId: number): typeof authorizationTable {
    return this.useTenantSchema ? tenantAuthorizationTable(tenantId) : authorizationTable;
  }

  protected toDto(row: AuthorizationEntity): AuthorizationDto {
    return toAuthorizationDto(row);
  }

  private createAuthorizationConditions(tenantId: number, query: AuthorizationQuerystring) {
    const conditions = [];

    if (!this.useTenantSchema) {
      conditions.push(eq(authorizationTable.tenantId, tenantId));
    }

    if (query.idToken) {
      conditions.push(eq(authorizationTable.idToken, query.idToken));
    }
    if (query.type) {
      conditions.push(eq(authorizationTable.idTokenType, query.type));
    }
    if (query.id) {
      conditions.push(eq(authorizationTable.id, query.id));
    }

    return conditions;
  }

  // ─── IAuthorizationRepository methods ────────────────────────────────────

  async readAllByQuerystring(
    tenantId: number,
    query: AuthorizationQuerystring,
  ): Promise<AuthorizationDto[]> {
    const conditions = this.createAuthorizationConditions(tenantId, query);

    // The group Authorization is joined rather than left to the caller: it is what
    // TransactionService turns into IdTokenInfo.groupIdToken.
    const rows = await this.db
      .select({ authorization: authorizationTable, groupAuthorization: groupAuthorizationTable })
      .from(authorizationTable)
      .leftJoin(
        groupAuthorizationTable,
        eq(authorizationTable.groupAuthorizationId, groupAuthorizationTable.id),
      )
      .where(and(...conditions));

    return rows.map(({ authorization, groupAuthorization }) => ({
      ...this.toDto(authorization as AuthorizationEntity),
      groupAuthorization: groupAuthorization
        ? this.toDto(groupAuthorization as AuthorizationEntity)
        : undefined,
    }));
  }

  async readOnlyOneByQuerystring(
    tenantId: number,
    query: AuthorizationQuerystring,
  ): Promise<AuthorizationDto | undefined> {
    const dtos = await this.readAllByQuerystring(tenantId, query);

    if (dtos.length > 1) {
      throw new Error(`More than one value found for query: ${JSON.stringify(query)}`);
    }

    return dtos[0];
  }

  async findAllAuthorizationsWithTariffs(tenantId: number): Promise<AuthorizationDto[]> {
    // Inner join: callers read authorization.tariff and skip the row when it is unset, so an
    // authorization whose tariffId no longer resolves must not be returned as though it had one.
    const rows = await this.db
      .select({ authorization: authorizationTable, tariff: tariffTable })
      .from(authorizationTable)
      .innerJoin(tariffTable, eq(authorizationTable.tariffId, tariffTable.id))
      .where(
        and(eq(authorizationTable.tenantId, tenantId), isNotNull(authorizationTable.tariffId)),
      );

    return rows.map(({ authorization, tariff }) => ({
      ...this.toDto(authorization as AuthorizationEntity),
      tariff: toTariffDto(tariff as TariffEntity),
    }));
  }
}
