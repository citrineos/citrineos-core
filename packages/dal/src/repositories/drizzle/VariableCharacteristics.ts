// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { VariableCharacteristicsDto } from '@citrineos/types';
import {
  type VariableCharacteristicsEntity,
  variableCharacteristicsTable,
  tenantVariableCharacteristicsTable,
} from '../../db/drizzle/schema/VariableCharacteristics.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external VariableCharacteristicsDto contract.
// The DTO requires a nested `variable` object that cannot be produced from a flat
// row, so scalar columns are mapped and the result is returned with a pragmatic cast.
export function toVariableCharacteristicsDto(
  entity: VariableCharacteristicsEntity,
): VariableCharacteristicsDto {
  return {
    id: entity.id,
    unit: entity.unit ?? null,
    dataType: entity.dataType,
    // DECIMAL columns arrive as strings from drizzle numeric; DTO contract is number.
    minLimit: entity.minLimit != null ? Number(entity.minLimit) : null,
    maxLimit: entity.maxLimit != null ? Number(entity.maxLimit) : null,
    valuesList: entity.valuesList ?? null,
    supportsMonitoring: entity.supportsMonitoring ?? false,
    variableId: entity.variableId ?? null,
    tenantId: entity.tenantId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    // TODO: map relations (variable)
  } as VariableCharacteristicsDto;
}

export class DrizzleVariableCharacteristicsRepository extends DrizzleRepository<
  typeof variableCharacteristicsTable,
  VariableCharacteristicsDto
> {
  protected getTable(tenantId: number): typeof variableCharacteristicsTable {
    return this.useTenantSchema
      ? tenantVariableCharacteristicsTable(tenantId)
      : variableCharacteristicsTable;
  }

  protected toDto(row: VariableCharacteristicsEntity): VariableCharacteristicsDto {
    return toVariableCharacteristicsDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
