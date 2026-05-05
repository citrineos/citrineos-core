// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { SampledValueType } from '@dto/shared/sampled-value.dto';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class MeterValueType {
  @IsString()
  timestamp: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SampledValueType)
  sampledValue: SampledValueType[];
}
