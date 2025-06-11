// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';

export interface IChargingStationSequenceDto extends IBaseDto {
  stationId: string;
  type: string;
  value: number;
}
