// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * OCPP 1.6 GetDiagnostics request. The 1.6 equivalent of the 2.0.1 GetLog
 * (DiagnosticsLog variant) — flat shape, no `LogParametersType` wrapper.
 */
export class GetDiagnostics16Request {
  @IsString()
  location: string;

  @IsOptional()
  @IsNumber()
  retries?: number;

  @IsOptional()
  @IsNumber()
  retryInterval?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  stopTime?: string;
}
