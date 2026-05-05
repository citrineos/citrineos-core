// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsOptional, IsString } from 'class-validator';

/** OCPP 2.0.1 / 2.1 LogParametersType — `log` field of GetLog. */

export class LogParametersType {
  @IsString()
  remoteLocation: string;

  @IsOptional()
  @IsString()
  oldestTimestamp?: string;

  @IsOptional()
  @IsString()
  latestTimestamp?: string;
}
