// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsOptional, IsString } from 'class-validator';

/**
 * OCPP 1.6 SampledValue. `value` is a STRING in 1.6 (numeric in 2.0.1)
 * — the charger's number formatting is preserved verbatim. All other
 * fields are optional and free-form strings (the spec enums are loose).
 */
export class SampledValue16Type {
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  measurand?: string;

  @IsOptional()
  @IsString()
  phase?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  unit?: string;
}
