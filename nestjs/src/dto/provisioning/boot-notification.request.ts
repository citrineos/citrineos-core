// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { BootReasonEnumType } from '@enums/boot-reason.enum';
import { ChargingStationType } from '@dto/shared/charging-station.dto';

/** OCPP 2.0.1 / 2.1 BootNotification request. */

export class BootNotificationRequest {
  @ValidateNested()
  @Type(() => ChargingStationType)
  chargingStation: ChargingStationType;

  @IsEnum(BootReasonEnumType)
  reason: BootReasonEnumType;
}
