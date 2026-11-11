// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IEvseRepository } from '@dal/repositories/repositories.js';
import type { EvseDto } from '@citrineos/types';
import { and, asc, eq, isNull, or, sql } from 'drizzle-orm';
import {
  type ConnectorEntity,
  connectorTable,
  tenantConnectorTable,
} from '../../db/drizzle/schema/connector.js';
import { type EvseEntity, evseTable, tenantEvseTable } from '../../db/drizzle/schema/evse.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';
import { toConnectorDto } from './connector.js';
import { resolveStationId } from './resolve-station-id.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external EvseDto contract.
export function toEvseDto(entity: EvseEntity): EvseDto {
  const dto: Explicit<EvseDto> = {
    id: entity.id,
    stationId: entity.stationId,
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

  // ─── IEvseRepository methods ─────────────────────────────────────────────

  async readEvseByStationIdAndOcpp201EvseId(
    tenantId: number,
    ocppConnectionName: string,
    ocpp201EvseId: number,
  ): Promise<EvseDto | undefined> {
    const stationId = await resolveStationId(
      this.db,
      tenantId,
      ocppConnectionName,
      this.useTenantSchema,
    );
    if (stationId === undefined) {
      return undefined;
    }

    const table = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(table)
      .where(
        and(
          eq(table.stationId, stationId),
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
            eq(table.stationId, evse.stationId),
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
        { ...writableEvseColumns(evse), stationId: evse.stationId },
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
    const stationId = await resolveStationId(
      this.db,
      tenantId,
      ocppConnectionName,
      this.useTenantSchema,
    );
    if (stationId === undefined) {
      throw new Error(
        `Cannot auto-commission an EVSE: no charging station named ` +
          `'${ocppConnectionName}' exists in tenant ${tenantId}.`,
      );
    }

    const created = await this.insert(tenantId, { stationId });

    return { evseId: created.id! };
  }

  async readTenantIdByEvseDatabaseId(evseDatabaseId: number): Promise<number | undefined> {
    if (this.useTenantSchema) {
      // Each tenant's EVSEs live in that tenant's own schema, so there is no single table
      // to look an EVSE up in before the tenant is known.
      throw new Error('Resolving an EVSE to its tenant is not supported with schema-per-tenant');
    }
    const rows = await this.db
      .select({ tenantId: evseTable.tenantId })
      .from(evseTable)
      .where(eq(evseTable.id, evseDatabaseId))
      .limit(1);
    return rows[0]?.tenantId;
  }

  async readEvseById(tenantId: number, id: number): Promise<EvseDto | undefined> {
    const evse = await this.findById(tenantId, id);
    if (!evse) {
      return undefined;
    }
    const connectors = this.getConnectorTable(tenantId);
    const connectorRows = (await this.db
      .select()
      .from(connectors)
      .where(
        and(eq(connectors.evseId, id), this.tenantFilter(connectors, tenantId)),
      )) as ConnectorEntity[];
    return { ...evse, connectors: connectorRows.map(toConnectorDto) };
  }

  async readEvsesByEmi3Id(emi3EvseId: string): Promise<EvseDto[]> {
    if (this.useTenantSchema) {
      // Each tenant's EVSEs live in that tenant's own schema: there is no one table to search.
      throw new Error('Looking an EVSE up by eMI3 id is not supported with schema-per-tenant');
    }
    const normalized = emi3EvseId.replaceAll('*', '').toUpperCase();
    if (!normalized) {
      return [];
    }
    const rows = (await this.db
      .select()
      .from(evseTable)
      .where(
        and(
          sql`upper(replace(${evseTable.evseId}, '*', '')) = ${normalized}`,
          or(isNull(evseTable.removed), eq(evseTable.removed, false)),
        ),
      )
      .orderBy(asc(evseTable.id))) as EvseEntity[];
    return rows.map(toEvseDto);
  }
}
