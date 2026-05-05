// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { FirmwareType } from '@dto/shared/firmware.dto';

/** OCPP 2.0.1 / 2.1 UpdateFirmware request. */

export class UpdateFirmwareRequest {
  @IsNumber()
  requestId: number;

  @IsOptional()
  @IsNumber()
  retries?: number;

  @IsOptional()
  @IsNumber()
  retryInterval?: number;

  @ValidateNested()
  @Type(() => FirmwareType)
  firmware: FirmwareType;
}
