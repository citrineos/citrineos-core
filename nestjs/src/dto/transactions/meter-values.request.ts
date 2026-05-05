// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { MeterValueType } from '@dto/shared/meter-value.dto';

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class MeterValuesRequest {
  @IsNumber()
  evseId: number;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeterValueType)
  meterValue: MeterValueType[];
}
