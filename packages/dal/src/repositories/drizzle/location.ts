// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILocationRepository } from '@dal/repositories/repositories.js';
import type { LocationDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  type ChargingStationEntity,
  chargingStationTable,
  tenantChargingStationTable,
} from '../../db/drizzle/schema/charging-station.js';
import {
  type LocationEntity,
  locationTable,
  tenantLocationTable,
} from '../../db/drizzle/schema/location.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';
import { toChargingStationDto } from './charging-station.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external LocationDto contract.
export function toLocationDto(entity: LocationEntity): LocationDto {
  const dto: Explicit<LocationDto> = {
    id: entity.id,
    name: entity.name ?? '',
    address: entity.address ?? '',
    city: entity.city ?? '',
    postalCode: entity.postalCode ?? '',
    state: entity.state ?? '',
    country: entity.country ?? '',
    publishUpstream: entity.publishUpstream ?? true,
    timeZone: entity.timeZone ?? 'UTC',
    // Enum stored as string in the DB — cast back to the DTO's enum union.
    parkingType: entity.parkingType as LocationDto['parkingType'],
    facilities: entity.facilities,
    openingHours: entity.openingHours,
    // PostGIS point tuple → GeoJSON Point contract.
    coordinates: { type: 'Point' as const, coordinates: entity.coordinates },
    // Relations are not present on a flat DB row.
    chargingPool: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleLocationRepository
  extends DrizzleRepository<typeof locationTable, LocationDto>
  implements ILocationRepository
{
  protected getTable(tenantId: number): typeof locationTable {
    return this.useTenantSchema ? tenantLocationTable(tenantId) : locationTable;
  }

  protected toDto(row: LocationEntity): LocationDto {
    return toLocationDto(row);
  }

  private getChargingStationTable(tenantId: number): typeof chargingStationTable {
    return this.useTenantSchema ? tenantChargingStationTable(tenantId) : chargingStationTable;
  }

  async readLocationById(tenantId: number, id: number): Promise<LocationDto | undefined> {
    const table = this.getTable(tenantId);

    const rows = (await this.db
      .select()
      .from(table)
      .where(and(eq(table.id, id), this.tenantFilter(table, tenantId)))
      .limit(1)) as LocationEntity[];

    if (!rows[0]) {
      return undefined;
    }

    const stationTable = this.getChargingStationTable(tenantId);
    const stationRows = (await this.db
      .select()
      .from(stationTable)
      .where(
        and(eq(stationTable.locationId, id), this.tenantFilter(stationTable, tenantId)),
      )) as ChargingStationEntity[];

    return { ...this.toDto(rows[0]), chargingPool: stationRows.map(toChargingStationDto) };
  }
}
