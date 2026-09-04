// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IConnectorRepository } from '@dal/repositories/repositories.js';
import type { ConnectorDto, OCPP2_common_types } from '@citrineos/types';
import { and, eq, isNotNull } from 'drizzle-orm';
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
import { toEvseDto } from './evse.js';
import {
  type TariffEntity,
  tariffTable,
  tenantTariffTable,
} from '../../db/drizzle/schema/tariff.js';
import { toTariffDto } from './tariff.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ConnectorDto contract.
export function toConnectorDto(entity: ConnectorEntity): ConnectorDto {
  const dto: Explicit<ConnectorDto> = {
    id: entity.id,
    stationId: entity.stationId ?? undefined,
    ocppConnectionName: entity.ocppConnectionName,
    evseId: entity.evseId,
    connectorId: entity.connectorId ?? undefined,
    evseTypeConnectorId: entity.evseTypeConnectorId ?? undefined,
    // Enums stored as strings in the DB — cast back to the DTO's enum unions.
    status: entity.status as ConnectorDto['status'],
    type: entity.type as ConnectorDto['type'],
    format: entity.format as ConnectorDto['format'],
    errorCode: entity.errorCode as ConnectorDto['errorCode'],
    powerType: entity.powerType as ConnectorDto['powerType'],
    maximumAmperage: entity.maximumAmperage,
    maximumVoltage: entity.maximumVoltage,
    maximumPowerWatts: entity.maximumPowerWatts,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp ? entity.timestamp.toISOString() : '',
    info: entity.info,
    vendorId: entity.vendorId,
    vendorErrorCode: entity.vendorErrorCode,
    termsAndConditionsUrl: entity.termsAndConditionsUrl,
    // Relations are not present on a flat DB row.
    tariff: undefined,
    evse: undefined,
    chargingStation: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

function writableConnectorColumns(connector: Partial<ConnectorDto>) {
  return prune({
    ocppConnectionName: connector.ocppConnectionName,
    evseId: connector.evseId,
    connectorId: connector.connectorId,
    evseTypeConnectorId: connector.evseTypeConnectorId,
    status: connector.status,
    type: connector.type,
    format: connector.format,
    errorCode: connector.errorCode,
    powerType: connector.powerType,
    maximumAmperage: connector.maximumAmperage,
    maximumVoltage: connector.maximumVoltage,
    maximumPowerWatts: connector.maximumPowerWatts,
    timestamp: connector.timestamp ? new Date(connector.timestamp) : undefined,
    info: connector.info,
    vendorId: connector.vendorId,
    vendorErrorCode: connector.vendorErrorCode,
    termsAndConditionsUrl: connector.termsAndConditionsUrl,
  });
}

// Drops undefined values so `.set()` never blanks a column the caller left out
function prune<T extends object>(values: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export class DrizzleConnectorRepository
  extends DrizzleRepository<typeof connectorTable, ConnectorDto>
  implements IConnectorRepository
{
  protected getTable(tenantId: number): typeof connectorTable {
    return this.useTenantSchema ? tenantConnectorTable(tenantId) : connectorTable;
  }

  protected toDto(row: ConnectorEntity): ConnectorDto {
    return toConnectorDto(row);
  }

  private getEvseTable(tenantId: number): typeof evseTable {
    return this.useTenantSchema ? tenantEvseTable(tenantId) : evseTable;
  }

  private getTariffTable(tenantId: number): typeof tariffTable {
    return this.useTenantSchema ? tenantTariffTable(tenantId) : tariffTable;
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

  // attached evse explicitly.
  private async withEvse(tenantId: number, row: ConnectorEntity): Promise<ConnectorDto> {
    const evses = this.getEvseTable(tenantId);
    const evseRows = (await this.db
      .select()
      .from(evses)
      .where(and(eq(evses.id, row.evseId), this.tenantFilter(evses, tenantId)))
      .limit(1)) as EvseEntity[];

    return {
      ...this.toDto(row),
      evse: evseRows[0] ? toEvseDto(evseRows[0]) : undefined,
    };
  }

  // ─── IConnectorRepository methods ────────────────────────────────────────

  async readConnectorByStationIdAndOcpp16ConnectorId(
    tenantId: number,
    ocppConnectionName: string,
    ocpp16ConnectorId: number,
  ): Promise<ConnectorDto | undefined> {
    const table = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(table)
      .where(
        and(
          eq(table.ocppConnectionName, ocppConnectionName),
          eq(table.connectorId, ocpp16ConnectorId),
          this.tenantFilter(table, tenantId),
        ),
      )
      .limit(1)) as ConnectorEntity[];

    return rows[0] ? await this.withEvse(tenantId, rows[0]) : undefined;
  }

  async readConnectorByStationIdAndOcpp201EvseType(
    tenantId: number,
    ocppConnectionName: string,
    ocpp201EvseType: OCPP2_common_types.EVSEType,
  ): Promise<ConnectorDto | undefined> {
    const table = this.getTable(tenantId);
    const evses = this.getEvseTable(tenantId);

    const rows = await this.db
      .select({ connector: table, evse: evses })
      .from(table)
      .innerJoin(
        evses,
        and(
          eq(table.evseId, evses.id),
          eq(evses.evseTypeId, ocpp201EvseType.id),
          this.tenantFilter(evses, tenantId),
        ),
      )
      .where(
        and(
          eq(table.ocppConnectionName, ocppConnectionName),
          eq(table.evseTypeConnectorId, ocpp201EvseType.connectorId!),
          this.tenantFilter(table, tenantId),
        ),
      )
      .limit(1);

    if (!rows[0]) {
      return undefined;
    }

    return {
      ...this.toDto(rows[0].connector as ConnectorEntity),
      evse: toEvseDto(rows[0].evse as EvseEntity),
    };
  }

  private async upsertConnector(
    tenantId: number,
    connector: ConnectorDto,
    match: (table: ReturnType<DrizzleConnectorRepository['getTable']>) => ReturnType<typeof and>,
  ): Promise<ConnectorDto | undefined> {
    return await this.withAtomicWrite(async (ctx) => {
      const table = this.getTable(tenantId);

      const existing = (await ctx.db
        .select()
        .from(table)
        .where(and(match(table), this.tenantFilter(table, tenantId)))
        .limit(1)) as ConnectorEntity[];

      if (existing[0]) {
        return await this.updateById(
          tenantId,
          existing[0].id,
          { ...writableConnectorColumns(connector), updatedAt: new Date() },
          ctx,
        );
      }

      return await this.insert(
        tenantId,
        {
          ...writableConnectorColumns(connector),
          stationId: await this.resolveStationId(
            tenantId,
            connector.ocppConnectionName,
            connector.stationId,
            ctx,
          ),
        },
        ctx,
      );
    });
  }

  async createOrUpdateOcpp16Connector(
    tenantId: number,
    connector: ConnectorDto & { connectorId: number },
  ): Promise<ConnectorDto | undefined> {
    return await this.upsertConnector(tenantId, connector, (table) =>
      and(
        eq(table.ocppConnectionName, connector.ocppConnectionName),
        eq(table.connectorId, connector.connectorId),
      ),
    );
  }

  async createOrUpdateOcpp2Connector(
    tenantId: number,
    connector: ConnectorDto & { evseTypeConnectorId: number },
  ): Promise<ConnectorDto | undefined> {
    return await this.upsertConnector(tenantId, connector, (table) =>
      and(
        eq(table.evseId, connector.evseId),
        eq(table.evseTypeConnectorId, connector.evseTypeConnectorId),
      ),
    );
  }

  async readConnectorsWithTariffsByStationId(
    tenantId: number,
    ocppConnectionName: string,
    evseTypeId?: number,
  ): Promise<ConnectorDto[]> {
    const table = this.getTable(tenantId);
    const evses = this.getEvseTable(tenantId);
    const tariffs = this.getTariffTable(tenantId);

    const rows = await this.db
      .select({ connector: table, evse: evses, tariff: tariffs })
      .from(table)
      .innerJoin(
        evses,
        and(
          eq(table.evseId, evses.id),
          evseTypeId !== undefined ? eq(evses.evseTypeId, evseTypeId) : undefined,
          this.tenantFilter(evses, tenantId),
        ),
      )
      .innerJoin(tariffs, and(eq(table.tariffId, tariffs.id), this.tenantFilter(tariffs, tenantId)))
      .where(
        and(
          eq(table.ocppConnectionName, ocppConnectionName),
          isNotNull(table.tariffId),
          this.tenantFilter(table, tenantId),
        ),
      );

    return rows.map((row) => ({
      ...this.toDto(row.connector as ConnectorEntity),
      evse: toEvseDto(row.evse as EvseEntity),
      tariff: toTariffDto(row.tariff as TariffEntity),
    }));
  }

  async updateAllConnectorsByStationId(
    tenantId: number,
    stationId: number,
    value: Partial<ConnectorDto>,
  ): Promise<ConnectorDto[]> {
    const table = this.getTable(tenantId);

    const rows = (await this.db
      .update(table)
      .set({ ...writableConnectorColumns(value), updatedAt: new Date() })
      .where(and(eq(table.stationId, stationId), this.tenantFilter(table, tenantId)))
      .returning()) as ConnectorEntity[];

    const dtos = rows.map((row) => this.toDto(row));
    if (dtos.length > 0) {
      this.emit('updated', dtos);
    }
    return dtos;
  }
}
