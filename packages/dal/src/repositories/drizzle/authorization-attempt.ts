// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AuthorizationAttemptCreate, AuthorizationAttemptDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  type AuthorizationAttemptEntity,
  authorizationAttemptTable,
} from '../../db/drizzle/schema/authorization-attempt.js';
import { chargingStationTable } from '../../db/drizzle/schema/charging-station.js';
import { type Explicit } from '../../db/drizzle/types.js';
import type { IAuthorizationAttemptRepository } from '../repositories.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external AuthorizationAttemptDto contract.
export function toAuthorizationAttemptDto(
  entity: AuthorizationAttemptEntity,
): AuthorizationAttemptDto {
  const dto: Explicit<AuthorizationAttemptDto> = {
    id: entity.id,
    stationId: entity.stationId,
    ocppVersion: entity.ocppVersion,
    action: entity.action,
    correlationId: entity.correlationId,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp.toISOString(),
    idToken: entity.idToken,
    idTokenType: entity.idTokenType,
    authorizationId: entity.authorizationId,
    storedStatus: entity.storedStatus,
    responseStatus: entity.responseStatus,
    reason: entity.reason,
    details: entity.details,
    evseId: entity.evseId,
    connectorId: entity.connectorId,
    transactionDatabaseId: entity.transactionDatabaseId,
    transactionCreatedAt: entity.transactionCreatedAt,
    transactionId: entity.transactionId,
    remoteStartId: entity.remoteStartId,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleAuthorizationAttemptRepository
  extends DrizzleRepository<typeof authorizationAttemptTable, AuthorizationAttemptDto>
  implements IAuthorizationAttemptRepository
{
  // No schema-per-tenant variant: like WebsocketEvents, this table is row-level only.
  protected getTable(_tenantId: number): typeof authorizationAttemptTable {
    return authorizationAttemptTable;
  }

  protected toDto(row: AuthorizationAttemptEntity): AuthorizationAttemptDto {
    return toAuthorizationAttemptDto(row);
  }

  async createAuthorizationAttempt(
    tenantId: number,
    ocppConnectionName: string,
    attempt: Omit<AuthorizationAttemptCreate, 'stationId' | 'tenantId'>,
  ): Promise<AuthorizationAttemptDto> {
    const stationId = await this._resolveStationId(tenantId, ocppConnectionName);
    return this.insert(tenantId, {
      ...attempt,
      stationId: stationId ?? null,
      timestamp: new Date(attempt.timestamp),
    });
  }

  private async _resolveStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | undefined> {
    const rows = await this.db
      .select({ id: chargingStationTable.id })
      .from(chargingStationTable)
      .where(
        and(
          eq(chargingStationTable.ocppConnectionName, ocppConnectionName),
          eq(chargingStationTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    return rows[0]?.id;
  }
}
