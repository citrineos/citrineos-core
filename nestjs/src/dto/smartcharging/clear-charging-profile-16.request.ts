// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ChargingProfilePurpose16 } from '@enums/charging-profile-purpose-16.enum';

/**
 * OCPP 1.6 ClearChargingProfile request. All four fields optional —
 * empty body clears every profile on the charger per the spec.
 */
export class ClearChargingProfile16Request {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsNumber()
  connectorId?: number;

  @IsOptional()
  @IsEnum(ChargingProfilePurpose16)
  chargingProfilePurpose?: ChargingProfilePurpose16;

  @IsOptional()
  @IsNumber()
  stackLevel?: number;
}
