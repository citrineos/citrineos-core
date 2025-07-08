// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';
import { IChargingStationDto } from './charging.station.dto';

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
  coordinates: any;
  chargingPool: IChargingStationDto[];
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
  chargingPool = 'chargingPool',
}
