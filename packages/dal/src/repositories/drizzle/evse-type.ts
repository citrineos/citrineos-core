// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IEvseTypeRepository } from '@dal/repositories/repositories.js';
import type { EvseTypeDto } from '@citrineos/types';
import { and, eq, isNull } from 'drizzle-orm';
import {
  type EvseTypeEntity,
  evseTypeTable,
  tenantEvseTypeTable,
} from '../../db/drizzle/schema/evse-type.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

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

export class DrizzleEvseTypeRepository
  extends DrizzleRepository<typeof evseTypeTable, EvseTypeDto>
  implements IEvseTypeRepository
{
  protected getTable(tenantId: number): typeof evseTypeTable {
    return this.useTenantSchema ? tenantEvseTypeTable(tenantId) : evseTypeTable;
  }

  protected toDto(row: EvseTypeEntity): EvseTypeDto {
    return toEvseTypeDto(row);
  }

  // ─── IEvseTypeRepository methods ─────────────────────────────────────────

  async findEvseByIdAndConnectorId(
    tenantId: number,
    id: number,
    connectorId: number | null,
  ): Promise<EvseTypeDto | undefined> {
    const table = this.getTable(tenantId);

    // `id` is the OCPP EVSE id, not the primary key.
    const rows = (await this.db
      .select()
      .from(table)
      .where(
        and(
          eq(table.id, id),
          connectorId === null ? isNull(table.connectorId) : eq(table.connectorId, connectorId),
          this.tenantFilter(table, tenantId),
        ),
      )
      .limit(1)) as EvseTypeEntity[];

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }
}
