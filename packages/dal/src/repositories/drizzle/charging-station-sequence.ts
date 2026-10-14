// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ChargingStationSequenceDto,
  ChargingStationSequenceTypeEnumType,
} from '@citrineos/types';
import { and, eq, sql } from 'drizzle-orm';
import {
  chargingStationTable,
  tenantChargingStationTable,
} from '../../db/drizzle/schema/charging-station.js';
import {
  type ChargingStationSequenceEntity,
  chargingStationSequenceTable,
  tenantChargingStationSequenceTable,
} from '../../db/drizzle/schema/charging-station-sequence.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';
import type { IChargingStationSequenceRepository } from '../repositories.js';

const SEQUENCE_START = 1;

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingStationSequenceDto contract.
export function toChargingStationSequenceDto(
  entity: ChargingStationSequenceEntity,
): ChargingStationSequenceDto {
  const dto: Explicit<ChargingStationSequenceDto> = {
    id: entity.id,
    stationId: entity.stationId,
    type: entity.type as ChargingStationSequenceDto['type'],
    value: entity.value,
    station: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleChargingStationSequenceRepository
  extends DrizzleRepository<typeof chargingStationSequenceTable, ChargingStationSequenceDto>
  implements IChargingStationSequenceRepository
{
  protected getTable(tenantId: number): typeof chargingStationSequenceTable {
    return this.useTenantSchema
      ? tenantChargingStationSequenceTable(tenantId)
      : chargingStationSequenceTable;
  }

  protected toDto(row: ChargingStationSequenceEntity): ChargingStationSequenceDto {
    return toChargingStationSequenceDto(row);
  }

  private getChargingStationTable(tenantId: number): typeof chargingStationTable {
    return this.useTenantSchema ? tenantChargingStationTable(tenantId) : chargingStationTable;
  }

  async getNextSequenceValue(
    tenantId: number,
    ocppConnectionName: string,
    type: ChargingStationSequenceTypeEnumType,
  ): Promise<number> {
    const stations = this.getChargingStationTable(tenantId);
    const stationRows = await this.db
      .select({ id: stations.id })
      .from(stations)
      .where(
        and(
          eq(stations.ocppConnectionName, ocppConnectionName),
          this.tenantFilter(stations, tenantId),
        ),
      )
      .limit(1);
    const stationId = stationRows[0]?.id;
    if (stationId === undefined) {
      throw new Error(
        `Cannot allocate a ${type} sequence value: no charging station named ` +
          `'${ocppConnectionName}' exists in tenant ${tenantId}.`,
      );
    }

    // A single upsert on the (stationId, type) unique index, so concurrent callers
    // each receive a distinct value instead of racing a read-then-increment.
    const table = this.getTable(tenantId);
    const rows = await this.db
      .insert(table)
      .values({ stationId, type, value: SEQUENCE_START, tenantId })
      .onConflictDoUpdate({
        target: [table.stationId, table.type],
        set: { value: sql`${table.value} + 1`, updatedAt: new Date() },
      })
      .returning();

    return rows[0].value;
  }
}
