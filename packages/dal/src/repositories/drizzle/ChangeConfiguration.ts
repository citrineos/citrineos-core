// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChangeConfigurationDto } from '@citrineos/types';
import {
  type ChangeConfigurationEntity,
  changeConfigurationTable,
  tenantChangeConfigurationTable,
} from '../../db/drizzle/schema/ChangeConfiguration.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChangeConfigurationDto contract.
export function toChangeConfigurationDto(
  entity: ChangeConfigurationEntity,
): ChangeConfigurationDto {
  const dto: Explicit<ChangeConfigurationDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
    key: entity.key,
    value: entity.value ?? null,
    readonly: entity.readonly ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleChangeConfigurationRepository extends DrizzleRepository<
  typeof changeConfigurationTable,
  ChangeConfigurationDto
> {
  protected getTable(tenantId: number): typeof changeConfigurationTable {
    return this.useTenantSchema
      ? tenantChangeConfigurationTable(tenantId)
      : changeConfigurationTable;
  }

  protected toDto(row: ChangeConfigurationEntity): ChangeConfigurationDto {
    return toChangeConfigurationDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
