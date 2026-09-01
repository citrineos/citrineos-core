// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IChargingStationRepository } from '@/dal/index.js';
import type { ChargingStationDto, OCPPVersion } from '@citrineos/types';
import { and, eq, inArray } from 'drizzle-orm';
import {
  type ChargingStationEntity,
  chargingStationTable,
  tenantChargingStationTable,
} from '../schema/ChargingStation.js';
import { type ConnectorEntity, connectorTable, tenantConnectorTable } from '../schema/Connector.js';
import { type EvseEntity, evseTable, tenantEvseTable } from '../schema/Evse.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';
import { toConnectorDto } from './Connector.js';
import { toEvseDto } from './Evse.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingStationDto contract.
export function toChargingStationDto(entity: ChargingStationEntity): ChargingStationDto {
  const dto: Explicit<ChargingStationDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    isOnline: entity.isOnline ?? false,
    // Enum stored as string in the DB — cast back to the DTO's enum union.
    protocol: entity.protocol as ChargingStationDto['protocol'],
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    latestOcppMessageTimestamp: entity.latestOcppMessageTimestamp
      ? entity.latestOcppMessageTimestamp.toISOString()
      : null,
    chargePointVendor: entity.chargePointVendor,
    chargePointModel: entity.chargePointModel,
    chargePointSerialNumber: entity.chargePointSerialNumber,
    chargeBoxSerialNumber: entity.chargeBoxSerialNumber,
    firmwareVersion: entity.firmwareVersion,
    iccid: entity.iccid,
    imsi: entity.imsi,
    meterType: entity.meterType,
    meterSerialNumber: entity.meterSerialNumber,
    // PostGIS point tuple → GeoJSON Point contract.
    coordinates: entity.coordinates
      ? { type: 'Point' as const, coordinates: entity.coordinates }
      : null,
    floorLevel: entity.floorLevel,
    parkingRestrictions: entity.parkingRestrictions,
    capabilities: entity.capabilities,
    use16StatusNotification0: entity.use16StatusNotification0,
    locationId: entity.locationId,
    // Relations are not present on a flat DB row.
    networkProfiles: undefined,
    evses: undefined,
    connectors: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

function writableStationColumns(chargingStation: ChargingStationDto) {
  return {
    locationId: chargingStation.locationId,
    chargePointVendor: chargingStation.chargePointVendor,
    chargePointModel: chargingStation.chargePointModel,
    chargePointSerialNumber: chargingStation.chargePointSerialNumber,
    chargeBoxSerialNumber: chargingStation.chargeBoxSerialNumber,
    firmwareVersion: chargingStation.firmwareVersion,
    iccid: chargingStation.iccid,
    imsi: chargingStation.imsi,
    meterType: chargingStation.meterType,
    meterSerialNumber: chargingStation.meterSerialNumber,
  };
}

// Full scalar column set for an insert built straight from a DTO.
function toStationColumns(chargingStation: ChargingStationDto) {
  return {
    ...writableStationColumns(chargingStation),
    ocppConnectionName: chargingStation.ocppConnectionName,
    isOnline: chargingStation.isOnline,
    protocol: chargingStation.protocol,
    latestOcppMessageTimestamp: chargingStation.latestOcppMessageTimestamp
      ? new Date(chargingStation.latestOcppMessageTimestamp)
      : null,
    coordinates: chargingStation.coordinates?.coordinates,
    floorLevel: chargingStation.floorLevel,
    parkingRestrictions: chargingStation.parkingRestrictions,
    capabilities: chargingStation.capabilities,
    use16StatusNotification0: chargingStation.use16StatusNotification0,
  };
}

export class DrizzleChargingStationRepository
  extends DrizzleRepository<typeof chargingStationTable, ChargingStationDto>
  implements IChargingStationRepository
{
  protected getTable(tenantId: number): typeof chargingStationTable {
    return this.useTenantSchema ? tenantChargingStationTable(tenantId) : chargingStationTable;
  }

  protected toDto(row: ChargingStationEntity): ChargingStationDto {
    return toChargingStationDto(row);
  }

  private getEvseTable(tenantId: number): typeof evseTable {
    return this.useTenantSchema ? tenantEvseTable(tenantId) : evseTable;
  }

  private getConnectorTable(tenantId: number): typeof connectorTable {
    return this.useTenantSchema ? tenantConnectorTable(tenantId) : connectorTable;
  }

  private async findChargingStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<ChargingStationEntity | undefined> {
    const table = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(table)
      .where(
        and(eq(table.ocppConnectionName, ocppConnectionName), this.tenantFilter(table, tenantId)),
      )
      .limit(1)) as ChargingStationEntity[];
    return rows[0];
  }

  // ─── IChargingStationRepository methods ──────────────────────────────────

  async readChargingStationByStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<ChargingStationDto | undefined> {
    const station = await this.findChargingStation(tenantId, ocppConnectionName);
    if (!station) {
      return undefined;
    }

    const evses = this.getEvseTable(tenantId);
    const evseRows = (await this.db
      .select()
      .from(evses)
      .where(
        and(eq(evses.stationId, station.id), this.tenantFilter(evses, tenantId)),
      )) as EvseEntity[];

    const connectorsByEvseId = new Map<number, ConnectorEntity[]>();
    if (evseRows.length > 0) {
      const connectors = this.getConnectorTable(tenantId);
      const connectorRows = (await this.db
        .select()
        .from(connectors)
        .where(
          and(
            inArray(
              connectors.evseId,
              evseRows.map((evse) => evse.id),
            ),
            this.tenantFilter(connectors, tenantId),
          ),
        )) as ConnectorEntity[];

      for (const connector of connectorRows) {
        const siblings = connectorsByEvseId.get(connector.evseId) ?? [];
        siblings.push(connector);
        connectorsByEvseId.set(connector.evseId, siblings);
      }
    }

    return {
      ...this.toDto(station),
      evses: evseRows.map((evse) => ({
        ...toEvseDto(evse),
        connectors: (connectorsByEvseId.get(evse.id) ?? []).map(toConnectorDto),
      })),
    };
  }

  async setChargingStationIsOnlineAndOCPPVersion(
    tenantId: number,
    ocppConnectionName: string,
    isOnline: boolean,
    ocppVersion: OCPPVersion | null,
    connectedWebsocketServerConfigId?: string | null,
  ): Promise<ChargingStationDto | undefined> {
    const values = {
      isOnline,
      protocol: ocppVersion,
      connectedWebsocketServerConfigId: connectedWebsocketServerConfigId ?? null,
    };

    const existing = await this.findChargingStation(tenantId, ocppConnectionName);

    if (!existing) {
      // A station going offline that was never registered is a no-op, not a reason
      // to create a row — matches the Sequelize implementation.
      if (!isOnline) {
        this.logger.debug(
          `setChargingStationIsOnlineAndOCPPVersion: No charging station found for tenant ${tenantId} with ocppConnectionName ${ocppConnectionName} while going offline; skipping.`,
        );
        return undefined;
      }
      return await this.insert(tenantId, { ocppConnectionName, ...values });
    }

    return await this.updateById(tenantId, existing.id, { ...values, updatedAt: new Date() });
  }

  async doesChargingStationExistByStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<boolean> {
    const table = this.getTable(tenantId);
    const rows = await this.db
      .select({ id: table.id })
      .from(table)
      .where(
        and(eq(table.ocppConnectionName, ocppConnectionName), this.tenantFilter(table, tenantId)),
      )
      .limit(1);
    return rows.length > 0;
  }

  async createOrUpdateChargingStation(
    tenantId: number,
    chargingStation: ChargingStationDto,
  ): Promise<ChargingStationDto> {
    chargingStation.tenantId = tenantId;

    if (!chargingStation.ocppConnectionName) {
      return await this.insert(tenantId, toStationColumns(chargingStation));
    }

    const existing = await this.findChargingStation(tenantId, chargingStation.ocppConnectionName);

    if (!existing) {
      return await this.insert(tenantId, {
        ocppConnectionName: chargingStation.ocppConnectionName,
        ...writableStationColumns(chargingStation),
      });
    }

    const updated = await this.updateById(tenantId, existing.id, {
      ...writableStationColumns(chargingStation),
      updatedAt: new Date(),
    });
    // updateById only returns undefined when the row vanished between the two
    // statements; the caller's contract is non-optional, so fall back to what we read.
    return updated ?? this.toDto(existing);
  }

  async updateChargingStationTimestamp(
    tenantId: number,
    ocppConnectionName: string,
    timestamp: string,
  ): Promise<void> {
    const table = this.getTable(tenantId);
    await this.db
      .update(table)
      .set({ latestOcppMessageTimestamp: new Date(timestamp) })
      .where(
        and(eq(table.ocppConnectionName, ocppConnectionName), this.tenantFilter(table, tenantId)),
      );
  }
}
