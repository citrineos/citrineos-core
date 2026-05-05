// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { ACChargingParametersType } from '@dto/shared/ac-charging-parameters.dto';
import { DCChargingParametersType } from '@dto/shared/dc-charging-parameters.dto';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class ChargingNeedsType {
  @IsString()
  requestedEnergyTransfer: string;

  @IsOptional()
  @IsString()
  departureTime?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ACChargingParametersType)
  acChargingParameters?: ACChargingParametersType;

  @IsOptional()
  @ValidateNested()
  @Type(() => DCChargingParametersType)
  dcChargingParameters?: DCChargingParametersType;
}
