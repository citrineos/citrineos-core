// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * OCPP 2.0.1 / 2.1 PublishFirmware request — instructs a charger to
 * fetch a firmware bundle and host it for sibling chargers to pull.
 */
export class PublishFirmwareRequest {
  @IsString()
  location: string;

  @IsString()
  checksum: string;

  @IsNumber()
  requestId: number;

  @IsOptional()
  @IsNumber()
  retries?: number;

  @IsOptional()
  @IsNumber()
  retryInterval?: number;
}
