// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingProfileDto } from '@citrineos/types';
import {
  type ChargingProfileEntity,
  chargingProfileTable,
  tenantChargingProfileTable,
} from '../../db/drizzle/schema/charging-profile.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingProfileDto contract.
export function toChargingProfileDto(entity: ChargingProfileEntity): ChargingProfileDto {
  // chargingSchedule is a required relation that cannot be produced from a flat
  // DB row; a pragmatic cast is used so the scalar mapping still compiles.
  // TODO: map relations (chargingSchedule)
  return {
    databaseId: entity.databaseId,
    ocppConnectionName: entity.ocppConnectionName,
    id: entity.id ?? undefined,
    chargingProfileKind: entity.chargingProfileKind,
    chargingProfilePurpose: entity.chargingProfilePurpose,
    recurrencyKind: entity.recurrencyKind,
    stackLevel: entity.stackLevel,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    validFrom: entity.validFrom ? entity.validFrom.toISOString() : null,
    validTo: entity.validTo ? entity.validTo.toISOString() : null,
    evseId: entity.evseId,
    isActive: entity.isActive ?? false,
    chargingLimitSource: entity.chargingLimitSource,
    transactionDatabaseId: entity.transactionDatabaseId,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  } as ChargingProfileDto;
}

export class DrizzleChargingProfileRepository extends DrizzleRepository<
  typeof chargingProfileTable,
  ChargingProfileDto
> {
  protected getTable(tenantId: number): typeof chargingProfileTable {
    return this.useTenantSchema ? tenantChargingProfileTable(tenantId) : chargingProfileTable;
  }

  protected toDto(row: ChargingProfileEntity): ChargingProfileDto {
    return toChargingProfileDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
