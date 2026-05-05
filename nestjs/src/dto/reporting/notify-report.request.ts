// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ReportDataType } from '@dto/shared/report-data.dto';

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class NotifyReportRequest {
  @IsNumber()
  requestId: number;

  @IsString()
  generatedAt: string;

  @IsOptional()
  @IsBoolean()
  tbc?: boolean;

  @IsNumber()
  seqNo: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportDataType)
  reportData?: ReportDataType[];
}
