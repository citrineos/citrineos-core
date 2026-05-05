// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SignedMeterValueType } from '@dto/shared/signed-meter-value.dto';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class SampledValueType {
  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  context?: string;

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

  /**
   * Cryptographic envelope (V2G, OCMF, …) — present when the charging
   * station is configured to sign meter values. Validated by
   * `SignedMeterValueValidator` when `signedMeterValuesConfiguration`
   * is set in the system config.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => SignedMeterValueType)
  signedMeterValue?: SignedMeterValueType;
}
