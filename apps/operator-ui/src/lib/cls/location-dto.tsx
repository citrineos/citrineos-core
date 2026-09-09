// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ChargingStationDto,
  LocationDto,
  LocationFacilityEnumType,
  LocationParkingEnumType,
  TenantDto,
} from '@citrineos/types';
import type { Point } from 'geojson';

export class LocationClass implements LocationDto {
  tenantId!: number;
  tenant?: TenantDto;
  updatedAt?: Date;
  createdAt?: Date;

  id?: number;
  name!: string;
  address!: string;
  city!: string;
  postalCode!: string;
  state!: string;
  country!: string;
  publishUpstream!: boolean;
  timeZone!: string;
  parkingType?: LocationParkingEnumType | null;
  facilities?: LocationFacilityEnumType[] | null;
  coordinates!: Point;
  chargingPool?: ChargingStationDto[] | null;
}
