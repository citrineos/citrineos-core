// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { ChargingNeedsType } from '@dto/shared/charging-needs.dto';

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class NotifyEVChargingNeedsRequest {
  @IsNumber()
  evseId: number;

  @ValidateNested()
  @Type(() => ChargingNeedsType)
  chargingNeeds: ChargingNeedsType;

  @IsOptional()
  @IsNumber()
  maxScheduleTuples?: number;
}
