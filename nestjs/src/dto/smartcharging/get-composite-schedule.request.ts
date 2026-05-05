// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ChargingRateUnitEnumType } from '@enums/charging-rate-unit.enum';

/** OCPP 2.0.1 / 2.1 GetCompositeSchedule request. */

export class GetCompositeScheduleRequest {
  @IsNumber()
  duration: number;

  @IsNumber()
  evseId: number;

  @IsOptional()
  @IsEnum(ChargingRateUnitEnumType)
  chargingRateUnit?: ChargingRateUnitEnumType;
}
