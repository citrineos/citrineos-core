// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { LogEnumType } from '@enums/log-type.enum';
import { LogParametersType } from '@dto/shared/log-parameters.dto';

/** OCPP 2.0.1 / 2.1 GetLog request. */

export class GetLogRequest {
  @IsEnum(LogEnumType)
  logType: LogEnumType;

  @IsNumber()
  requestId: number;

  @IsOptional()
  @IsNumber()
  retries?: number;

  @IsOptional()
  @IsNumber()
  retryInterval?: number;

  @ValidateNested()
  @Type(() => LogParametersType)
  log: LogParametersType;
}
