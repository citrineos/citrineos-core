// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { VariableAttributeDto } from '@citrineos/types';
import {
  tenantVariableAttributeTable,
  type VariableAttributeEntity,
  variableAttributeTable,
} from '../schema/VariableAttribute.js';
import { DrizzleRepository } from './Base.js';
import type { VariableAttributeQuerystring } from '@/dal/index.js';
import { and, eq } from 'drizzle-orm';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external VariableAttributeDto contract.
// The DTO requires nested relation objects (chargingStation, variable, component)
// that cannot be produced from a flat row, so scalar columns are mapped and the
// result is returned with a pragmatic cast.
export function toVariableAttributeDto(entity: VariableAttributeEntity): VariableAttributeDto {
  return {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
    type: entity.type ?? null,
    dataType: entity.dataType,
    value: entity.value ?? null,
    mutability: entity.mutability ?? null,
    persistent: entity.persistent ?? false,
    constant: entity.constant ?? false,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    generatedAt: entity.generatedAt?.toISOString(),
    variableId: entity.variableId ?? null,
    componentId: entity.componentId ?? null,
    evseDatabaseId: entity.evseDatabaseId ?? null,
    bootConfigId: entity.bootConfigId ?? null,
    tenantId: entity.tenantId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    // TODO: map relations (chargingStation, variable, component, evse, statuses, bootConfig)
  } as VariableAttributeDto;
}

export class DrizzleVariableAttributeRepository extends DrizzleRepository<
  typeof variableAttributeTable,
  VariableAttributeDto
> {
  protected getTable(tenantId: number): typeof variableAttributeTable {
    return this.useTenantSchema ? tenantVariableAttributeTable(tenantId) : variableAttributeTable;
  }

  protected toDto(row: VariableAttributeEntity): VariableAttributeDto {
    return toVariableAttributeDto(row);
  }

  private createVariableAttributeConditions(query: VariableAttributeQuerystring) {
    const conditions = [];

    if (query.ocppConnectionName) {
      conditions.push(eq(variableAttributeTable.ocppConnectionName, query.ocppConnectionName));
    }

    if (query.tenantId) {
      conditions.push(eq(variableAttributeTable.tenantId, query.tenantId));
    }

    // TODO implement remaining conditions as needed

    return conditions;
  }

  async updateAllByQueryString(
    query: VariableAttributeQuerystring,
    value: object,
  ): Promise<VariableAttributeDto[]> {
    const rows = (await this.db
      .update(variableAttributeTable)
      .set(value)
      .where(and(...this.createVariableAttributeConditions(query)))
      .returning()) as VariableAttributeEntity[];

    const dtos = rows.map((row) => this.toDto(row));

    this.emit('updated', dtos);

    return dtos;
  }
}
