// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationDto } from '@citrineos/base';
import {
  type ChargingStationEntity,
  chargingStationTable,
  tenantChargingStationTable,
} from '../schema/ChargingStation.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

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

export class DrizzleChargingStationRepository extends DrizzleRepository<
  typeof chargingStationTable,
  ChargingStationDto
> {
  protected getTable(tenantId: number): typeof chargingStationTable {
    return this.useTenantSchema ? tenantChargingStationTable(tenantId) : chargingStationTable;
  }

  protected toDto(row: ChargingStationEntity): ChargingStationDto {
    return toChargingStationDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
