// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingRateUnitEnumType, ChargingScheduleDto } from '@citrineos/base';
import {
  type ChargingScheduleEntity,
  chargingScheduleTable,
  tenantChargingScheduleTable,
} from '../schema/ChargingSchedule.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingScheduleDto contract.
export function toChargingScheduleDto(entity: ChargingScheduleEntity): ChargingScheduleDto {
  const dto: Explicit<ChargingScheduleDto> = {
    databaseId: entity.databaseId,
    id: entity.id!,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    chargingRateUnit: entity.chargingRateUnit as ChargingRateUnitEnumType,
    chargingSchedulePeriod: entity.chargingSchedulePeriod!,
    duration: entity.duration,
    // DataType.DECIMAL is returned by drizzle as a string; DTO contract is number.
    minChargingRate: entity.minChargingRate != null ? Number(entity.minChargingRate) : null,
    startSchedule: entity.startSchedule,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timeBase: entity.timeBase ? entity.timeBase.toISOString() : undefined,
    chargingProfileDatabaseId: entity.chargingProfileDatabaseId ?? undefined,
    // Relation not present as a scalar column.
    salesTariff: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleChargingScheduleRepository extends DrizzleRepository<
  typeof chargingScheduleTable,
  ChargingScheduleDto
> {
  protected getTable(tenantId: number): typeof chargingScheduleTable {
    return this.useTenantSchema ? tenantChargingScheduleTable(tenantId) : chargingScheduleTable;
  }

  protected toDto(row: ChargingScheduleEntity): ChargingScheduleDto {
    return toChargingScheduleDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
