// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootDto } from '@citrineos/types';
import { type BootEntity, bootTable, tenantBootTable } from '../schema/Boot.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external BootDto contract.
export function toBootDto(entity: BootEntity): BootDto {
  const dto: Explicit<BootDto> = {
    id: entity.id,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    lastBootTime: entity.lastBootTime ? entity.lastBootTime.toISOString() : null,
    heartbeatInterval: entity.heartbeatInterval ?? null,
    bootRetryInterval: entity.bootRetryInterval ?? null,
    status: entity.status ?? undefined,
    statusInfo: (entity.statusInfo as Record<string, any> | null) ?? null,
    getBaseReportOnPending: entity.getBaseReportOnPending ?? null,
    pendingBootSetVariables: undefined,
    variablesRejectedOnLastBoot:
      (entity.variablesRejectedOnLastBoot as Record<string, any>[] | null) ?? null,
    bootWithRejectedVariables: entity.bootWithRejectedVariables ?? null,
    changeConfigurationsOnPending: entity.changeConfigurationsOnPending ?? null,
    getConfigurationsOnPending: entity.getConfigurationsOnPending ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleBootRepository extends DrizzleRepository<typeof bootTable, BootDto> {
  protected getTable(tenantId: number): typeof bootTable {
    return this.useTenantSchema ? tenantBootTable(tenantId) : bootTable;
  }

  protected toDto(row: BootEntity): BootDto {
    return toBootDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
