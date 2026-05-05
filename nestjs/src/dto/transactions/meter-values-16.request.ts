// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { MeterValue16Type } from '@dto/shared/meter-value-16.dto';

/**
 * OCPP 1.6 MeterValues request. Different shape from 2.0.1 —
 * `connectorId` and `transactionId` are top-level integers (no `evseId`
 * envelope), and `transactionId` is numeric.
 */
export class MeterValues16Request {
  @IsNumber()
  connectorId: number;

  @IsOptional()
  @IsNumber()
  transactionId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeterValue16Type)
  meterValue: MeterValue16Type[];
}
