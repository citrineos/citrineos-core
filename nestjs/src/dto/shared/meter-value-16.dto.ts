// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { SampledValue16Type } from '@dto/shared/sampled-value-16.dto';

/**
 * OCPP 1.6 MeterValue envelope. One timestamp + N sampled values, same
 * shape as 2.0.1 but referencing the 1.6 SampledValue shape (string
 * `value` instead of number).
 */
export class MeterValue16Type {
  @IsString()
  timestamp: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SampledValue16Type)
  sampledValue: SampledValue16Type[];
}
