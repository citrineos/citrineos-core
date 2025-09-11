// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IBaseDto } from './base.dto';
import { ChargingStationSequenceType } from '../../ocpp/model/requestIds';

export interface IChargingStationSequenceDto extends IBaseDto {
  stationId: string;
  type: ChargingStationSequenceType;
  value: number;
}

export enum ChargingStationSequenceDtoProps {
  stationId = 'stationId',
  type = 'type',
  value = 'value',
}
