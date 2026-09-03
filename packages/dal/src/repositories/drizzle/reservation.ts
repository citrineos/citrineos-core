// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ReservationDto } from '@citrineos/types';
import {
  type ReservationEntity,
  reservationTable,
  tenantReservationTable,
} from '../../db/drizzle/schema/reservation.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ReservationDto contract.
export function toReservationDto(entity: ReservationEntity): ReservationDto {
  const dto: Explicit<ReservationDto> = {
    databaseId: entity.databaseId,
    id: entity.id as number,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    expiryDateTime: entity.expiryDateTime ? entity.expiryDateTime.toISOString() : '',
    connectorType: entity.connectorType ?? null,
    reserveStatus: entity.reserveStatus ?? null,
    isActive: entity.isActive ?? false,
    terminatedByTransaction: entity.terminatedByTransaction ?? null,
    idToken: (entity.idToken as Record<string, any>) ?? {},
    groupIdToken: (entity.groupIdToken as Record<string, any> | null) ?? null,
    evseId: entity.evseId ?? null,
    evse: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleReservationRepository extends DrizzleRepository<
  typeof reservationTable,
  ReservationDto
> {
  protected getTable(tenantId: number): typeof reservationTable {
    return this.useTenantSchema ? tenantReservationTable(tenantId) : reservationTable;
  }

  protected toDto(row: ReservationEntity): ReservationDto {
    return toReservationDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
