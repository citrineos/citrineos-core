// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';
import { IChargingStationDto } from './charging.station.dto';

export interface ILocationDto extends IBaseDto {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
  coordinates: any;
  chargingStations: IChargingStationDto[];
}

export enum LocationDtoProps {
  id = 'id',
  name = 'name',
  address = 'address',
  city = 'city',
  postalCode = 'postalCode',
  state = 'state',
  country = 'country',
  coordinates = 'coordinates',
  chargingStations = 'chargingStations',
}
