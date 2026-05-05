// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsOptional, IsString } from 'class-validator';

/** OCPP 1.6 BootNotification request. */

export class BootNotification16Request {
  @IsString() chargePointModel: string;
  @IsString() chargePointVendor: string;
  @IsString() @IsOptional() firmwareVersion?: string;
  @IsString() @IsOptional() chargePointSerialNumber?: string;
  @IsString() @IsOptional() chargeBoxSerialNumber?: string;
  @IsString() @IsOptional() iccid?: string;
  @IsString() @IsOptional() imsi?: string;
  @IsString() @IsOptional() meterSerialNumber?: string;
  @IsString() @IsOptional() meterType?: string;
}
