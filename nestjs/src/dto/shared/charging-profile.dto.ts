// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ChargingScheduleType } from '@dto/shared/charging-schedule.dto';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class ChargingProfileType {
  @IsNumber()
  id: number;

  @IsNumber()
  stackLevel: number;

  @IsString()
  chargingProfilePurpose: string;

  @IsString()
  chargingProfileKind: string;

  @IsOptional()
  @IsString()
  recurrencyKind?: string;

  @IsOptional()
  @IsString()
  validFrom?: string;

  @IsOptional()
  @IsString()
  validTo?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChargingScheduleType)
  chargingSchedule: ChargingScheduleType[];
}
