// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  CallAction,
  SetMonitoringStatusEnumType,
  VariableMonitoringStatusDto,
} from '@citrineos/types';
import {
  type VariableMonitoringStatusEntity,
  type VariableMonitoringStatusEntityInsert,
  variableMonitoringStatusTable,
  tenantVariableMonitoringStatusTable,
} from '../../db/drizzle/schema/variable-monitoring-status.js';
import { DrizzleRepository, type DrizzleWriteContext } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external VariableMonitoringStatusDto contract.
// VariableMonitoringStatusDto requires a nested `variable` (VariableMonitoringDto)
// relation that cannot be reconstructed from a flat DB row, so scalar columns are
// mapped and the result is cast. The relation is hydrated by a higher layer.
export function toVariableMonitoringStatusDto(
  entity: VariableMonitoringStatusEntity,
): VariableMonitoringStatusDto {
  // TODO: map relations (variable)
  return {
    id: entity.id,
    status: entity.status,
    statusInfo: entity.statusInfo,
    variableMonitoringId: entity.variableMonitoringId,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  } as VariableMonitoringStatusDto;
}

export class DrizzleVariableMonitoringStatusRepository extends DrizzleRepository<
  typeof variableMonitoringStatusTable,
  VariableMonitoringStatusDto
> {
  protected getTable(tenantId: number): typeof variableMonitoringStatusTable {
    return this.useTenantSchema
      ? tenantVariableMonitoringStatusTable(tenantId)
      : variableMonitoringStatusTable;
  }

  protected toDto(row: VariableMonitoringStatusEntity): VariableMonitoringStatusDto {
    return toVariableMonitoringStatusDto(row);
  }

  async createStatus(
    tenantId: number,
    values: Omit<VariableMonitoringStatusEntityInsert, 'tenantId'>,
    ctx?: DrizzleWriteContext,
  ): Promise<VariableMonitoringStatusDto> {
    return await this.insert(tenantId, values, ctx);
  }

  async createVariableMonitoringStatus(
    tenantId: number,
    status: SetMonitoringStatusEnumType,
    action: CallAction,
    variableMonitoringId: number,
    ctx?: DrizzleWriteContext,
  ): Promise<void> {
    await this.createStatus(
      tenantId,
      { status, statusInfo: { reasonCode: action }, variableMonitoringId },
      ctx,
    );
  }
}
