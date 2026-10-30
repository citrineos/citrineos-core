// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingRateUnitEnumType, ChargingScheduleDto } from '@citrineos/types';
import {
  type ChargingScheduleEntity,
  chargingScheduleTable,
  tenantChargingScheduleTable,
} from '../../db/drizzle/schema/charging-schedule.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { and, desc, eq, inArray, max } from 'drizzle-orm';
import type { ChargingScheduleInput } from '../../mappers/2.0.1/charging-profile-mapper.js';
import type { IChargingScheduleRepository } from '../repositories.js';
import { DrizzleRepository, type DrizzleWriteContext } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingScheduleDto contract.
export function toChargingScheduleDto(entity: ChargingScheduleEntity): ChargingScheduleDto {
  const dto: Explicit<ChargingScheduleDto> = {
    databaseId: entity.databaseId,
    id: entity.id!,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    chargingRateUnit: entity.chargingRateUnit as ChargingRateUnitEnumType,
    chargingSchedulePeriod: entity.chargingSchedulePeriod!,
    duration: entity.duration,
    // DataType.DECIMAL is returned by drizzle as a string; DTO contract is number.
    minChargingRate: entity.minChargingRate != null ? Number(entity.minChargingRate) : null,
    startSchedule: entity.startSchedule,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timeBase: entity.timeBase ? entity.timeBase.toISOString() : undefined,
    chargingProfileDatabaseId: entity.chargingProfileDatabaseId ?? undefined,
    // Relation not present as a scalar column.
    salesTariff: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleChargingScheduleRepository
  extends DrizzleRepository<typeof chargingScheduleTable, ChargingScheduleDto>
  implements IChargingScheduleRepository
{
  protected getTable(tenantId: number): typeof chargingScheduleTable {
    return this.useTenantSchema ? tenantChargingScheduleTable(tenantId) : chargingScheduleTable;
  }

  protected toDto(row: ChargingScheduleEntity): ChargingScheduleDto {
    return toChargingScheduleDto(row);
  }

  async createForProfile(
    tenantId: number,
    ocppConnectionName: string,
    chargingProfileDatabaseId: number,
    input: ChargingScheduleInput,
    ctx?: DrizzleWriteContext,
  ): Promise<ChargingScheduleDto> {
    return await this.insert(
      tenantId,
      {
        id: input.id,
        ocppConnectionName,
        chargingProfileDatabaseId,
        chargingRateUnit: input.chargingRateUnit,
        chargingSchedulePeriod: input.chargingSchedulePeriod,
        duration: input.duration ?? null,
        // DECIMAL columns are written as strings.
        minChargingRate: input.minChargingRate != null ? input.minChargingRate.toString() : null,
        startSchedule: input.startSchedule ?? null,
      },
      ctx,
    );
  }

  /** Returns the databaseIds of the rows removed, so their sales tariffs can follow. */
  async deleteByChargingProfileDatabaseId(
    tenantId: number,
    chargingProfileDatabaseId: number,
    ctx?: DrizzleWriteContext,
  ): Promise<number[]> {
    const schedules = this.getTable(tenantId);
    const rows = (await (ctx?.db ?? this.db)
      .delete(schedules)
      .where(
        and(
          eq(schedules.chargingProfileDatabaseId, chargingProfileDatabaseId),
          this.tenantFilter(schedules, tenantId),
        ),
      )
      .returning()) as ChargingScheduleEntity[];
    for (const row of rows) {
      this.raise(ctx, 'deleted', [toChargingScheduleDto(row)]);
    }
    return rows.map((row) => row.databaseId);
  }

  async readByChargingProfileDatabaseIds(
    tenantId: number,
    chargingProfileDatabaseIds: number[],
  ): Promise<Map<number, ChargingScheduleDto[]>> {
    const byProfile = new Map<number, ChargingScheduleDto[]>();
    if (chargingProfileDatabaseIds.length === 0) {
      return byProfile;
    }
    const schedules = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(schedules)
      .where(
        and(
          inArray(schedules.chargingProfileDatabaseId, chargingProfileDatabaseIds),
          this.tenantFilter(schedules, tenantId),
        ),
      )
      .orderBy(desc(schedules.databaseId))) as ChargingScheduleEntity[];

    for (const row of rows) {
      if (row.chargingProfileDatabaseId == null) continue;
      const bucket = byProfile.get(row.chargingProfileDatabaseId) ?? [];
      bucket.push(toChargingScheduleDto(row));
      byProfile.set(row.chargingProfileDatabaseId, bucket);
    }
    return byProfile;
  }

  /** Matches CrudRepository.readNextValue: max + 1, or 1 when the station has none. */
  async getNextChargingScheduleId(tenantId: number, ocppConnectionName: string): Promise<number> {
    const schedules = this.getTable(tenantId);
    const rows = await this.db
      .select({ value: max(schedules.id) })
      .from(schedules)
      .where(
        and(
          eq(schedules.ocppConnectionName, ocppConnectionName),
          this.tenantFilter(schedules, tenantId),
        ),
      );
    return (rows[0]?.value ?? 0) + 1;
  }
}
