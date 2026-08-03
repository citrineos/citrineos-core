// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CompositeScheduleDto } from '@citrineos/types';
import {
  type CompositeScheduleEntity,
  compositeScheduleTable,
  tenantCompositeScheduleTable,
} from '../schema/CompositeSchedule.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external CompositeScheduleDto contract.
export function toCompositeScheduleDto(entity: CompositeScheduleEntity): CompositeScheduleDto {
  const dto: Explicit<CompositeScheduleDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    evseId: entity.evseId!,
    duration: entity.duration!,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    scheduleStart: entity.scheduleStart!.toISOString(),
    chargingRateUnit: entity.chargingRateUnit ?? '',
    chargingSchedulePeriod: entity.chargingSchedulePeriod!,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleCompositeScheduleRepository extends DrizzleRepository<
  typeof compositeScheduleTable,
  CompositeScheduleDto
> {
  protected getTable(tenantId: number): typeof compositeScheduleTable {
    return this.useTenantSchema ? tenantCompositeScheduleTable(tenantId) : compositeScheduleTable;
  }

  protected toDto(row: CompositeScheduleEntity): CompositeScheduleDto {
    return toCompositeScheduleDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
