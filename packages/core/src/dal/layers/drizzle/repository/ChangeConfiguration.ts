// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChangeConfigurationCreate, ChangeConfigurationDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  type ChangeConfigurationEntity,
  changeConfigurationTable,
  tenantChangeConfigurationTable,
} from '../schema/ChangeConfiguration.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';
import { type IChangeConfigurationRepository } from '@/dal/index.js';

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

export class DrizzleChangeConfigurationRepository
  extends DrizzleRepository<typeof changeConfigurationTable, ChangeConfigurationDto>
  implements IChangeConfigurationRepository
{
  protected getTable(tenantId: number): typeof changeConfigurationTable {
    return this.useTenantSchema
      ? tenantChangeConfigurationTable(tenantId)
      : changeConfigurationTable;
  }

  protected toDto(row: ChangeConfigurationEntity): ChangeConfigurationDto {
    return toChangeConfigurationDto(row);
  }

  async findByStationAndKey(
    tenantId: number,
    ocppConnectionName: string,
    key: string,
  ): Promise<ChangeConfigurationDto | undefined> {
    const rows = await this.db
      .select()
      .from(changeConfigurationTable)
      .where(
        and(
          eq(changeConfigurationTable.tenantId, tenantId),
          eq(changeConfigurationTable.ocppConnectionName, ocppConnectionName),
          eq(changeConfigurationTable.key, key),
        ),
      )
      .limit(1);

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async listByStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<ChangeConfigurationDto[]> {
    const rows = await this.db
      .select()
      .from(changeConfigurationTable)
      .where(
        and(
          eq(changeConfigurationTable.tenantId, tenantId),
          eq(changeConfigurationTable.ocppConnectionName, ocppConnectionName),
        ),
      );

    return rows.map((row) => this.toDto(row));
  }

  async createOrUpdateChangeConfiguration(
    tenantId: number,
    input: ChangeConfigurationCreate,
  ): Promise<ChangeConfigurationDto | undefined> {
    // Upsert on the unique index (ocppConnectionName, key, tenantId).
    // Wrapped in a transaction to match the Sequelize repo, so the read and the
    // subsequent insert/update observe a consistent snapshot.
    let savedConfig: ChangeConfigurationDto | undefined;
    let configExists = false;

    await this.db.transaction(async (tx) => {
      const existing = (await tx
        .select()
        .from(changeConfigurationTable)
        .where(
          and(
            eq(changeConfigurationTable.tenantId, tenantId),
            eq(changeConfigurationTable.ocppConnectionName, input.ocppConnectionName),
            eq(changeConfigurationTable.key, input.key),
          ),
        )
        .limit(1)) as ChangeConfigurationEntity[];

      configExists = existing.length > 0;

      if (configExists) {
        const updated = (await tx
          .update(changeConfigurationTable)
          .set({ ...input, tenantId })
          .where(eq(changeConfigurationTable.id, existing[0].id))
          .returning()) as ChangeConfigurationEntity[];

        if (updated[0]) savedConfig = this.toDto(updated[0]);
      } else {
        const inserted = (await tx
          .insert(changeConfigurationTable)
          .values({ ...input, tenantId })
          .returning()) as ChangeConfigurationEntity[];

        if (inserted[0]) savedConfig = this.toDto(inserted[0]);
      }
    });

    if (savedConfig) {
      this.emit(configExists ? 'updated' : 'created', [savedConfig]);
    }

    return savedConfig;
  }
}
