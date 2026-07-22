// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, ReservationDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type ReservationEntity,
  reservationTable,
  tenantReservationTable,
} from '../schema/Reservation.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

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
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof reservationTable {
    return this.useTenantSchema ? tenantReservationTable(tenantId) : reservationTable;
  }

  protected toDto(row: ReservationEntity): ReservationDto {
    return toReservationDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
