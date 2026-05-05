// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsOptional, IsString } from 'class-validator';

/** OCPP 2.0.1 / 2.1 FirmwareType — used by UpdateFirmware. */

export class FirmwareType {
  @IsString()
  location: string;

  @IsString()
  retrieveDateTime: string;

  @IsOptional()
  @IsString()
  installDateTime?: string;

  @IsOptional()
  @IsString()
  signingCertificate?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
