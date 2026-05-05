// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { MeterValueType } from '@dto/shared/meter-value.dto';

/** OCPP 1.6 StopTransaction request. */

export class StopTransactionRequest {
  @IsNumber()
  transactionId: number;

  @IsNumber()
  meterStop: number;

  @IsString()
  timestamp: string;

  @IsString()
  @IsOptional()
  idTag?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeterValueType)
  transactionData?: MeterValueType[];
}
