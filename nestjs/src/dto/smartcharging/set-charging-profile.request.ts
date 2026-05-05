// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsNumber, ValidateNested } from 'class-validator';
import { ChargingProfileType } from '@dto/shared/charging-profile.dto';

/** OCPP 2.0.1 / 2.1 SetChargingProfile request. */

export class SetChargingProfileRequest {
  @IsNumber()
  evseId: number;

  @ValidateNested()
  @Type(() => ChargingProfileType)
  chargingProfile: ChargingProfileType;
}
