// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { VariableDto } from '@citrineos/base';
import { type VariableEntity, variableTable, tenantVariableTable } from '../schema/Variable.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external VariableDto contract.
export function toVariableDto(entity: VariableEntity): VariableDto {
  const dto: Explicit<VariableDto> = {
    id: entity.id,
    name: entity.name ?? '',
    instance: entity.instance ?? null,
    customData: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleVariableRepository extends DrizzleRepository<
  typeof variableTable,
  VariableDto
> {
  protected getTable(tenantId: number): typeof variableTable {
    return this.useTenantSchema ? tenantVariableTable(tenantId) : variableTable;
  }

  protected toDto(row: VariableEntity): VariableDto {
    return toVariableDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
