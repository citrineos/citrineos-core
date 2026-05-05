// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ChargingSchedulePeriodType } from '@dto/shared/charging-schedule-period.dto';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class ChargingScheduleType {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  startSchedule?: string;

  @IsNumber()
  duration: number;

  @IsString()
  chargingRateUnit: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChargingSchedulePeriodType)
  chargingSchedulePeriod: ChargingSchedulePeriodType[];

  @IsOptional()
  @IsNumber()
  minChargingRate?: number;
}
