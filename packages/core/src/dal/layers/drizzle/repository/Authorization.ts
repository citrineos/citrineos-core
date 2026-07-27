// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AuthorizationDto, AuthorizationStatusEnumType, AuthorizationWhitelistEnumType, IdTokenEnumType } from '@citrineos/types';
import {
  type AuthorizationEntity,
  authorizationTable,
  tenantAuthorizationTable,
} from '../schema/Authorization.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

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
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleAuthorizationRepository extends DrizzleRepository<
  typeof authorizationTable,
  AuthorizationDto
> {
  protected getTable(tenantId: number): typeof authorizationTable {
    return this.useTenantSchema ? tenantAuthorizationTable(tenantId) : authorizationTable;
  }

  protected toDto(row: AuthorizationEntity): AuthorizationDto {
    return toAuthorizationDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
