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
import { MonitoringDataType } from '@dto/shared/monitoring-data.dto';

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class NotifyMonitoringReportRequest {
  @IsNumber()
  requestId: number;

  @IsBoolean()
  tbc: boolean;

  @IsNumber()
  seqNo: number;

  @IsString()
  generatedAt: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MonitoringDataType)
  monitor?: MonitoringDataType[];
}
