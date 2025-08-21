// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from '../../index.js';
import { IChargingProfileDto } from './charging.profile.dto.js';
import { ISalesTariffDto } from './sales.tariff.dto.js';

export interface IChargingScheduleDto extends IBaseDto {
  databaseId: number;
  id?: number;
  stationId: string;
  chargingRateUnit: any;
  chargingSchedulePeriod: [any, ...any[]];
  duration?: number | null;
  minChargingRate?: number | null;
  startSchedule?: string | null;
  timeBase?: string;
  chargingProfile?: IChargingProfileDto;
  chargingProfileDatabaseId?: number;
  salesTariff?: ISalesTariffDto;
}

export enum ChargingScheduleDtoProps {
  databaseId = 'databaseId',
  id = 'id',
  stationId = 'stationId',
  chargingRateUnit = 'chargingRateUnit',
  chargingSchedulePeriod = 'chargingSchedulePeriod',
  duration = 'duration',
  minChargingRate = 'minChargingRate',
  startSchedule = 'startSchedule',
  timeBase = 'timeBase',
  chargingProfile = 'chargingProfile',
  chargingProfileDatabaseId = 'chargingProfileDatabaseId',
  salesTariff = 'salesTariff',
}
