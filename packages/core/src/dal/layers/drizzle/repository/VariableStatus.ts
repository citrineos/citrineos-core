// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { VariableStatusDto } from '@citrineos/base';
import {
  type VariableStatusEntity,
  variableStatusTable,
  tenantVariableStatusTable,
} from '../schema/VariableStatus.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external VariableStatusDto contract.
// The DTO requires a nested `variable` object that cannot be produced from a flat
// row, so scalar columns are mapped and the result is returned with a pragmatic cast.
export function toVariableStatusDto(entity: VariableStatusEntity): VariableStatusDto {
  return {
    id: entity.id,
    value: entity.value ?? '',
    status: entity.status ?? '',
    statusInfo: entity.statusInfo ?? null,
    variableAttributeId: entity.variableAttributeId ?? null,
    tenantId: entity.tenantId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    // TODO: map relations (variable)
  } as VariableStatusDto;
}

export class DrizzleVariableStatusRepository extends DrizzleRepository<
  typeof variableStatusTable,
  VariableStatusDto
> {
  protected getTable(tenantId: number): typeof variableStatusTable {
    return this.useTenantSchema ? tenantVariableStatusTable(tenantId) : variableStatusTable;
  }

  protected toDto(row: VariableStatusEntity): VariableStatusDto {
    return toVariableStatusDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
