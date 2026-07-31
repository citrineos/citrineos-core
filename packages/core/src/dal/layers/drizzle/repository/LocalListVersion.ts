// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { LocalListVersionDto } from '@citrineos/base';
import {
  type LocalListVersionEntity,
  localListVersionTable,
  tenantLocalListVersionTable,
} from '../schema/LocalListVersion.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external LocalListVersionDto contract.
export function toLocalListVersionDto(entity: LocalListVersionEntity): LocalListVersionDto {
  const dto: Explicit<LocalListVersionDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    versionNumber: entity.versionNumber ?? 0,
    // Relation, not a scalar column.
    localAuthorizationList: undefined,
    // customData is not persisted as a column.
    customData: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleLocalListVersionRepository extends DrizzleRepository<
  typeof localListVersionTable,
  LocalListVersionDto
> {
  protected getTable(tenantId: number): typeof localListVersionTable {
    return this.useTenantSchema ? tenantLocalListVersionTable(tenantId) : localListVersionTable;
  }

  protected toDto(row: LocalListVersionEntity): LocalListVersionDto {
    return toLocalListVersionDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
