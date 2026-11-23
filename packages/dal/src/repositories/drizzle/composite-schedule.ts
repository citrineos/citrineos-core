// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CompositeScheduleDto } from '@citrineos/types';
import {
  type CompositeScheduleEntity,
  compositeScheduleTable,
  tenantCompositeScheduleTable,
} from '../../db/drizzle/schema/composite-schedule.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { and, eq } from 'drizzle-orm';
import { evseTable, tenantEvseTable } from '../../db/drizzle/schema/evse.js';
import type { CompositeScheduleInput } from '../../mappers/2.0.1/charging-profile-mapper.js';
import type { CompositeScheduleInput as CompositeScheduleInput21 } from '../../mappers/2.1/charging-profile-mapper.js';
import type { ICompositeScheduleRepository } from '../repositories.js';
import { DrizzleRepository } from './base.js';
import { resolveStationId } from './resolve-station-id.js';

const WHOLE_CHARGING_STATION_EVSE_ID = 0;

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external CompositeScheduleDto contract.
export function toCompositeScheduleDto(entity: CompositeScheduleEntity): CompositeScheduleDto {
  const dto: Explicit<CompositeScheduleDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    evseId: entity.evseId!,
    duration: entity.duration!,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    scheduleStart: entity.scheduleStart!.toISOString(),
    chargingRateUnit: entity.chargingRateUnit ?? '',
    chargingSchedulePeriod: entity.chargingSchedulePeriod!,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleCompositeScheduleRepository
  extends DrizzleRepository<typeof compositeScheduleTable, CompositeScheduleDto>
  implements ICompositeScheduleRepository
{
  protected getTable(tenantId: number): typeof compositeScheduleTable {
    return this.useTenantSchema ? tenantCompositeScheduleTable(tenantId) : compositeScheduleTable;
  }

  protected toDto(row: CompositeScheduleEntity): CompositeScheduleDto {
    return toCompositeScheduleDto(row);
  }

  private getEvseTable(tenantId: number): typeof evseTable {
    return this.useTenantSchema ? tenantEvseTable(tenantId) : evseTable;
  }

  async createCompositeSchedule(
    tenantId: number,
    compositeSchedule: CompositeScheduleInput | CompositeScheduleInput21,
    ocppConnectionName: string,
  ): Promise<CompositeScheduleDto> {
    const evseId = await this.resolveCompositeScheduleEvse(
      tenantId,
      ocppConnectionName,
      compositeSchedule.evseId,
    );

    return await this.insert(tenantId, {
      ocppConnectionName,
      evseId,
      duration: compositeSchedule.duration,
      scheduleStart: new Date(compositeSchedule.scheduleStart),
      chargingRateUnit: compositeSchedule.chargingRateUnit,
      chargingSchedulePeriod: compositeSchedule.chargingSchedulePeriod,
    });
  }

  private async resolveCompositeScheduleEvse(
    tenantId: number,
    ocppConnectionName: string,
    reportedEvseId: number | null | undefined,
  ): Promise<number | null> {
    if (reportedEvseId == null || reportedEvseId === WHOLE_CHARGING_STATION_EVSE_ID) {
      return null;
    }

    const stationId = await resolveStationId(
      this.db,
      tenantId,
      ocppConnectionName,
      this.useTenantSchema,
    );
    const evses = this.getEvseTable(tenantId);
    const rows =
      stationId === undefined
        ? []
        : await this.db
            .select({ id: evses.id })
            .from(evses)
            .where(
              and(
                eq(evses.stationId, stationId),
                eq(evses.evseTypeId, reportedEvseId),
                this.tenantFilter(evses, tenantId),
              ),
            )
            .limit(1);

    if (!rows[0]) {
      this.logger.warn(
        `Composite schedule for ${ocppConnectionName} names EVSE ${reportedEvseId}, which is not ` +
          `recorded on that station. Storing the schedule without an EVSE association.`,
      );
      return null;
    }

    return rows[0].id;
  }
}
