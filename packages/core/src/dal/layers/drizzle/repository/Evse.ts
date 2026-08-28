// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { EvseDto } from '@citrineos/types';
import { type EvseEntity, evseTable, tenantEvseTable } from '../schema/Evse.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external EvseDto contract.
export function toEvseDto(entity: EvseEntity): EvseDto {
  const dto: Explicit<EvseDto> = {
    id: entity.id,
    stationId: entity.stationId ?? undefined,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    evseTypeId: entity.evseTypeId ?? undefined,
    evseId: entity.evseId ?? '',
    physicalReference: entity.physicalReference,
    removed: entity.removed ?? undefined,
    // Relations are not present on a flat DB row.
    connectors: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleEvseRepository extends DrizzleRepository<typeof evseTable, EvseDto> {
  protected getTable(tenantId: number): typeof evseTable {
    return this.useTenantSchema ? tenantEvseTable(tenantId) : evseTable;
  }

  protected toDto(row: EvseEntity): EvseDto {
    return toEvseDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
