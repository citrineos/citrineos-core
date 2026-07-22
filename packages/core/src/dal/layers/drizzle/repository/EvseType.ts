// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, EvseTypeDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { type EvseTypeEntity, evseTypeTable, tenantEvseTypeTable } from '../schema/EvseType.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external EvseTypeDto contract.
export function toEvseTypeDto(entity: EvseTypeEntity): EvseTypeDto {
  const dto: Explicit<EvseTypeDto> = {
    databaseId: entity.databaseId,
    // The OCPP EVSE id column is nullable in the schema but required by the DTO.
    id: entity.id ?? 0,
    connectorId: entity.connectorId ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleEvseTypeRepository extends DrizzleRepository<
  typeof evseTypeTable,
  EvseTypeDto
> {
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof evseTypeTable {
    return this.useTenantSchema ? tenantEvseTypeTable(tenantId) : evseTypeTable;
  }

  protected toDto(row: EvseTypeEntity): EvseTypeDto {
    return toEvseTypeDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
