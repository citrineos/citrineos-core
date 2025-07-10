// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto, IChargingStationDto } from '../..';

export interface IEvseDto extends IBaseDto {
  id?: number;
  stationId: string;
  evseTypeId?: number;
  evseId: number;
  physicalReference?: string | null;
  removed?: boolean;
  chargingStation?: IChargingStationDto;
}

export enum EvseDtoProps {
  id = 'id',
  stationId = 'stationId',
  evseTypeId = 'evseTypeId',
  evseId = 'evseId',
  physicalReference = 'physicalReference',
  removed = 'removed',
  chargingStation = 'chargingStation',
}
