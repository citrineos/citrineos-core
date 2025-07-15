// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from '../..';
import { IChargingScheduleDto } from './charging.schedule.dto';

export interface ISalesTariffDto extends IBaseDto {
  databaseId: number;
  id?: number;
  numEPriceLevels?: number | null;
  salesTariffDescription?: string | null;
  salesTariffEntry: [any, ...any[]];
  chargingScheduleDatabaseId: number;
  chargingSchedule: IChargingScheduleDto;
}
