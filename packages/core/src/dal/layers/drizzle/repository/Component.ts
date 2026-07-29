// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, ComponentDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { type ComponentEntity, componentTable, tenantComponentTable } from '../schema/Component.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

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
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof componentTable {
    return this.useTenantSchema ? tenantComponentTable(tenantId) : componentTable;
  }

  protected toDto(row: ComponentEntity): ComponentDto {
    return toComponentDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
