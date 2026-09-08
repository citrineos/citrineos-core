// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ComponentDto } from '@citrineos/types';
import {
  type ComponentEntity,
  componentTable,
  tenantComponentTable,
} from '../../db/drizzle/schema/component.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ComponentDto contract.
export function toComponentDto(entity: ComponentEntity): ComponentDto {
  const dto: Explicit<ComponentDto> = {
    id: entity.id,
    name: entity.name ?? '',
    instance: entity.instance ?? null,
    evseDatabaseId: entity.evseDatabaseId ?? null,
    // Relation fields are not present as scalar columns.
    evse: undefined,
    variables: undefined,
    customData: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleComponentRepository extends DrizzleRepository<
  typeof componentTable,
  ComponentDto
> {
  protected getTable(tenantId: number): typeof componentTable {
    return this.useTenantSchema ? tenantComponentTable(tenantId) : componentTable;
  }

  protected toDto(row: ComponentEntity): ComponentDto {
    return toComponentDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
