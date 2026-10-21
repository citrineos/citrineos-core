// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationSecurityInfoDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  chargingStationTable,
  tenantChargingStationTable,
} from '../../db/drizzle/schema/charging-station.js';
import {
  type ChargingStationSecurityInfoEntity,
  chargingStationSecurityInfoTable,
  tenantChargingStationSecurityInfoTable,
} from '../../db/drizzle/schema/charging-station-security-info.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';
import type { IChargingStationSecurityInfoRepository } from '../repositories.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingStationSecurityInfoDto contract.
export function toChargingStationSecurityInfoDto(
  entity: ChargingStationSecurityInfoEntity,
): ChargingStationSecurityInfoDto {
  const dto: Explicit<ChargingStationSecurityInfoDto> = {
    id: entity.id,
    stationId: entity.stationId,
    publicKeyFileId: entity.publicKeyFileId ?? '',
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleChargingStationSecurityInfoRepository
  extends DrizzleRepository<typeof chargingStationSecurityInfoTable, ChargingStationSecurityInfoDto>
  implements IChargingStationSecurityInfoRepository
{
  protected getTable(tenantId: number): typeof chargingStationSecurityInfoTable {
    return this.useTenantSchema
      ? tenantChargingStationSecurityInfoTable(tenantId)
      : chargingStationSecurityInfoTable;
  }

  protected toDto(row: ChargingStationSecurityInfoEntity): ChargingStationSecurityInfoDto {
    return toChargingStationSecurityInfoDto(row);
  }

  private getChargingStationTable(tenantId: number): typeof chargingStationTable {
    return this.useTenantSchema ? tenantChargingStationTable(tenantId) : chargingStationTable;
  }

  private async findStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | undefined> {
    const stations = this.getChargingStationTable(tenantId);
    const rows = await this.db
      .select({ id: stations.id })
      .from(stations)
      .where(
        and(
          eq(stations.ocppConnectionName, ocppConnectionName),
          this.tenantFilter(stations, tenantId),
        ),
      )
      .limit(1);
    return rows[0]?.id;
  }

  async readChargingStationPublicKeyFileId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<string> {
    const stationId = await this.findStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return '';
    }

    const table = this.getTable(tenantId);
    const rows = await this.db
      .select({ publicKeyFileId: table.publicKeyFileId })
      .from(table)
      .where(and(eq(table.stationId, stationId), this.tenantFilter(table, tenantId)))
      .limit(1);
    return rows[0]?.publicKeyFileId ?? '';
  }

  async readOrCreateChargingStationInfo(
    tenantId: number,
    ocppConnectionName: string,
    publicKeyFileId: string,
  ): Promise<void> {
    const stationId = await this.findStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      throw new Error(
        `Cannot store security info: no charging station named ` +
          `'${ocppConnectionName}' exists in tenant ${tenantId}.`,
      );
    }

    // Insert-or-ignore on the (stationId, tenantId) unique index, so an existing
    // row keeps its original publicKeyFileId and concurrent callers cannot collide.
    const table = this.getTable(tenantId);
    const rows = await this.db
      .insert(table)
      .values({ stationId, publicKeyFileId, tenantId })
      .onConflictDoNothing({ target: [table.stationId, table.tenantId] })
      .returning();

    if (rows[0]) {
      this.emit('created', [this.toDto(rows[0])]);
    }
  }
}
