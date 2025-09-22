// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IBaseDto } from './base.dto.js';
import { ChargingStationSequenceType } from '../../ocpp/model/requestIds.js';

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
