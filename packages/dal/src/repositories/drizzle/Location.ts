// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { LocationDto } from '@citrineos/types';
import {
  type LocationEntity,
  locationTable,
  tenantLocationTable,
} from '../../db/drizzle/schema/Location.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './Base.js';

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

export class DrizzleLocationRepository extends DrizzleRepository<
  typeof locationTable,
  LocationDto
> {
  protected getTable(tenantId: number): typeof locationTable {
    return this.useTenantSchema ? tenantLocationTable(tenantId) : locationTable;
  }

  protected toDto(row: LocationEntity): LocationDto {
    return toLocationDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
