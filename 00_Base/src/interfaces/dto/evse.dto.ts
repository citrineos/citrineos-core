// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IBaseDto, IChargingStationDto, IConnectorDto } from '../../index.js';

export interface IEvseDto extends IBaseDto {
  id?: number;
  stationId: string;
  evseTypeId?: number;
  evseId: string; // This is the eMI3 compliant EVSE ID
  physicalReference?: string | null;
  removed?: boolean;
  chargingStation?: IChargingStationDto;
  connectors?: IConnectorDto[] | null;
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
