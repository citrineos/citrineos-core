// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';
import { IChargingStationDto } from './charging.station.dto';
import { Point } from 'geojson';
import { LocationFacilityType, LocationParkingType } from './enum';
import { LocationHours } from './json';

export interface ILocationDto extends IBaseDto {
  id?: number;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
  publishUpstream: boolean;
  timeZone: string;
  coordinates: Point;
  parkingType?: LocationParkingType | null;
  facilities?: LocationFacilityType[] | null;
  openingHours?: LocationHours | null;
  chargingPool?: IChargingStationDto[];
}

export enum LocationDtoProps {
  id = 'id',
  name = 'name',
  address = 'address',
  city = 'city',
  postalCode = 'postalCode',
  state = 'state',
  country = 'country',
  publishUpstream = 'publishUpstream',
  timeZone = 'timeZone',
  coordinates = 'coordinates',
  parkingType = 'parkingType',
  facilities = 'facilities',
  openingHours = 'openingHours',
  chargingPool = 'chargingPool',
}
