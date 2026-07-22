// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, VariableAttributeDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type VariableAttributeEntity,
  variableAttributeTable,
  tenantVariableAttributeTable,
} from '../schema/VariableAttribute.js';
import { DrizzleRepository } from './Base.js';

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
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof variableAttributeTable {
    return this.useTenantSchema
      ? tenantVariableAttributeTable(tenantId)
      : variableAttributeTable;
  }

  protected toDto(row: VariableAttributeEntity): VariableAttributeDto {
    return toVariableAttributeDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
