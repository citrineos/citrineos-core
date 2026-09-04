// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IEvseRepository } from '@dal/repositories/repositories.js';
import type { EvseDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  chargingStationTable,
  tenantChargingStationTable,
} from '../../db/drizzle/schema/charging-station.js';
import {
  type ConnectorEntity,
  connectorTable,
  tenantConnectorTable,
} from '../../db/drizzle/schema/connector.js';
import { type EvseEntity, evseTable, tenantEvseTable } from '../../db/drizzle/schema/evse.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository, type DrizzleWriteContext } from './base.js';
import { toConnectorDto } from './connector.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external EvseDto contract.
export function toEvseDto(entity: EvseEntity): EvseDto {
  const dto: Explicit<EvseDto> = {
    id: entity.id,
    stationId: entity.stationId ?? undefined,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    evseTypeId: entity.evseTypeId ?? undefined,
    evseId: entity.evseId ?? '',
    physicalReference: entity.physicalReference,
    removed: entity.removed ?? undefined,
    // Relations are not present on a flat DB row.
    connectors: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

function writableEvseColumns(evse: EvseDto) {
  return {
    ocppConnectionName: evse.ocppConnectionName,
    evseTypeId: evse.evseTypeId,
    evseId: evse.evseId,
    physicalReference: evse.physicalReference,
    removed: evse.removed,
  };
}

export class DrizzleEvseRepository
  extends DrizzleRepository<typeof evseTable, EvseDto>
  implements IEvseRepository
{
  protected getTable(tenantId: number): typeof evseTable {
    return this.useTenantSchema ? tenantEvseTable(tenantId) : evseTable;
  }

  protected toDto(row: EvseEntity): EvseDto {
    return toEvseDto(row);
  }

  private getConnectorTable(tenantId: number): typeof connectorTable {
    return this.useTenantSchema ? tenantConnectorTable(tenantId) : connectorTable;
  }

  private getChargingStationTable(tenantId: number): typeof chargingStationTable {
    return this.useTenantSchema ? tenantChargingStationTable(tenantId) : chargingStationTable;
  }

  private async resolveStationId(
    tenantId: number,
    ocppConnectionName: string | undefined,
    stationId: number | undefined,
    ctx: DrizzleWriteContext,
  ): Promise<number | undefined> {
    if (stationId != null || !ocppConnectionName) {
      return stationId;
    }

    const stations = this.getChargingStationTable(tenantId);
    const rows = await ctx.db
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

  // ─── IEvseRepository methods ─────────────────────────────────────────────

  async readEvseByStationIdAndOcpp201EvseId(
    tenantId: number,
    ocppConnectionName: string,
    ocpp201EvseId: number,
  ): Promise<EvseDto | undefined> {
    const table = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(table)
      .where(
        and(
          eq(table.ocppConnectionName, ocppConnectionName),
          eq(table.evseTypeId, ocpp201EvseId),
          this.tenantFilter(table, tenantId),
        ),
      )
      .limit(1)) as EvseEntity[];

    if (!rows[0]) {
      return undefined;
    }

    const connectors = this.getConnectorTable(tenantId);
    const connectorRows = (await this.db
      .select()
      .from(connectors)
      .where(
        and(eq(connectors.evseId, rows[0].id), this.tenantFilter(connectors, tenantId)),
      )) as ConnectorEntity[];

    return { ...this.toDto(rows[0]), connectors: connectorRows.map(toConnectorDto) };
  }

  async createOrUpdateEvse(tenantId: number, evse: EvseDto): Promise<EvseDto> {
    return await this.withAtomicWrite(async (ctx) => {
      const table = this.getTable(tenantId);

      const existing = (await ctx.db
        .select()
        .from(table)
        .where(
          and(
            eq(table.ocppConnectionName, evse.ocppConnectionName),
            eq(table.evseTypeId, evse.evseTypeId!),
            this.tenantFilter(table, tenantId),
          ),
        )
        .limit(1)) as EvseEntity[];

      if (existing[0]) {
        const updated = await this.updateById(
          tenantId,
          existing[0].id,
          { ...writableEvseColumns(evse), updatedAt: new Date() },
          ctx,
        );
        return updated ?? this.toDto(existing[0]);
      }

      return await this.insert(
        tenantId,
        {
          ...writableEvseColumns(evse),
          stationId: await this.resolveStationId(
            tenantId,
            evse.ocppConnectionName,
            evse.stationId,
            ctx,
          ),
        },
        ctx,
      );
    });
  }

  async autoCommissionEvseForOcpp16Connector(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<{ evseId: number }> {
    // OCPP 1.6 has no native EVSE concept. Conservative default: each connector maps
    // to its own Evse.
    return await this.withAtomicWrite(async (ctx) => {
      const stationId = await this.resolveStationId(tenantId, ocppConnectionName, undefined, ctx);

      const created = await this.insert(tenantId, { ocppConnectionName, stationId }, ctx);

      return { evseId: created.id! };
    });
  }
}
