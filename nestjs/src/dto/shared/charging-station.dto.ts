// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { ModemType } from '@dto/shared/modem.dto';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class ChargingStationType {
  @IsString()
  model: string;

  @IsString()
  vendorName: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ModemType)
  modem?: ModemType;
}
