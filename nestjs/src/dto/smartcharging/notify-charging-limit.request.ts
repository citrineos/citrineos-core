// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { ChargingLimitType } from '@dto/shared/charging-limit.dto';
import { ChargingScheduleType } from '@dto/shared/charging-schedule.dto';

/**
 * OCPP 2.0.1 / 2.1 NotifyChargingLimit request — charger reports an
 * externally-applied charging limit (e.g. grid operator throttling).
 */
export class NotifyChargingLimitRequest {
  @ValidateNested()
  @Type(() => ChargingLimitType)
  chargingLimit: ChargingLimitType;

  @IsOptional()
  @IsNumber()
  evseId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChargingScheduleType)
  chargingSchedule?: ChargingScheduleType[];
}
