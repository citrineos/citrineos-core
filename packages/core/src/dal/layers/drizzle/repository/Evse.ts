// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IEvseRepository } from '@/dal/index.js';
import type { EvseDto } from '@citrineos/types';
import { and, eq, isNull } from 'drizzle-orm';
import { chargingStationTable, tenantChargingStationTable } from '../schema/ChargingStation.js';
import { type ConnectorEntity, connectorTable, tenantConnectorTable } from '../schema/Connector.js';
import { type EvseEntity, evseTable, tenantEvseTable } from '../schema/Evse.js';
import { evseTypeTable, tenantEvseTypeTable } from '../schema/EvseType.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository, type DrizzleWriteContext } from './Base.js';
import { toConnectorDto } from './Connector.js';

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

  private getEvseTypeTable(tenantId: number): typeof evseTypeTable {
    return this.useTenantSchema ? tenantEvseTypeTable(tenantId) : evseTypeTable;
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

  async commissionEvseForOcpp16Connector(
    tenantId: number,
    ocppConnectionName: string,
    connectorId: number,
  ): Promise<{ evseId: number; evseTypeConnectorId: number }> {
    // Both rows must land together: an EvseType without its Evse leaves the caller
    // without the FK pair it needs to insert a Connector, while the orphan persists.
    return await this.withAtomicWrite(async (ctx) => {
      const evseTypes = this.getEvseTypeTable(tenantId);
      const table = this.getTable(tenantId);

      // OCPP 1.6 has no native EVSE concept. Conservative default: each connector
      // maps to its own (Evse, EvseType) pair using the 1.6 connectorId as the
      // OCPP 2.0.1 evse id. connectorId is null because this EvseType denotes the
      // whole EVSE — the partial unique index `evse_types_tenantId_id` (WHERE
      // connectorId IS NULL) then permits exactly one such row per EVSE.
      const evseTypeWhere = and(
        eq(evseTypes.id, connectorId),
        isNull(evseTypes.connectorId),
        this.tenantFilter(evseTypes, tenantId),
      );
      let evseTypeRows = await ctx.db
        .select({ databaseId: evseTypes.databaseId })
        .from(evseTypes)
        .where(evseTypeWhere)
        .limit(1);

      if (!evseTypeRows[0]) {
        const inserted = await ctx.db
          .insert(evseTypes)
          .values({ tenantId, id: connectorId, connectorId: null })
          .onConflictDoNothing()
          .returning({ databaseId: evseTypes.databaseId });

        evseTypeRows = inserted.length
          ? inserted
          : await ctx.db
              .select({ databaseId: evseTypes.databaseId })
              .from(evseTypes)
              .where(evseTypeWhere)
              .limit(1);
      }

      const evseWhere = and(
        eq(table.ocppConnectionName, ocppConnectionName),
        eq(table.evseTypeId, connectorId),
        this.tenantFilter(table, tenantId),
      );
      let evseRows = (await ctx.db.select().from(table).where(evseWhere).limit(1)) as EvseEntity[];

      if (!evseRows[0]) {
        const stationId = await this.resolveStationId(tenantId, ocppConnectionName, undefined, ctx);
        const inserted = (await ctx.db
          .insert(table)
          .values({ tenantId, ocppConnectionName, evseTypeId: connectorId, stationId })
          .onConflictDoNothing()
          .returning()) as EvseEntity[];

        evseRows = inserted.length
          ? inserted
          : ((await ctx.db.select().from(table).where(evseWhere).limit(1)) as EvseEntity[]);

        if (inserted.length) {
          ctx.events.push({ name: 'created', payload: [this.toDto(inserted[0])] });
        }
      }

      return {
        evseId: evseRows[0].id,
        evseTypeConnectorId: evseTypeRows[0].databaseId,
      };
    });
  }
}
