// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IVariableCharacteristicsRepository } from '@dal/repositories/repositories.js';
import type { VariableCharacteristicsDto } from '@citrineos/types';
import { and, eq, isNull } from 'drizzle-orm';
import {
  type VariableEntity,
  variableTable,
  tenantVariableTable,
} from '../../db/drizzle/schema/variable.js';
import {
  type VariableCharacteristicsEntity,
  variableCharacteristicsTable,
  tenantVariableCharacteristicsTable,
} from '../../db/drizzle/schema/variable-characteristics.js';
import { DrizzleRepository } from './base.js';

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

export class DrizzleVariableCharacteristicsRepository
  extends DrizzleRepository<typeof variableCharacteristicsTable, VariableCharacteristicsDto>
  implements IVariableCharacteristicsRepository
{
  protected getTable(tenantId: number): typeof variableCharacteristicsTable {
    return this.useTenantSchema
      ? tenantVariableCharacteristicsTable(tenantId)
      : variableCharacteristicsTable;
  }

  protected toDto(row: VariableCharacteristicsEntity): VariableCharacteristicsDto {
    return toVariableCharacteristicsDto(row);
  }

  private getVariableTable(tenantId: number): typeof variableTable {
    return this.useTenantSchema ? tenantVariableTable(tenantId) : variableTable;
  }

  // ─── IVariableCharacteristicsRepository methods ──────────────────────────

  async findVariableCharacteristicsByVariableNameAndVariableInstance(
    tenantId: number,
    variableName: string,
    variableInstance: string | null,
  ): Promise<VariableCharacteristicsDto | undefined> {
    const table = this.getTable(tenantId);
    const variable = this.getVariableTable(tenantId);

    const rows = (await this.db
      .select({ characteristics: table, variable })
      .from(table)
      .innerJoin(variable, eq(table.variableId, variable.id))
      .where(
        and(
          eq(variable.name, variableName),
          variableInstance === null
            ? isNull(variable.instance)
            : eq(variable.instance, variableInstance),
          this.tenantFilter(table, tenantId),
          this.tenantFilter(variable, tenantId),
        ),
      )
      .limit(1)) as { characteristics: VariableCharacteristicsEntity; variable: VariableEntity }[];

    const row = rows[0];
    if (!row) {
      return undefined;
    }

    return {
      ...toVariableCharacteristicsDto(row.characteristics),
      variable: {
        id: row.variable.id,
        name: row.variable.name ?? '',
        instance: row.variable.instance ?? null,
        tenantId: row.variable.tenantId,
        createdAt: row.variable.createdAt,
        updatedAt: row.variable.updatedAt,
      },
    };
  }
}
