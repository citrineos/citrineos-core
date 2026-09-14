// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { VariableMonitoringDto } from '@citrineos/types';
import {
  type VariableMonitoringEntity,
  variableMonitoringTable,
  tenantVariableMonitoringTable,
} from '../../db/drizzle/schema/variable-monitoring.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external VariableMonitoringDto contract.
// VariableMonitoringDto requires nested `variable` (VariableDto) and `component`
// (ComponentDto) relations that cannot be reconstructed from a flat DB row, so scalar
// columns are mapped and the result is cast. Relations are hydrated by a higher layer.
export function toVariableMonitoringDto(entity: VariableMonitoringEntity): VariableMonitoringDto {
  // TODO: map relations (variable, component)
  return {
    databaseId: entity.databaseId,
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
    transaction: entity.transaction,
    value: entity.value,
    type: entity.type,
    severity: entity.severity,
    eventNotificationType: entity.eventNotificationType,
    variableId: entity.variableId,
    componentId: entity.componentId,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  } as VariableMonitoringDto;
}

export class DrizzleVariableMonitoringRepository extends DrizzleRepository<
  typeof variableMonitoringTable,
  VariableMonitoringDto
> {
  protected getTable(tenantId: number): typeof variableMonitoringTable {
    return this.useTenantSchema ? tenantVariableMonitoringTable(tenantId) : variableMonitoringTable;
  }

  protected toDto(row: VariableMonitoringEntity): VariableMonitoringDto {
    return toVariableMonitoringDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
